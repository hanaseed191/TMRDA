'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, CalendarDays, ClipboardCheck, Clock, EyeOff, FileText, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { applications, courses, forms } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { errorMessage, thaiDateRange } from '@/lib/format';
import type { TrainingCourse } from '@/lib/types';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  PageHeader,
  Progress,
  SearchInput,
  Segmented,
  Skeleton,
  useConfirm,
} from '@/components/ui';
import CourseFormDialog from '@/components/admin/CourseFormDialog';
import { coursePhase, PHASE_META, type CoursePhase } from '@/components/admin/courseState';

type Filter = 'all' | CoursePhase;

function CoursesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<TrainingCourse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, loading, error, reload } = useLoad(async () => {
    const [cs, apps, fs] = await Promise.all([courses.list(), applications.list(), forms.list()]);
    return { cs, apps, fs };
  }, []);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setDialogOpen(true);
      router.replace('/admin/courses');
    }
  }, [params, router]);

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.cs
      .map((c) => {
        const apps = data.apps.filter((a) => a.training_id === c.id);
        return {
          c,
          phase: coursePhase(c),
          applied: apps.length,
          approved: apps.filter((a) => a.status === 'อนุมัติ').length,
          theory: data.fs.filter((f) => f.training_id === c.id && f.exam_type === 'theory').length,
          practical: data.fs.filter((f) => f.training_id === c.id && f.exam_type === 'practical').length,
        };
      })
      .filter((r) => filter === 'all' || r.phase === filter)
      .filter(
        (r) =>
          !term ||
          [r.c.course_name, r.c.course_name_en, r.c.branch_name, r.c.agency_name, r.c.level_name]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(term))
      );
  }, [data, q, filter]);

  const remove = async (c: TrainingCourse) => {
    const ok = await confirm({
      title: `ลบหลักสูตร “${c.course_name}”?`,
      description:
        'ใบสมัคร ชุดข้อสอบ ผลสอบ รอบสอบปฏิบัติ และคะแนนทั้งหมดของหลักสูตรนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้',
      confirmLabel: 'ลบถาวร',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await courses.remove(c.id);
      toast.success('ลบหลักสูตรแล้ว');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const counts = useMemo(() => {
    const m: Record<Filter, number> = { all: 0, upcoming: 0, running: 0, ended: 0, undated: 0 };
    (data?.cs || []).forEach((c) => {
      m.all++;
      m[coursePhase(c)]++;
    });
    return m;
  }, [data]);

  return (
    <>
      <PageHeader
        title="หลักสูตร"
        description="จัดการหลักสูตร ผู้สมัคร ชุดข้อสอบทฤษฎี เกณฑ์ประเมินปฏิบัติ และรอบสอบ"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            สร้างหลักสูตร
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          size="sm"
          options={[
            { value: 'all', label: `ทั้งหมด ${counts.all}` },
            { value: 'running', label: `กำลังอบรม ${counts.running}` },
            { value: 'upcoming', label: `ยังไม่เริ่ม ${counts.upcoming}` },
            { value: 'ended', label: `สิ้นสุดแล้ว ${counts.ended}` },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อหลักสูตร สาขา หน่วยงาน" className="sm:w-80" />
      </div>

      {error && (
        <Callout tone="red" title="โหลดข้อมูลไม่สำเร็จ" className="mb-5">
          {error}
        </Callout>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[248px] rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title={data?.cs.length ? 'ไม่พบหลักสูตรที่ตรงกับเงื่อนไข' : 'ยังไม่มีหลักสูตร'}
            description={data?.cs.length ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เริ่มจากสร้างหลักสูตรแรก แล้วเพิ่มชุดข้อสอบและรอบสอบปฏิบัติ'}
            action={
              !data?.cs.length && (
                <Button
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  สร้างหลักสูตร
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ c, phase, applied, approved, theory, practical }) => {
            const meta = PHASE_META[phase];
            return (
              <Card key={c.id} className="group flex flex-col transition hover:-translate-y-0.5 hover:shadow-lift">
                <Link href={`/admin/courses/${c.id}`} className="flex-1 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                    {c.is_published === false && (
                      <Badge tone="neutral" icon={<EyeOff className="h-3 w-3" />}>
                        ซ่อนอยู่
                      </Badge>
                    )}
                    {c.level_name && <Badge tone="neutral">{c.level_name}</Badge>}
                  </div>
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-brand-700">{c.course_name}</h3>
                  {c.course_name_en && <p className="mt-0.5 truncate text-[0.8125rem] text-zinc-500">{c.course_name_en}</p>}
                  <div className="mt-4 space-y-1.5 text-[0.8125rem] text-zinc-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                      {thaiDateRange(c.startswith_date, c.endswith_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {c.traning_hours} ชั่วโมง {c.branch_name && `· ${c.branch_name}`}
                    </div>
                    {c.location && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[0.8125rem]">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Users className="h-3.5 w-3.5" /> ผู้สมัคร
                      </span>
                      <span className="font-medium text-zinc-900 tabular">
                        {applied}/{c.limit_course} <span className="font-normal text-zinc-500">· อนุมัติ {approved}</span>
                      </span>
                    </div>
                    <Progress value={applied} max={c.limit_course || 1} tone={applied >= c.limit_course ? 'amber' : 'red'} />
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3">
                  <div className="flex items-center gap-3 text-[0.8125rem] text-zinc-500">
                    <span className="flex items-center gap-1" title="ชุดข้อสอบทฤษฎี">
                      <FileText className="h-3.5 w-3.5" /> {theory}
                    </span>
                    <span className="flex items-center gap-1" title="แบบประเมินปฏิบัติ">
                      <ClipboardCheck className="h-3.5 w-3.5" /> {practical}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="แก้ไข"
                      title="แก้ไข"
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="ลบ" title="ลบ" className="hover:text-brand-700" onClick={() => remove(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CourseFormDialog
        open={dialogOpen}
        course={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={(c) => {
          if (editing) reload();
          else router.push(`/admin/courses/${c.id}`);
        }}
      />
    </>
  );
}

export default function AdminCoursesPage() {
  return (
    <Suspense>
      <CoursesPageInner />
    </Suspense>
  );
}
