'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CirclePlay,
  Clock,
  FileText,
  GraduationCap,
  Hourglass,
  ListChecks,
  Lock,
  MapPin,
  Printer,
  RotateCcw,
  Target,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import { applications, attempts } from '@/lib/api';
import { cn } from '@/lib/cn';
import { APPLICANT_TYPES } from '@/lib/constants';
import { errorMessage, num, thaiDate, thaiDateRange, thaiDateTime } from '@/lib/format';
import type { TestForm, TrainingApplication, TrainingCourse } from '@/lib/types';
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  ChoiceCard,
  Dialog,
  EmptyState,
  PageHeader,
  Progress,
  SearchInput,
  Skeleton,
  Switch,
  Tabs,
  useConfirm,
} from '@/components/ui';
import { ApprovalBadge, EnrollmentBadge } from '@/components/status';
import { assignedTheoryForms, formStatus, missingDocuments, useStudentData, type FormStatus, type StudentData } from '@/components/student/data';

type Tab = 'mine' | 'open';

function courseMatches(c: TrainingCourse, q: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return [c.course_name, c.course_name_en, c.branch_name, c.agency_name, c.level_name, c.location].some((v) => v?.toLowerCase().includes(s));
}

function courseEnded(c: TrainingCourse) {
  if (!c.endswith_date) return false;
  const end = new Date(c.endswith_date);
  end.setHours(23, 59, 59);
  return end.getTime() < Date.now();
}

function CoursesInner() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, loading, error, reload } = useStudentData(user);
  const [query, setQuery] = useState('');
  const [applyTo, setApplyTo] = useState<TrainingCourse | null>(null);
  const [startForm, setStartForm] = useState<{ form: TestForm; app: TrainingApplication; course?: TrainingCourse } | null>(null);

  const myIds = useMemo(() => new Set(data?.myApps.map((a) => a.training_id)), [data]);
  const mine = useMemo(() => (data ? data.myApps.filter((a) => courseMatches(data.courseById.get(a.training_id) || ({} as TrainingCourse), query)) : []), [data, query]);
  const open = useMemo(
    () => (data ? data.courses.filter((c) => c.is_published !== false && !myIds.has(c.id) && !courseEnded(c) && courseMatches(c, query)) : []),
    [data, myIds, query]
  );

  const defaultTab: Tab = data && data.myApps.length === 0 ? 'open' : 'mine';
  const requested = params.get('tab');
  const tab: Tab = requested === 'mine' || requested === 'open' ? requested : defaultTab;
  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  return (
    <div>
      <PageHeader
        title="หลักสูตรและการสอบ"
        description="สมัครหลักสูตร ติดตามสิทธิ์สอบ และเข้าสอบภาคทฤษฎีออนไลน์"
        actions={<SearchInput value={query} onChange={setQuery} placeholder="ค้นหาหลักสูตร สาขา หน่วยงาน…" className="w-full sm:w-72" />}
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'mine', label: 'หลักสูตรของฉัน', icon: <GraduationCap className="h-4 w-4" />, count: data?.myApps.length },
          { value: 'open', label: 'เปิดรับสมัคร', icon: <BookOpen className="h-4 w-4" />, count: data ? open.length : undefined },
        ]}
      />

      {error && (
        <Callout tone="red" className="mb-6" title="โหลดข้อมูลไม่สำเร็จ" action={<button onClick={reload} className="text-sm font-medium underline">ลองใหม่</button>}>
          {error}
        </Callout>
      )}

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="space-y-4 p-6">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      ) : tab === 'mine' ? (
        mine.length === 0 ? (
          <Card>
            <EmptyState
              icon={<GraduationCap className="h-5 w-5" />}
              title={query ? 'ไม่พบหลักสูตรที่ค้นหา' : 'ยังไม่ได้สมัครหลักสูตร'}
              description={query ? 'ลองใช้คำค้นอื่น' : 'ดูหลักสูตรที่เปิดรับสมัครและสมัครได้ทันที'}
              action={!query && <Button onClick={() => setTab('open')}>ดูหลักสูตรที่เปิดรับสมัคร</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {mine.map((app) => (
              <MyCourseCard key={app.id} app={app} data={data} onStart={(form) => setStartForm({ form, app, course: data.courseById.get(app.training_id) })} onChanged={reload} />
            ))}
          </div>
        )
      ) : open.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title={query ? 'ไม่พบหลักสูตรที่ค้นหา' : 'ยังไม่มีหลักสูตรเปิดรับสมัครเพิ่มเติม'}
            description={query ? 'ลองใช้คำค้นอื่น' : 'ติดตามหลักสูตรใหม่ได้เร็ว ๆ นี้'}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {open.map((c, i) => (
            <OpenCourseCard key={c.id} course={c} used={data.seatsUsed.get(c.id) || 0} index={i} onApply={() => setApplyTo(c)} />
          ))}
        </div>
      )}

      <ApplyDialog
        course={applyTo}
        onClose={() => setApplyTo(null)}
        onApplied={() => {
          setApplyTo(null);
          reload();
          setTab('mine');
        }}
      />
      <PreExamDialog target={startForm} onClose={() => setStartForm(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-zinc-500">
      <span className="text-zinc-400">{icon}</span>
      {children}
    </span>
  );
}

