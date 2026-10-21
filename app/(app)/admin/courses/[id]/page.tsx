'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Clock,
  EyeOff,
  FileStack,
  FileText,
  LayoutDashboard,
  MapPin,
  Pencil,
  Users,
} from 'lucide-react';
import { applications, attempts, courses, forms, rounds, scores, users } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { thaiDateRange } from '@/lib/format';
import { averagePractical } from '@/lib/scoring';
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  CardHeader,
  DescriptionList,
  EmptyState,
  PageHeader,
  Skeleton,
  Tabs,
} from '@/components/ui';
import CourseFormDialog from '@/components/admin/CourseFormDialog';
import { coursePhase, PHASE_META } from '@/components/admin/courseState';
import ApplicantsTab from '@/components/admin/hub/ApplicantsTab';
import TheoryTab from '@/components/admin/hub/TheoryTab';
import PracticalTab from '@/components/admin/hub/PracticalTab';
import type { HubData } from '@/components/admin/hub/types';

type Tab = 'overview' | 'applicants' | 'theory' | 'practical';
const TABS: Tab[] = ['overview', 'applicants', 'theory', 'practical'];

function CourseHub() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const search = useSearchParams();
  const tabParam = search.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'overview';
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading, error, reload } = useLoad<HubData>(async () => {
    const [course, apps, fs, att, rs, staff] = await Promise.all([
      courses.get(id),
      applications.list({ trainingId: id }),
      forms.list({ trainingId: id }),
      attempts.list({ trainingId: id }),
      rounds.list({ trainingId: id }),
      users.staff(),
    ]);
    const evaluatorIds = rs.flatMap((r) => r.evaluator_ids);
    const [people, sc] = await Promise.all([
      users.byIds(Array.from(new Set([...apps.map((a) => a.user_id), ...evaluatorIds]))),
      scores.list({ roundIds: rs.map((r) => r.id) }),
    ]);
    return {
      course,
      apps,
      forms: fs,
      attempts: att,
      rounds: rs,
      scores: sc,
      staff,
      userMap: new Map(people.map((u) => [u.id, u])),
    };
  }, [id]);

  const setTab = (t: Tab) => router.replace(`/admin/courses/${id}${t === 'overview' ? '' : `?tab=${t}`}`, { scroll: false });

  if (error) {
    return (
      <>
        <PageHeader title="หลักสูตร" breadcrumbs={[{ label: 'หลักสูตร', href: '/admin/courses' }, { label: 'ไม่พบข้อมูล' }]} />
        <Callout tone="red" title="เปิดหลักสูตรไม่สำเร็จ">
          {error}
        </Callout>
      </>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { course, apps } = data;
  const phase = PHASE_META[coursePhase(course)];
  const pending = apps.filter((a) => a.status === 'รอพิจารณา').length;
  const theoryCount = data.forms.filter((f) => f.exam_type === 'theory').length;
  const practicalCount = data.forms.filter((f) => f.exam_type === 'practical').length;

  // ----- funnel -----
  const approved = apps.filter((a) => a.status === 'อนุมัติ');
  const tookTheory = approved.filter((a) => data.attempts.some((x) => x.application_id === a.id && x.status !== 'in_progress'));
  const practicalDone = approved.filter((a) => {
    const r = data.rounds.find((x) => x.id === a.practical_round_id);
    if (!r) return false;
    const avg = averagePractical(
      data.scores.filter((s) => s.application_id === a.id && s.round_id === r.id),
      r.evaluator_ids,
      0
    );
    return avg.complete;
  });
  const submitted = apps.filter((a) => ['submitted', 'approved'].includes(a.approval_status));
  const certified = apps.filter((a) => a.approval_status === 'approved' && a.certificate_no);
  const funnel = [
    { label: 'สมัคร', value: apps.length, icon: Users },
    { label: 'มีสิทธิ์สอบ', value: approved.length, icon: BookOpen },
    { label: 'สอบทฤษฎีแล้ว', value: tookTheory.length, icon: FileText },
    { label: 'ประเมินปฏิบัติครบ', value: practicalDone.length, icon: ClipboardCheck },
    { label: 'ส่งผอ.อนุมัติ', value: submitted.length, icon: FileStack },
    { label: 'ได้ใบประกาศ', value: certified.length, icon: Award },
  ];
  const funnelMax = Math.max(1, apps.length);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หลักสูตร', href: '/admin/courses' }, { label: course.course_name }]}
        title={course.course_name}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {thaiDateRange(course.startswith_date, course.endswith_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {course.traning_hours} ชั่วโมง
            </span>
            {course.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {course.location}
              </span>
            )}
          </span>
        }
        eyebrow={
          <span className="inline-flex items-center gap-2 normal-case tracking-normal">
            <Badge tone={phase.tone} dot>
              {phase.label}
            </Badge>
            {course.is_published === false && (
              <Badge icon={<EyeOff className="h-3 w-3" />}>ซ่อนจากผู้สมัคร</Badge>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              แก้ไขหลักสูตร
            </Button>
            <ButtonLink href={`/admin/results?course=${course.id}`} variant="dark" icon={<FileStack className="h-4 w-4" />}>
              ผลคะแนน
            </ButtonLink>
          </>
        }
      />

      <Tabs<Tab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'overview', label: 'ภาพรวม', icon: <LayoutDashboard className="h-4 w-4" /> },
          { value: 'applicants', label: 'ผู้สมัคร', icon: <Users className="h-4 w-4" />, count: pending || undefined },
          { value: 'theory', label: 'ข้อสอบทฤษฎี', icon: <FileText className="h-4 w-4" />, count: theoryCount },
          { value: 'practical', label: 'ปฏิบัติและรอบสอบ', icon: <ClipboardCheck className="h-4 w-4" />, count: data.rounds.length },
        ]}
      />

      <div key={tab} className="animate-fade-up">
        {tab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="เส้นทางของผู้สมัคร" description="จากการสมัครจนถึงการได้รับใบประกาศนียบัตร" />
              <div className="space-y-3.5 p-5 sm:p-6">
                {funnel.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-700">{f.label}</span>
                          <span className="font-display font-semibold text-zinc-950 tabular">{f.value}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width] duration-700"
                            style={{ width: `${(f.value / funnelMax) * 100}%`, opacity: 1 - i * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader title="ข้อมูลหลักสูตร" />
                <div className="px-5 pb-2 sm:px-6">
                  <DescriptionList
                    items={[
                      { label: 'ชื่ออังกฤษ', value: course.course_name_en || '—' },
                      { label: 'หน่วยงาน', value: course.agency_name || '—' },
                      { label: 'สาขา / ระดับ', value: [course.branch_name, course.level_name].filter(Boolean).join(' · ') || '—' },
                      { label: 'รับสูงสุด', value: `${course.limit_course} คน` },
                      { label: 'ผู้รับผิดชอบ', value: course.executive_name || '—' },
                      { label: 'ชุดข้อสอบทฤษฎี', value: `${theoryCount} ชุด` },
                      { label: 'แบบประเมินปฏิบัติ', value: `${practicalCount} แบบ · ${data.rounds.length} รอบสอบ` },
                    ]}
                  />
                </div>
              </Card>
              {course.description ? (
                <Card className="p-5 sm:p-6">
                  <h3 className="eyebrow mb-2">รายละเอียด</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{course.description}</p>
                </Card>
              ) : (
                <Card>
                  <EmptyState compact title="ยังไม่มีรายละเอียดหลักสูตร" description="เพิ่มวัตถุประสงค์และคุณสมบัติผู้สมัครเพื่อช่วยผู้สมัครตัดสินใจ" action={<Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>เพิ่มรายละเอียด</Button>} />
                </Card>
              )}
            </div>
          </div>
        )}
        {tab === 'applicants' && <ApplicantsTab data={data} reload={reload} />}
        {tab === 'theory' && <TheoryTab data={data} reload={reload} />}
        {tab === 'practical' && <PracticalTab data={data} reload={reload} />}
      </div>

      <CourseFormDialog open={editOpen} course={course} onClose={() => setEditOpen(false)} onSaved={() => reload()} />
    </>
  );
}

export default function CourseHubPage() {
  return (
    <Suspense>
      <CourseHub />
    </Suspense>
  );
}
