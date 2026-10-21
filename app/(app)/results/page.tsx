'use client';

import Link from 'next/link';
import { Award, CalendarDays, ChevronRight, ClipboardCheck, FileText, Hourglass, MapPin, MessageSquare, Printer } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { num, thaiDate, thaiDateTime } from '@/lib/format';
import type { ExamAttempt, TrainingApplication } from '@/lib/types';
import { Badge, ButtonLink, Callout, Card, EmptyState, PageHeader, ScoreRing, Skeleton } from '@/components/ui';
import { ApprovalBadge, PassFail, ResultBadge } from '@/components/status';
import { bestAttempt, useStudentData, type StudentData } from '@/components/student/data';

export default function ResultsPage() {
  const user = useUser();
  const { data, loading, error, reload } = useStudentData(user);
  const apps = data?.myApps.filter((a) => a.status !== 'ปฏิเสธ') || [];
  const certificates = apps.filter((a) => a.approval_status === 'approved' && a.certificate_no);

  return (
    <div>
      <PageHeader title="ผลสอบและใบประกาศ" description="ผลภาคทฤษฎี ภาคปฏิบัติ การอนุมัติผล และใบประกาศนียบัตรของคุณ" />

      {error && (
        <Callout tone="red" className="mb-6" title="โหลดข้อมูลไม่สำเร็จ" action={<button onClick={reload} className="text-sm font-medium underline">ลองใหม่</button>}>
          {error}
        </Callout>
      )}

      {!loading && certificates.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {certificates.map((a) => (
            <Link
              key={a.id}
              href={`/print/certificate/${a.id}`}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-ink-950 dark:bg-ink-900 dark:ring-1 dark:ring-white/10 p-5 text-white transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-600/40 blur-2xl" />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-ink-950">
                <Award className="h-6 w-6" />
              </span>
              <div className="relative min-w-0 flex-1">
                <div className="text-[0.75rem] text-ink-400">ใบประกาศนียบัตร · {a.certificate_no}</div>
                <div className="truncate font-medium">{data?.courseById.get(a.training_id)?.course_name}</div>
              </div>
              <span className="relative inline-flex items-center gap-1 text-sm text-ink-300 group-hover:text-white">
                <Printer className="h-4 w-4" />
                พิมพ์
              </span>
            </Link>
          ))}
        </div>
      )}

      {loading || !data ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-4 p-6">
              <Skeleton className="h-5 w-1/2" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Award className="h-5 w-5" />}
            title="ยังไม่มีผลสอบ"
            description="เมื่อสมัครหลักสูตรและเข้าสอบแล้ว ผลสอบจะแสดงที่นี่"
            action={<ButtonLink href="/courses?tab=open">ดูหลักสูตรที่เปิดรับสมัคร</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <ResultCard key={a.id} app={a} data={data} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ app, data }: { app: TrainingApplication; data: StudentData }) {
  const course = data.courseById.get(app.training_id);
  const tries = data.myAttempts.filter((a) => a.training_id === app.training_id);
  const finished = tries.filter((a) => a.status !== 'in_progress');
  const best = bestAttempt(finished);
  const hasTheory = data.theoryForms.some((f) => f.training_id === app.training_id) || tries.length > 0;
  const hasPractical = data.practicalForms.some((f) => f.training_id === app.training_id);
  const round = app.practical_round_id ? data.myRounds.get(app.practical_round_id) : undefined;
  const official = app.approval_status === 'submitted' || app.approval_status === 'approved';
  const formTitle = (a: ExamAttempt) => data.theoryForms.find((f) => f.id === a.test_form_id)?.title || 'แบบทดสอบ';

  // Theory: official snapshot when results were sent to the director; otherwise the best attempt
  const theoryScore = official && app.theory_score != null ? Number(app.theory_score) : best && !best.needs_review ? Number(best.score) : null;
  const theoryMax = official && app.theory_max != null ? Number(app.theory_max) : best ? Number(best.max_score) : 0;
  const theoryPassed = official && app.theory_passed != null ? app.theory_passed : best && !best.needs_review ? best.passed : null;

  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{course?.course_name || `หลักสูตร #${app.training_id}`}</h2>
          <p className="mt-0.5 text-[0.8125rem] text-zinc-500">
            {course?.level_name} {course?.branch_name && `· ${course.branch_name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ResultBadge status={official ? app.result_status : 'pending'} />
          <ApprovalBadge status={app.approval_status} />
        </div>
      </div>

      <div className="grid gap-px bg-zinc-100 md:grid-cols-2">
        {/* Theory */}
        <div className="bg-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">ภาคทฤษฎี</span>
            {hasTheory && <PassFail passed={theoryPassed} />}
          </div>
          {!hasTheory ? (
            <p className="text-sm text-zinc-500">หลักสูตรนี้ไม่มีสอบภาคทฤษฎี</p>
          ) : finished.length === 0 && !official ? (
            <p className="text-sm text-zinc-500">{tries.length ? 'กำลังทำข้อสอบอยู่' : 'ยังไม่ได้เข้าสอบ'}</p>
          ) : (
            <div className="flex items-center gap-5">
              <ScoreRing value={theoryScore} max={theoryMax} passed={theoryPassed} size={84} stroke={7} />
              <div className="min-w-0 text-sm">
                <div className="font-display text-xl font-semibold tabular">
                  {theoryScore === null ? '—' : num(theoryScore)}
                  <span className="text-sm font-normal text-zinc-400"> / {num(theoryMax)} คะแนน</span>
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
            <ul className="mt-5 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
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
            {hasPractical && <PassFail passed={official ? app.practical_passed : null} />}
          </div>
          {!hasPractical ? (
            <p className="text-sm text-zinc-500">หลักสูตรนี้ไม่มีการประเมินภาคปฏิบัติ</p>
          ) : official && app.practical_score != null ? (
            <div className="flex items-center gap-5">
              <ScoreRing value={Number(app.practical_score)} max={Number(app.practical_max) || 0} passed={app.practical_passed} size={84} stroke={7} />
              <div className="text-sm">
                <div className="font-display text-xl font-semibold tabular">
                  {num(app.practical_score)}
                  <span className="text-sm font-normal text-zinc-400"> / {num(app.practical_max)} คะแนน</span>
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
        <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 text-sm">
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
          {app.approval_status === 'approved' && app.certificate_no && (
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="dark">{app.certificate_no}</Badge>
              <ButtonLink href={`/print/certificate/${app.id}`} size="sm" icon={<Printer className="h-3.5 w-3.5" />}>
                พิมพ์ใบประกาศ
              </ButtonLink>
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