function OpenCourseCard({ course, used, index, onApply }: { course: TrainingCourse; used: number; index: number; onApply: () => void }) {
  const limit = Number(course.limit_course) || 0;
  const full = limit > 0 && used >= limit;
  const left = limit > 0 ? Math.max(0, limit - used) : null;
  return (
    <Card className="group flex animate-fade-up flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="flex flex-wrap gap-1.5">
        {course.branch_name && <Badge>{course.branch_name}</Badge>}
        {course.level_name && <Badge tone="dark">{course.level_name}</Badge>}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">{course.course_name}</h3>
      {course.course_name_en && <p className="mt-0.5 text-[0.8125rem] text-zinc-400">{course.course_name_en}</p>}
      {course.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{course.description}</p>}

      <div className="mt-4 flex flex-col gap-1.5">
        <Meta icon={<CalendarDays className="h-3.5 w-3.5" />}>{thaiDateRange(course.startswith_date, course.endswith_date)}</Meta>
        <Meta icon={<Clock className="h-3.5 w-3.5" />}>{num(course.traning_hours)} ชั่วโมง</Meta>
        {course.agency_name && <Meta icon={<Building2 className="h-3.5 w-3.5" />}>{course.agency_name}</Meta>}
        {course.location && <Meta icon={<MapPin className="h-3.5 w-3.5" />}>{course.location}</Meta>}
      </div>

      <div className="mt-auto pt-5">
        {limit > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-[0.75rem]">
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Users className="h-3 w-3" />
                ผู้สมัคร {used}/{limit}
              </span>
              <span className={cn('font-medium', full ? 'text-brand-600' : left! <= 5 ? 'text-amber-600' : 'text-emerald-600')}>
                {full ? 'เต็มแล้ว' : `เหลือ ${left} ที่`}
              </span>
            </div>
            <Progress value={used} max={limit} tone={full ? 'red' : left! <= 5 ? 'amber' : 'green'} />
          </div>
        )}
        <Button className="w-full" disabled={full} onClick={onApply} iconRight={!full && <ArrowRight className="h-4 w-4" />}>
          {full ? 'ที่นั่งเต็ม' : 'สมัครหลักสูตรนี้'}
        </Button>
      </div>
    </Card>
  );
}

const STATE_UI: Record<FormStatus['state'], { label: string; tone: 'green' | 'amber' | 'neutral' | 'blue' | 'red' }> = {
  open: { label: 'เปิดสอบ', tone: 'green' },
  in_progress: { label: 'กำลังทำ', tone: 'amber' },
  upcoming: { label: 'ยังไม่เปิด', tone: 'neutral' },
  closed: { label: 'ปิดแล้ว', tone: 'neutral' },
  done: { label: 'ทำครบแล้ว', tone: 'blue' },
  not_eligible: { label: 'รอสิทธิ์สอบ', tone: 'neutral' },
};

