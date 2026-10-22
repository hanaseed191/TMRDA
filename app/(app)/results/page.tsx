'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarDays, ChevronRight, ClipboardCheck, FileText, Hourglass, MapPin, MessageSquare, Printer } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { num, thaiDate, thaiDateTime } from '@/lib/format';
import type { ExamAttempt, TrainingApplication } from '@/lib/types';
import { Badge, ButtonLink, Callout, Card, EmptyState, PageHeader, ScoreRing, SearchInput, Segmented, Skeleton } from '@/components/ui';
import { ApprovalBadge, PassFail, ResultBadge } from '@/components/status';
import { bestAttempt, useStudentData, type StudentData } from '@/components/student/data';
import { ExpandableCard, useExpanded, useShowMore } from '@/components/student/Expandable';

type Filter = 'all' | 'certificate' | 'pending' | 'failed';

/** Everything the results page shows for one application, derived once. */
function summarize(app: TrainingApplication, data: StudentData) {
  const course = data.courseById.get(app.training_id);
  const tries = data.myAttempts.filter((a) => a.training_id === app.training_id);
  const finished = tries.filter((a) => a.status !== 'in_progress');
  const best = bestAttempt(finished);
  const hasTheory = data.theoryForms.some((f) => f.training_id === app.training_id) || tries.length > 0;
  const hasPractical = data.practicalForms.some((f) => f.training_id === app.training_id);
  const round = app.practical_round_id ? data.myRounds.get(app.practical_round_id) : undefined;
  const official = app.approval_status === 'submitted' || app.approval_status === 'approved';

  // Theory: the official snapshot once results went to the director; otherwise the best attempt
  const theoryScore = official && app.theory_score != null ? Number(app.theory_score) : best && !best.needs_review ? Number(best.score) : null;
  const theoryMax = official && app.theory_max != null ? Number(app.theory_max) : best ? Number(best.max_score) : 0;
  const theoryPassed = official && app.theory_passed != null ? app.theory_passed : best && !best.needs_review ? best.passed : null;
  const practicalScore = official && app.practical_score != null ? Number(app.practical_score) : null;
  const practicalMax = Number(app.practical_max) || 0;

  const kind: Exclude<Filter, 'all'> =
    app.approval_status === 'approved' && app.certificate_no
      ? 'certificate'
      : official && app.result_status === 'failed'
        ? 'failed'
        : 'pending';

  return { course, tries, finished, best, hasTheory, hasPractical, round, official, theoryScore, theoryMax, theoryPassed, practicalScore, practicalMax, kind };
}

type Summary = ReturnType<typeof summarize>;

