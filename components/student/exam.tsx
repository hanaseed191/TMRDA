'use client';

import { useMemo } from 'react';
import { Check, CircleCheck, CircleX, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { QUESTION_TYPE_LABEL } from '@/lib/constants';
import { num } from '@/lib/format';
import { gradeQuestion, isAnswered, seededShuffle } from '@/lib/scoring';
import type { AnswerValue, ExamQuestion } from '@/lib/types';
import { Badge, Input, Select, Textarea } from '@/components/ui';

const LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ'];

export const TYPE_HINT: Partial<Record<ExamQuestion['type'], string>> = {
  single_choices: 'เลือกคำตอบที่ถูกต้องที่สุด 1 ข้อ',
  multiple_choices: 'เลือกได้หลายข้อ — ต้องเลือกให้ครบทุกข้อที่ถูก',
  true_false: 'ข้อความนี้ถูกหรือผิด',
  matching: 'จับคู่รายการด้านซ้ายกับคำตอบที่ถูกต้อง',
  short_answer: 'พิมพ์คำตอบสั้น ๆ',
  text_choices: 'ตอบแบบบรรยาย เจ้าหน้าที่จะตรวจให้คะแนน',
};

function OptionCard({
  selected,
  onClick,
  marker,
  children,
  shape = 'radio',
}: {
  selected: boolean;
  onClick: () => void;
  marker: string;
  children: React.ReactNode;
  shape?: 'radio' | 'check';
}) {
  return (
    <button
      type="button"
      role={shape === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3.5 rounded-2xl border bg-surface px-4 py-3.5 text-left transition-all duration-150',
        selected ? 'border-brand-500 bg-brand-50/40 shadow-ring' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70'
      )}
    >
      <span
        className={cn(
          'mt-px flex h-7 w-7 shrink-0 items-center justify-center text-[0.8125rem] font-semibold transition',
          shape === 'radio' ? 'rounded-full' : 'rounded-lg',
          selected ? 'bg-brand-600 text-white' : 'border border-zinc-200 bg-zinc-50 text-zinc-500 group-hover:border-zinc-300'
        )}
      >
        {selected && shape === 'check' ? <Check className="h-4 w-4" strokeWidth={3} /> : marker}
      </span>
      <span className="min-w-0 flex-1 pt-0.5 text-[0.9375rem] leading-relaxed text-zinc-800">{children}</span>
    </button>
  );
}

/** Answering UI for one question. `seed` keeps the matching options order stable per attempt. */
export function QuestionInput({
  q,
  value,
  onChange,
  seed,
}: {
  q: ExamQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue | undefined) => void;
  seed: number;
}) {
  const matchOptions = useMemo(() => seededShuffle(q.matching_pairs || [], seed + q.id), [q.matching_pairs, seed, q.id]);

  switch (q.type) {
    case 'single_choices':
      return (
        <div className="space-y-2.5" role="radiogroup">
          {q.choices.map((c, i) => (
            <OptionCard key={c.id} selected={value === c.id} onClick={() => onChange(c.id)} marker={LETTERS[i] || String(i + 1)}>
              {c.choice_text}
            </OptionCard>
          ))}
        </div>
      );
    case 'multiple_choices': {
      const picked = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2.5">
          {q.choices.map((c, i) => (
            <OptionCard
              key={c.id}
              shape="check"
              selected={picked.includes(c.id)}
              onClick={() => {
                const next = picked.includes(c.id) ? picked.filter((x) => x !== c.id) : [...picked, c.id];
                onChange(next.length ? next : undefined);
              }}
              marker={LETTERS[i] || String(i + 1)}
            >
              {c.choice_text}
            </OptionCard>
          ))}
        </div>
      );
    }
    case 'true_false':
      return (
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {[
            { v: true, label: 'ถูก', icon: <CircleCheck className="h-6 w-6" /> },
            { v: false, label: 'ผิด', icon: <CircleX className="h-6 w-6" /> },
          ].map((o) => {
            const selected = value === o.v;
            return (
              <button
                key={String(o.v)}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(o.v)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border bg-surface px-4 py-6 transition',
                  selected
                    ? o.v
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-[0_0_0_4px_rgb(16_185_129/0.12)]'
                      : 'border-brand-500 bg-brand-50/50 text-brand-700 shadow-ring'
                    : 'border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50'
                )}
              >
                {o.icon}
                <span className={cn('font-display text-lg font-semibold', selected ? '' : 'text-zinc-700')}>{o.label}</span>
              </button>
            );
          })}
        </div>
      );
    case 'matching': {
      const map = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {};
      const used = new Set(Object.values(map));
      return (
        <div className="space-y-2.5">
          {(q.matching_pairs || []).map((p, i) => (
            <div key={p.id} className="grid items-center gap-2 rounded-2xl border border-zinc-200 bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[0.8125rem] font-semibold text-zinc-600">{i + 1}</span>
                <span className="pt-0.5 text-[0.9375rem] text-zinc-800">{p.left_text}</span>
              </div>
              <Select
                value={map[p.id] || ''}
                onChange={(e) => {
                  const next = { ...map };
                  if (e.target.value) next[p.id] = e.target.value;
                  else delete next[p.id];
                  onChange(Object.keys(next).length ? next : undefined);
                }}
                className={cn(map[p.id] && 'border-brand-300 bg-brand-50/30')}
              >
                <option value="">— เลือกคำตอบ —</option>
                {matchOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.right_text}
                    {used.has(o.id) && map[p.id] !== o.id ? ' (เลือกแล้ว)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      );
    }
    case 'short_answer':
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value ? e.target.value : undefined)}
          placeholder={q.placeholder_text || 'พิมพ์คำตอบ'}
          className="h-12 text-base"
        />
      );
    case 'text_choices': {
      const text = typeof value === 'string' ? value : '';
      return (
        <div>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => onChange(e.target.value ? e.target.value : undefined)}
            placeholder={q.placeholder_text || 'พิมพ์คำตอบของคุณ'}
            className="text-base"
          />
          <div className="mt-1.5 text-right text-xs text-zinc-400 tabular">{text.length.toLocaleString('th-TH')} ตัวอักษร</div>
        </div>
      );
    }
    default:
      return null;
  }
}

