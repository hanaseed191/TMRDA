'use client';

import { num, pct } from './util';
import type { PracticalPart, TheoryPart } from '@/lib/results';
import { cn } from '@/lib/cn';
import { PassFail } from '@/components/status';

export function TheoryCell({
  part,
  onGrade,
  locked = false,
}: {
  part: TheoryPart | null;
  onGrade?: () => void;
  /** results are with the director — grading is view-only */
  locked?: boolean;
}) {
  if (!part) return <span className="text-sm text-zinc-400">ไม่มีภาคทฤษฎี</span>;
  if (!part.attempt) {
    return <span className="text-sm text-zinc-400">{part.inProgress ? 'กำลังทำข้อสอบ' : 'ยังไม่ได้สอบ'}</span>;
  }
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-[0.9375rem] font-semibold tabular text-zinc-950">{num(part.score)}</span>
        <span className="text-xs text-zinc-400 tabular">/ {num(part.max)}</span>
        <span className="text-xs text-zinc-500 tabular">· {num(part.percent)}%</span>
      </div>
      {part.inProgress ? (
        <span className="block text-xs text-sky-700">กำลังสอบอีกครั้ง</span>
      ) : part.canRetake ? (
        <span className="block text-xs text-amber-700">ยังสอบแก้ตัวได้ — รอผลสุดท้าย</span>
      ) : null}
      {part.needsReview ? (
        onGrade && !locked ? (
          <button
            onClick={onGrade}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
          >
            ตรวจข้อเขียน →
          </button>
        ) : (
          <span className="text-xs text-amber-700">รอตรวจข้อเขียน</span>
        )
      ) : (
        <div className="flex items-center gap-1.5">
          <PassFail passed={part.attempt.passed} />
          {onGrade && part.attempt.question_snapshot.some((q) => q.type === 'text_choices') && (
            <button onClick={onGrade} className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-700 hover:underline">
              {locked ? 'ดูคำตอบ' : 'แก้คะแนน'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PracticalCell({ part }: { part: PracticalPart | null }) {
  if (!part) return <span className="text-sm text-zinc-400">ไม่มีภาคปฏิบัติ</span>;
  if (!part.round) return <span className="text-sm text-zinc-400">ยังไม่ได้จัดรอบสอบ</span>;
  const avg = part.average;
  const required = part.evaluators.length;
  const submitted = avg?.submitted ?? 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        {avg?.average !== null && avg?.average !== undefined ? (
          <>
            <span className={cn('font-display text-[0.9375rem] font-semibold tabular', part.ready ? 'text-zinc-950' : 'text-zinc-400')}>
              {num(avg.average)}
            </span>
            <span className="text-xs text-zinc-400 tabular">/ {num(part.max)}</span>
            <span className="text-xs text-zinc-500 tabular">· {num(pct(avg.average, part.max))}%</span>
          </>
        ) : (
          <span className="text-sm text-zinc-400">รอผู้ประเมิน</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {part.evaluators.map((e, i) => {
          const done = e.score?.status === 'submitted';
          return (
            <span
              key={e.evaluator_id}
              title={e.evaluator ? `${e.evaluator.first_name_th} ${e.evaluator.last_name_th}` : undefined}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-px text-[0.6875rem] font-medium tabular ring-1 ring-inset',
                done ? 'bg-zinc-900 text-zinc-50 ring-zinc-900' : 'bg-surface text-zinc-400 ring-zinc-200'
              )}
            >
              E{i + 1} {done ? num(e.score!.total) : '—'}
            </span>
          );
        })}
        <span className="ml-0.5 text-[0.6875rem] text-zinc-500 tabular">
          {submitted}/{required}
        </span>
      </div>
    </div>
  );
}