export default function ResultsPage() {
  const user = useUser();
  const { data, loading, error, reload } = useStudentData(user);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    if (!data) return [];
    return data.myApps
      .filter((a) => a.status !== 'ปฏิเสธ')
      .map((app) => ({ app, s: summarize(app, data) }))
      .sort((a, b) => +new Date(b.app.created_at || 0) - +new Date(a.app.created_at || 0));
  }, [data]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      certificate: rows.filter((r) => r.s.kind === 'certificate').length,
      pending: rows.filter((r) => r.s.kind === 'pending').length,
      failed: rows.filter((r) => r.s.kind === 'failed').length,
    }),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (filter !== 'all' && r.s.kind !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.s.course?.course_name, r.s.course?.branch_name, r.app.certificate_no].some((v) => v?.toLowerCase().includes(q));
  });

  const { visible, footer } = useShowMore(filtered, 10);
  // Only one course? open it straight away.
  const expanded = useExpanded(rows.length === 1 ? [rows[0].app.id] : []);

  return (
    <div>
      <PageHeader title="ผลสอบและใบประกาศ" description="ผลภาคทฤษฎี ภาคปฏิบัติ การอนุมัติผล และใบประกาศนียบัตรของคุณ" />

      {error && (
        <Callout tone="red" className="mb-6" title="โหลดข้อมูลไม่สำเร็จ" action={<button onClick={reload} className="text-sm font-medium underline">ลองใหม่</button>}>
          {error}
        </Callout>
      )}

      {loading || !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center gap-4 p-5">
              <Skeleton className="h-7 w-7" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-7 w-24" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Award className="h-5 w-5" />}
            title="ยังไม่มีผลสอบ"
            description="เมื่อสมัครหลักสูตรและเข้าสอบแล้ว ผลสอบจะแสดงที่นี่"
            action={<ButtonLink href="/courses?tab=open">ดูหลักสูตรที่เปิดรับสมัคร</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              size="sm"
              options={[
                { value: 'all', label: `ทั้งหมด ${counts.all}` },
                { value: 'certificate', label: `มีใบประกาศ ${counts.certificate}`, icon: <Award className="h-3.5 w-3.5" /> },
                { value: 'pending', label: `รอผล ${counts.pending}` },
                { value: 'failed', label: `ไม่ผ่าน ${counts.failed}` },
              ]}
            />
            {rows.length > 3 && <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาหลักสูตร หรือเลขที่ใบประกาศ…" className="w-full sm:w-72" />}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState compact title="ไม่พบรายการ" description="ลองเปลี่ยนตัวกรองหรือคำค้นหา" />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {visible.map(({ app, s }) => (
                <ExpandableCard
                  key={app.id}
                  open={expanded.isOpen(app.id)}
                  onToggle={() => expanded.toggle(app.id)}
                  summary={<ResultSummary app={app} s={s} />}
                  actions={
                    app.approval_status === 'approved' && app.certificate_no ? (
                      <ButtonLink href={`/print/certificate/${app.id}`} size="sm" icon={<Printer className="h-3.5 w-3.5" />}>
                        พิมพ์ใบประกาศ
                      </ButtonLink>
                    ) : undefined
                  }
                >
                  <ResultDetail app={app} s={s} data={data} />
                </ExpandableCard>
              ))}
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScoreChip({ label, score, max, passed }: { label: string; score: number | null; max: number; passed: boolean | null | undefined }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-zinc-500">
      {label}
      <span
        className={cn(
          'font-medium tabular',
          score === null ? 'text-zinc-400' : passed === true ? 'text-emerald-700' : passed === false ? 'text-brand-700' : 'text-zinc-800'
        )}
      >
        {score === null ? 'รอผล' : `${num(score)}/${num(max)}`}
      </span>
    </span>
  );
}

function ResultSummary({ app, s }: { app: TrainingApplication; s: Summary }) {
  return (
    <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="min-w-0">
        <span className="block truncate font-medium text-zinc-950">{s.course?.course_name || `หลักสูตร #${app.training_id}`}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {s.hasTheory && <ScoreChip label="ทฤษฎี" score={s.theoryScore} max={s.theoryMax} passed={s.theoryPassed} />}
          {s.hasPractical && <ScoreChip label="ปฏิบัติ" score={s.practicalScore} max={s.practicalMax} passed={s.official ? app.practical_passed : null} />}
          {app.certificate_no && <span className="text-[0.75rem] tabular text-zinc-400">{app.certificate_no}</span>}
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-1.5">
        <ResultBadge status={s.official ? app.result_status : 'pending'} />
        {app.approval_status !== 'none' && <ApprovalBadge status={app.approval_status} />}
      </span>
    </span>
  );
}