/** Read-only review of a submitted answer with the answer key. */
export function QuestionReview({
  q,
  index,
  value,
  manualScore,
}: {
  q: ExamQuestion;
  index: number;
  value: AnswerValue | undefined;
  manualScore?: number;
}) {
  const g = gradeQuestion(q, value, manualScore);
  const answered = isAnswered(q, value);
  const status = g.pending ? 'pending' : g.correct ? 'correct' : g.earned > 0 ? 'partial' : 'wrong';

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              status === 'correct' && 'bg-emerald-100 text-emerald-700',
              status === 'partial' && 'bg-amber-100 text-amber-800',
              status === 'wrong' && 'bg-brand-100 text-brand-700',
              status === 'pending' && 'bg-zinc-100 text-zinc-600'
            )}
          >
            {index + 1}
          </span>
          <Badge>{QUESTION_TYPE_LABEL[q.type]}</Badge>
        </div>
        <span className="text-sm font-semibold tabular text-zinc-900">
          {g.pending ? 'รอตรวจ' : `${num(g.earned)}/${num(g.max)}`}
        </span>
      </div>
      <div className="space-y-3 px-5 py-4">
        <p className="whitespace-pre-line text-[0.9375rem] font-medium leading-relaxed text-zinc-900">{q.question_text}</p>

        {(q.type === 'single_choices' || q.type === 'multiple_choices') && (
          <ul className="space-y-1.5">
            {q.choices.map((c, i) => {
              const picked = q.type === 'single_choices' ? value === c.id : Array.isArray(value) && value.includes(c.id);
              return (
                <li
                  key={c.id}
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm',
                    c.is_correct ? 'bg-emerald-50 text-emerald-900' : picked ? 'bg-brand-50 text-brand-900' : 'text-zinc-500'
                  )}
                >
                  <span className="w-4 shrink-0 font-medium">{LETTERS[i]}</span>
                  <span className="flex-1">{c.choice_text}</span>
                  {c.is_correct && <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />}
                  {picked && !c.is_correct && <X className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} />}
                  {picked && <span className="shrink-0 text-[0.6875rem] font-medium opacity-70">คำตอบของคุณ</span>}
                </li>
              );
            })}
          </ul>
        )}

        {q.type === 'true_false' && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-900">เฉลย: {q.true_false_answer ? 'ถูก' : 'ผิด'}</span>
            <span className={cn('rounded-xl px-3 py-1.5', g.correct ? 'bg-zinc-100 text-zinc-700' : 'bg-brand-50 text-brand-900')}>
              คุณตอบ: {typeof value === 'boolean' ? (value ? 'ถูก' : 'ผิด') : 'ไม่ได้ตอบ'}
            </span>
          </div>
        )}

        {q.type === 'matching' && (
          <ul className="space-y-1.5">
            {(q.matching_pairs || []).map((p) => {
              const map = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {};
              const chosen = (q.matching_pairs || []).find((x) => x.id === map[p.id]);
              const ok = map[p.id] === p.id;
              return (
                <li key={p.id} className={cn('grid gap-1 rounded-xl px-3 py-2 text-sm sm:grid-cols-[1fr_1fr]', ok ? 'bg-emerald-50' : 'bg-brand-50/60')}>
                  <span className="text-zinc-800">{p.left_text}</span>
                  <span className={ok ? 'text-emerald-800' : 'text-brand-800'}>
                    {ok ? '✓ ' : '✗ '}
                    {chosen ? chosen.right_text : 'ไม่ได้ตอบ'}
                    {!ok && <span className="block text-emerald-800">เฉลย: {p.right_text}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {q.type === 'short_answer' && (
          <div className="space-y-1.5 text-sm">
            <div className={cn('rounded-xl px-3 py-2', g.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-brand-50 text-brand-900')}>
              คุณตอบ: {answered ? String(value) : 'ไม่ได้ตอบ'}
            </div>
            {!g.correct && (q.accepted_answers || []).length > 0 && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">คำตอบที่ยอมรับ: {(q.accepted_answers || []).join(' / ')}</div>
            )}
          </div>
        )}

        {q.type === 'text_choices' && (
          <div className="space-y-1.5 text-sm">
            <div className="whitespace-pre-line rounded-xl bg-zinc-50 px-3 py-2 text-zinc-800">{answered ? String(value) : 'ไม่ได้ตอบ'}</div>
            {q.correct_answer_text && !g.pending && (
              <div className="whitespace-pre-line rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">แนวคำตอบ: {q.correct_answer_text}</div>
            )}
          </div>
        )}

        {q.explanation && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-900">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="whitespace-pre-line">{q.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
}