function MyCourseCard({
  app,
  data,
  onStart,
  onChanged,
}: {
  app: TrainingApplication;
  data: StudentData;
  onStart: (f: TestForm) => void;
  onChanged: () => void;
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const course = data.courseById.get(app.training_id);
  const tries = data.myAttempts.filter((a) => a.training_id === app.training_id);
  const theory = assignedTheoryForms(app, data);
  const round = app.practical_round_id ? data.myRounds.get(app.practical_round_id) : undefined;
  const hasPractical = data.practicalForms.some((f) => f.training_id === app.training_id);
  // Withdrawing deletes the application (cascading to practical scores), so only before any exam activity.
  const canWithdraw = tries.length === 0 && app.approval_status === 'none' && !app.practical_round_id;
  const [busy, setBusy] = useState(false);

  const withdraw = async () => {
    const ok = await confirm({
      title: 'ยกเลิกการสมัครหลักสูตรนี้?',
      description: `ใบสมัคร "${course?.course_name}" จะถูกลบ และที่นั่งจะคืนให้ผู้สมัครคนอื่น`,
      confirmLabel: 'ยกเลิกการสมัคร',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await applications.withdraw(app.id);
      toast.success('ยกเลิกการสมัครแล้ว');
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <EnrollmentBadge status={app.status} />
            {app.approval_status !== 'none' && <ApprovalBadge status={app.approval_status} />}
          </div>
          <h3 className="mt-2.5 text-lg font-semibold leading-snug">{course?.course_name || `หลักสูตร #${app.training_id}`}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {course && <Meta icon={<CalendarDays className="h-3.5 w-3.5" />}>{thaiDateRange(course.startswith_date, course.endswith_date)}</Meta>}
            {course && <Meta icon={<Clock className="h-3.5 w-3.5" />}>{num(course.traning_hours)} ชม.</Meta>}
            {course?.location && <Meta icon={<MapPin className="h-3.5 w-3.5" />}>{course.location}</Meta>}
            <Meta icon={<FileText className="h-3.5 w-3.5" />}>สมัครเมื่อ {thaiDate(app.created_at)}</Meta>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink href={`/print/application?course=${app.training_id}`} variant="outline" size="sm" icon={<Printer className="h-3.5 w-3.5" />}>
            พิมพ์ใบสมัคร
          </ButtonLink>
          {canWithdraw && (
            <Button variant="ghost" size="sm" onClick={withdraw} loading={busy} icon={<Trash2 className="h-3.5 w-3.5" />} className="text-zinc-500 hover:text-brand-700">
              ยกเลิก
            </Button>
          )}
        </div>
      </div>

      {app.status === 'ปฏิเสธ' ? (
        <div className="border-t border-zinc-100 px-5 py-4 text-sm text-zinc-500 sm:px-6">ใบสมัครนี้ไม่ผ่านการคัดเลือก หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่</div>
      ) : (
        <div className="grid gap-px border-t border-zinc-100 bg-zinc-100 lg:grid-cols-2">
          {/* Theory */}
          <div className="bg-surface p-5 sm:p-6">
            <div className="eyebrow mb-3">ภาคทฤษฎี</div>
            {app.status === 'รอพิจารณา' && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[0.8125rem] text-amber-900">
                <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                เจ้าหน้าที่กำลังตรวจสอบใบสมัคร จะเข้าสอบได้เมื่อได้รับสิทธิ์สอบ
              </div>
            )}
            {theory.length === 0 ? (
              <p className="text-sm text-zinc-500">ยังไม่มีชุดข้อสอบภาคทฤษฎีสำหรับหลักสูตรนี้</p>
            ) : (
              <ul className="space-y-2.5">
                {theory.map((f) => {
                  const st = formStatus(f, app, data.myAttempts);
                  const ui = STATE_UI[st.state];
                  return (
                    <li key={f.id} className="rounded-xl border border-zinc-200 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-zinc-900">{f.title}</div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.75rem] text-zinc-500">
                            <span>{f.questions.length} ข้อ</span>
                            <span>{f.time_limit_minutes} นาที</span>
                            <span>ผ่าน {f.passing_percentage}%</span>
                            <span>
                              ใช้สิทธิ์ {st.used}/{f.max_attempts}
                            </span>
                          </div>
                          {(f.exam_start_date || f.exam_end_date) && (
                            <div className="mt-1 text-[0.75rem] text-zinc-400">
                              {f.exam_start_date ? `เปิด ${thaiDateTime(f.exam_start_date)}` : ''}
                              {f.exam_start_date && f.exam_end_date ? ' – ' : ''}
                              {f.exam_end_date ? `ปิด ${thaiDateTime(f.exam_end_date)}` : ''}
                            </div>
                          )}
                        </div>
                        <Badge tone={ui.tone} dot>
                          {ui.label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[0.8125rem] text-zinc-500">
                          {st.best ? (
                            <>
                              คะแนนดีที่สุด{' '}
                              <span className="font-semibold tabular text-zinc-900">
                                {num(st.best.score)}/{num(st.best.max_score)}
                              </span>{' '}
                              ({num(st.best.percent, 0)}%)
                            </>
                          ) : (
                            'ยังไม่ได้ทำ'
                          )}
                        </span>
                        {st.state === 'in_progress' && st.inProgress ? (
                          <Button size="sm" onClick={() => router.push(`/exam/${st.inProgress!.id}`)} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                            ทำต่อ
                          </Button>
                        ) : st.state === 'open' ? (
                          <Button size="sm" onClick={() => onStart(f)} icon={<CirclePlay className="h-3.5 w-3.5" />}>
                            {st.used > 0 ? 'สอบอีกครั้ง' : 'เริ่มทำข้อสอบ'}
                          </Button>
                        ) : st.best ? (
                          <Link href={`/exam/${st.best.id}`} className="text-[0.8125rem] font-medium text-zinc-700 hover:text-zinc-950">
                            ดูผล →
                          </Link>
                        ) : (
                          <Lock className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Practical */}
          <div className="bg-surface p-5 sm:p-6">
            <div className="eyebrow mb-3">ภาคปฏิบัติ</div>
            {!hasPractical ? (
              <p className="text-sm text-zinc-500">หลักสูตรนี้ไม่มีการประเมินภาคปฏิบัติ</p>
            ) : round ? (
              <div className="rounded-xl border border-zinc-200 p-3.5">
                <div className="text-sm font-medium text-zinc-900">{round.name}</div>
                <div className="mt-2 grid gap-1.5">
                  <Meta icon={<CalendarDays className="h-3.5 w-3.5" />}>{round.exam_date ? thaiDate(round.exam_date, { full: true }) : 'รอกำหนดวัน'}</Meta>
                  {round.start_time && <Meta icon={<Clock className="h-3.5 w-3.5" />}>เริ่ม {round.start_time} น.</Meta>}
                  {round.location && <Meta icon={<MapPin className="h-3.5 w-3.5" />}>{round.location}</Meta>}
                  <Meta icon={<ListChecks className="h-3.5 w-3.5" />}>ประเมินโดยผู้ประเมิน {round.evaluator_ids.length} ท่าน (ใช้คะแนนเฉลี่ย)</Meta>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                {app.status === 'อนุมัติ' ? 'เจ้าหน้าที่จะแจ้งรอบสอบ วัน เวลา และสถานที่ให้ทราบที่นี่' : 'จะแสดงรอบสอบเมื่อได้รับสิทธิ์สอบ'}
              </p>
            )}
            {(app.approval_status === 'submitted' || app.approval_status === 'approved') && (
              <Link href="/results" className="mt-3 inline-flex items-center gap-1 text-[0.8125rem] font-medium text-brand-700 hover:underline">
                ดูผลการประเมิน <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------

function ApplyDialog({ course, onClose, onApplied }: { course: TrainingCourse | null; onClose: () => void; onApplied: () => void }) {
  const user = useUser();
  const [type, setType] = useState<string>(APPLICANT_TYPES[0]);
  const [skill, setSkill] = useState(true);
  const [saving, setSaving] = useState(false);
  const missing = missingDocuments(user);

  const submit = async () => {
    if (!course) return;
    setSaving(true);
    try {
      await applications.apply(user.id, course.id, { applicant_type: type, is_skill_testing: skill });
      toast.success(`สมัคร "${course.course_name}" เรียบร้อย`, { description: 'เจ้าหน้าที่จะตรวจสอบใบสมัครและแจ้งสิทธิ์สอบ' });
      onApplied();
    } catch (e) {
      const msg = errorMessage(e);
      toast.error(/duplicate key|unique/i.test(msg) ? 'คุณสมัครหลักสูตรนี้ไว้แล้ว' : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!course}
      onClose={onClose}
      size="md"
      title="สมัครหลักสูตร"
      description={course?.course_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={submit} loading={saving}>
            ยืนยันการสมัคร
          </Button>
        </>
      }
    >
      <div className="space-y-5 pb-1">
        {course && (
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4 text-sm">
            <div>
              <div className="text-[0.75rem] text-zinc-500">ช่วงอบรม/สอบ</div>
              <div className="font-medium text-zinc-900">{thaiDateRange(course.startswith_date, course.endswith_date)}</div>
            </div>
            <div>
              <div className="text-[0.75rem] text-zinc-500">ระยะเวลา</div>
              <div className="font-medium text-zinc-900">{num(course.traning_hours)} ชั่วโมง</div>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-[0.8125rem] font-medium text-zinc-800">ประเภทผู้สมัคร</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {APPLICANT_TYPES.map((t) => (
              <ChoiceCard key={t} selected={type === t} onClick={() => setType(t)} title={t} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <Switch checked={skill} onChange={setSkill} label="เข้ารับการทดสอบมาตรฐานฝีมือแรงงาน" description="สอบภาคทฤษฎีและภาคปฏิบัติเพื่อรับใบประกาศนียบัตร" />
        </div>

        {missing.length > 0 && (
          <Callout
            tone="amber"
            icon={<TriangleAlert className="h-4 w-4" />}
            title="เอกสารประกอบการสมัครยังไม่ครบ"
            action={
              <Link href="/profile?tab=documents" className="text-sm font-medium underline">
                แนบเอกสาร
              </Link>
            }
          >
            ขาด: {missing.map((m) => m.label).join(', ')} — สมัครได้ก่อน แต่ควรแนบให้ครบเพื่อให้เจ้าหน้าที่อนุมัติได้เร็วขึ้น
          </Callout>
        )}
      </div>
    </Dialog>
  );
}

function PreExamDialog({ target, onClose }: { target: { form: TestForm; app: TrainingApplication; course?: TrainingCourse } | null; onClose: () => void }) {
  const user = useUser();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const f = target?.form;
  const total = f?.questions.reduce((s, q) => s + (Number(q.score) || 0), 0) || 0;
  const endsSoon = f?.exam_end_date && new Date(f.exam_end_date).getTime() - Date.now() < (f.time_limit_minutes || 0) * 60_000;

  const start = async () => {
    if (!target) return;
    setStarting(true);
    try {
      const a = await attempts.start(user, target.app, target.form);
      router.push(`/exam/${a.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setStarting(false);
    }
  };

  return (
    <Dialog
      open={!!target}
      onClose={() => !starting && onClose()}
      size="md"
      title="พร้อมเริ่มสอบหรือยัง?"
      description={target?.course?.course_name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={starting}>
            ไว้ภายหลัง
          </Button>
          <Button onClick={start} loading={starting} icon={<CirclePlay className="h-4 w-4" />}>
            เริ่มทำข้อสอบ
          </Button>
        </>
      }
    >
      {f && (
        <div className="space-y-5 pb-1">
          <div>
            <h3 className="text-base font-semibold">{f.title}</h3>
            {f.description && <p className="mt-1 whitespace-pre-line text-sm text-zinc-500">{f.description}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <ListChecks className="h-4 w-4" />, label: 'จำนวนข้อ', value: `${f.questions.length} ข้อ` },
              { icon: <Clock className="h-4 w-4" />, label: 'เวลา', value: `${f.time_limit_minutes} นาที` },
              { icon: <Target className="h-4 w-4" />, label: 'เกณฑ์ผ่าน', value: `${f.passing_percentage}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 p-3 text-center">
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">{s.icon}</span>
                <div className="mt-2 font-display text-base font-semibold tabular">{s.value}</div>
                <div className="text-[0.75rem] text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-sm text-zinc-600">
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
              เวลาเริ่มนับทันทีที่กดเริ่ม และนับต่อแม้ปิดหน้าจอ — ระบบส่งคำตอบให้อัตโนมัติเมื่อหมดเวลา
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
              คำตอบบันทึกอัตโนมัติ หากหลุดสามารถกลับมาทำต่อได้ภายในเวลาที่เหลือ
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
              คะแนนเต็ม {num(total)} คะแนน · ใช้สิทธิ์สอบครั้งนี้นับเป็น 1 ครั้งจาก {f.max_attempts} ครั้ง
            </li>
          </ul>
          {endsSoon && (
            <Callout tone="amber" icon={<TriangleAlert className="h-4 w-4" />}>
              ชุดข้อสอบจะปิดรับ {thaiDateTime(f.exam_end_date)} ซึ่งเร็วกว่าเวลาทำข้อสอบปกติ เวลาของคุณจะสิ้นสุดตามเวลาปิดรับ
            </Callout>
          )}
        </div>
      )}
    </Dialog>
  );
}

export default function CoursesPage() {
  return (
    <Suspense>
      <CoursesInner />
    </Suspense>
  );
}