function ResultDetail({ app, s, data }: { app: TrainingApplication; s: Summary; data: StudentData }) {
  const formTitle = (a: ExamAttempt) => data.theoryForms.find((f) => f.id === a.test_form_id)?.title || 'แบบทดสอบ';
  const { best, finished, tries, round, official } = s;

  return (
    <>
      <div className="grid gap-px bg-zinc-100 md:grid-cols-2">
        {/* Theory */}
        <div className="bg-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">ภาคทฤษฎี</span>
            {s.hasTheory && <PassFail passed={s.theoryPassed} />}
          </div>
          {!s.hasTheory ? (
            <p className="text-sm text-zinc-500">หลักสูตรนี้ไม่มีสอบภาคทฤษฎี</p>
          ) : finished.length === 0 && !official ? (
            <p className="text-sm text-zinc-500">{tries.length ? 'กำลังทำข้อสอบอยู่' : 'ยังไม่ได้เข้าสอบ'}</p>
          ) : (
            <div className="flex items-center gap-5">
              <ScoreRing value={s.theoryScore} max={s.theoryMax} passed={s.theoryPassed} size={84} stroke={7} />
              <div className="min-w-0 text-sm">
                <div className="font-display text-xl font-semibold tabular">
                  {s.theoryScore === null ? '—' : num(s.theoryScore)}
                  <span className="text-sm font-normal text-zinc-400"> / {num(s.theoryMax)} คะแนน</span>
                </div>
                {best?.needs_review && !official ? (
                  <div className="mt-1 inline-flex items-center gap-1.5 text-[0.8125rem] text-amber-700">
                    <Hourglass className="h-3.5 w-3.5" />
                    รอเจ้าหน้าที่ตรวจข้อเขียน
                  </div>
                ) : (
                  <div className="mt-1 text-[0.8125rem] text-zinc-500">
                    {official ? 'ผลที่ส่งอนุมัติ' : 'คะแนนดีที่สุด'} · เกณฑ์ผ่าน {best ? `${num(best.passing_percentage, 0)}%` : '—'}
                  </div>
                )}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <ul className="mt-5 max-h-60 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200">
              {finished.map((a) => (
                <li key={a.id}>
                  <Link href={`/exam/${a.id}`} className="flex items-center gap-3 px-3.5 py-2.5 text-sm transition hover:bg-zinc-50">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-zinc-800">{formTitle(a)}</div>
                      <div className="text-[0.75rem] text-zinc-500">{thaiDateTime(a.submitted_at)}</div>
                    </div>
                    <span className={cn('text-sm font-medium tabular', a.needs_review ? 'text-amber-700' : a.passed ? 'text-emerald-700' : 'text-brand-700')}>
                      {a.needs_review ? 'รอตรวจ' : `${num(a.percent, 1)}%`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Practical */}
        <div className="bg-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">ภาคปฏิบัติ</span>
            {s.hasPractical && <PassFail passed={official ? app.practical_passed : null} />}
          </div>
          {!s.hasPractical ? (
            <p className="text-sm text-zinc-500">หลักสูตรนี้ไม่มีการประเมินภาคปฏิบัติ</p>
          ) : s.practicalScore !== null ? (
            <div className="flex items-center gap-5">
              <ScoreRing value={s.practicalScore} max={s.practicalMax} passed={app.practical_passed} size={84} stroke={7} />
              <div className="text-sm">
                <div className="font-display text-xl font-semibold tabular">
                  {num(s.practicalScore)}
                  <span className="text-sm font-normal text-zinc-400"> / {num(s.practicalMax)} คะแนน</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[0.8125rem] text-zinc-500">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  คะแนนเฉลี่ยจากผู้ประเมิน {round?.evaluator_ids.length || 3} ท่าน
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-sm text-zinc-600">
                <Hourglass className="h-4 w-4 text-amber-500" />
                อยู่ระหว่างประเมิน
              </div>
              {round ? (
                <div className="rounded-xl border border-zinc-200 p-3.5 text-[0.8125rem] text-zinc-600">
                  <div className="font-medium text-zinc-900">{round.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                      {round.exam_date ? thaiDate(round.exam_date) : 'รอกำหนดวัน'} {round.start_time && `· ${round.start_time} น.`}
                    </span>
                    {round.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        {round.location}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[0.8125rem] text-zinc-500">ยังไม่ได้จัดรอบสอบ</p>
              )}
            </div>
          )}
        </div>
      </div>

      {(app.approval_status === 'rejected' && app.approval_note) || app.approval_status === 'approved' || app.approval_status === 'submitted' ? (
        <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 p-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            {app.approval_status === 'submitted' && <span className="text-zinc-600">ส่งผลให้ผู้อำนวยการพิจารณาเมื่อ {thaiDate(app.submitted_at)}</span>}
            {app.approval_status === 'approved' && (
              <span className="text-zinc-600">
                อนุมัติโดย <span className="font-medium text-zinc-900">{app.approved_by_name}</span> · {thaiDate(app.approved_at)}
                {!app.certificate_no && <span className="ml-1 text-zinc-500">(ไม่ผ่านเกณฑ์ จึงไม่มีใบประกาศ)</span>}
              </span>
            )}
            {app.approval_status === 'rejected' && app.approval_note && (
              <span className="inline-flex items-start gap-1.5 text-brand-800">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                หมายเหตุจากผู้อำนวยการ: {app.approval_note}
              </span>
            )}
          </div>
          {app.certificate_no && <Badge tone="dark">{app.certificate_no}</Badge>}
        </div>
      ) : null}
    </>
  );
}
