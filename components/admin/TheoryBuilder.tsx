'use client';

import React, { useState } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Check,
  CircleDot,
  Copy,
  Eye,
  Link2,
  Plus,
  SquareCheck,
  ToggleLeft,
  Trash2,
  TriangleAlert,
  Type,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { QUESTION_TYPES, QUESTION_TYPE_LABEL } from '@/lib/constants';
import { num, toDateTimeInput } from '@/lib/format';
import { validateQuestion } from '@/lib/scoring';
import type { ExamChoice, ExamQuestion, MatchingPair, QuestionType, TestForm } from '@/lib/types';
import { Badge, Button, Card, Dialog, Field, Input, Select, Switch, Textarea, useConfirm } from '@/components/ui';
import { uid } from './uid';

export type FormDraft = Partial<TestForm> & { training_id: number; exam_type: 'theory' | 'practical' };

const TYPE_ICON: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
  single_choices: CircleDot,
  multiple_choices: SquareCheck,
  true_false: ToggleLeft,
  matching: Link2,
  short_answer: Type,
  text_choices: AlignLeft,
};

const THAI_LETTERS = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ'];

const newChoice = (): ExamChoice => ({ id: uid(), choice_text: '', is_correct: false });
const newPair = (): MatchingPair => ({ id: uid(), left_text: '', right_text: '' });

export function newQuestion(id: number, type: QuestionType = 'single_choices'): ExamQuestion {
  return convertType({ id, question_text: '', type: 'single_choices', category: 'knowledge', score: 1, choices: [] }, type);
}

/** Change a question's type, keeping its text/score and initialising what the new type needs. */
function convertType(q: ExamQuestion, type: QuestionType): ExamQuestion {
  const next: ExamQuestion = { ...q, type };
  if (type === 'single_choices' || type === 'multiple_choices') {
    let choices = q.choices?.length ? q.choices : [newChoice(), newChoice(), newChoice(), newChoice()];
    if (type === 'single_choices') {
      const first = choices.findIndex((c) => c.is_correct);
      choices = choices.map((c, i) => ({ ...c, is_correct: i === first }));
    }
    next.choices = choices;
  }
  if (type === 'matching' && (q.matching_pairs?.length || 0) < 2) {
    next.matching_pairs = [...(q.matching_pairs || []), newPair(), newPair()].slice(0, Math.max(2, q.matching_pairs?.length || 0));
  }
  if (type === 'short_answer' && !q.accepted_answers) next.accepted_answers = [];
  return next;
}

// =====================================================================

export default function TheoryBuilder({
  form,
  onChange,
  showErrors,
  attemptCount,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  showErrors: boolean;
  attemptCount: number;
}) {
  const confirm = useConfirm();
  const [preview, setPreview] = useState(false);
  const questions = form.questions || [];
  const total = questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const passScore = (total * (Number(form.passing_percentage) || 0)) / 100;
  const errors = questions.map((q, i) => validateQuestion(q, i));
  const errorCount = errors.filter(Boolean).length;

  const setQuestions = (qs: ExamQuestion[]) => onChange({ questions: qs });
  const nextId = () => questions.reduce((m, q) => Math.max(m, Number(q.id) || 0), 0) + 1;

  const addQuestion = (type: QuestionType) => {
    const q = newQuestion(nextId(), type);
    setQuestions([...questions, q]);
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${q.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector<HTMLTextAreaElement>('textarea')?.focus({ preventScroll: true });
    });
  };

  const update = (i: number, q: ExamQuestion) => setQuestions(questions.map((x, j) => (j === i ? q : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= questions.length) return;
    const qs = [...questions];
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setQuestions(qs);
  };
  const duplicate = (i: number) => {
    const src = questions[i];
    const copy: ExamQuestion = {
      ...src,
      id: nextId(),
      choices: (src.choices || []).map((c) => ({ ...c, id: uid() })),
      matching_pairs: (src.matching_pairs || []).map((p) => ({ ...p, id: uid() })),
      accepted_answers: src.accepted_answers ? [...src.accepted_answers] : undefined,
    };
    const qs = [...questions];
    qs.splice(i + 1, 0, copy);
    setQuestions(qs);
  };
  const remove = async (i: number) => {
    const q = questions[i];
    if (q.question_text.trim()) {
      const ok = await confirm({ title: `ลบข้อที่ ${i + 1}?`, description: q.question_text.slice(0, 120), confirmLabel: 'ลบคำถาม', tone: 'danger' });
      if (!ok) return;
    }
    setQuestions(questions.filter((_, j) => j !== i));
  };

  const byType = QUESTION_TYPES.map((t) => ({ ...t, n: questions.filter((q) => q.type === t.value).length })).filter((t) => t.n > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ---------------- Questions ---------------- */}
      <div className="min-w-0 space-y-4">
        {attemptCount > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              มีผู้เข้าสอบชุดนี้แล้ว {attemptCount} ครั้ง — การแก้ไขคำถามมีผลกับการสอบครั้งใหม่เท่านั้น ผู้ที่สอบหรือกำลังสอบใช้ชุดคำถามที่บันทึกไว้ตอนเริ่มสอบ
            </span>
          </div>
        )}

        {questions.length === 0 && (
          <Card className="border-dashed p-8 text-center">
            <h3 className="text-base font-semibold">เริ่มเพิ่มคำถามข้อแรก</h3>
            <p className="mt-1 text-sm text-zinc-500">เลือกรูปแบบคำถามด้านล่าง เปลี่ยนรูปแบบภายหลังได้โดยข้อความโจทย์ไม่หาย</p>
          </Card>
        )}

        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            total={questions.length}
            error={showErrors ? errors[i] : null}
            onChange={(nq) => update(i, nq)}
            onMove={(d) => move(i, d)}
            onDuplicate={() => duplicate(i)}
            onDelete={() => remove(i)}
          />
        ))}

        <Card className="p-4">
          <div className="mb-3 text-[0.8125rem] font-medium text-zinc-700">เพิ่มคำถาม</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUESTION_TYPES.map((t) => {
              const Icon = TYPE_ICON[t.value];
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => addQuestion(t.value)}
                  className="group flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-surface p-3 text-left transition hover:-translate-y-px hover:border-brand-300 hover:shadow-card"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-zinc-900">{t.label}</span>
                    <span className="block text-xs leading-snug text-zinc-500">{t.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ---------------- Settings ---------------- */}
      <aside className="space-y-4 lg:sticky lg:top-[140px] lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:pb-4">
        <Card className="p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow">คะแนนเต็ม</div>
              <div className="mt-1 font-display text-3xl font-semibold tabular">{num(total)}</div>
            </div>
            <div className="text-right text-[0.8125rem] text-zinc-500">
              <div>{questions.length} ข้อ</div>
              <div>
                ผ่านที่ <span className="font-medium text-zinc-900 tabular">{num(passScore)}</span> คะแนน
              </div>
            </div>
          </div>
          {byType.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {byType.map((t) => (
                <Badge key={t.value}>
                  {t.label} {t.n}
                </Badge>
              ))}
            </div>
          )}
          {questions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className={cn(
                    'flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-medium tabular transition',
                    errors[i] ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                  title={errors[i] || `ข้อ ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
          {errorCount > 0 && (
            <p className="mt-3 text-[0.8125rem] text-brand-700">ยังไม่สมบูรณ์ {errorCount} ข้อ — แก้ไขก่อนบันทึก</p>
          )}
          <Button variant="outline" className="mt-4 w-full" icon={<Eye className="h-4 w-4" />} onClick={() => setPreview(true)} disabled={!questions.length}>
            ดูตัวอย่างแบบผู้สอบ
          </Button>
        </Card>

        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">การตั้งค่าการสอบ</h3>
          <Field label="คำชี้แจงก่อนเริ่มสอบ">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={form.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="เช่น อ่านโจทย์ให้ครบ ห้ามเปิดหน้าต่างอื่นระหว่างสอบ"
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="เวลา (นาที)">
              {(id) => (
                <Input id={id} type="number" min={1} inputMode="numeric" value={form.time_limit_minutes ?? ''} onChange={(e) => onChange({ time_limit_minutes: Number(e.target.value) })} />
              )}
            </Field>
            <Field label="เกณฑ์ผ่าน (%)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  value={form.passing_percentage ?? ''}
                  onChange={(e) => onChange({ passing_percentage: Math.min(100, Math.max(0, Number(e.target.value))) })}
                />
              )}
            </Field>
          </div>
          <Field label="เปิดให้สอบตั้งแต่" hint="เว้นว่าง = เริ่มได้ทันที">
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={toDateTimeInput(form.exam_start_date)}
                onChange={(e) => onChange({ exam_start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            )}
          </Field>
          <Field
            label="ปิดรับการสอบ"
            hint="เว้นว่าง = ไม่มีกำหนดปิด"
            error={
              form.exam_start_date && form.exam_end_date && form.exam_end_date <= form.exam_start_date ? 'เวลาปิดต้องหลังเวลาเปิด' : null
            }
          >
            {(id) => (
              <Input
                id={id}
                type="datetime-local"
                value={toDateTimeInput(form.exam_end_date)}
                onChange={(e) => onChange({ exam_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            )}
          </Field>
          <Field label="จำนวนครั้งที่สอบได้">
            {(id) => (
              <Select id={id} value={String(form.max_attempts ?? 1)} onChange={(e) => onChange({ max_attempts: Number(e.target.value) })}>
                {[1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ครั้ง
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="space-y-4 border-t border-zinc-100 pt-4">
            <Switch checked={!!form.randomize_questions} onChange={(v) => onChange({ randomize_questions: v })} label="สุ่มลำดับคำถาม" description="ผู้สอบแต่ละคนเห็นลำดับข้อต่างกัน" />
            <Switch checked={!!form.randomize_choices} onChange={(v) => onChange({ randomize_choices: v })} label="สุ่มลำดับตัวเลือก" description="สลับตัวเลือก ก–ง ในแต่ละข้อ" />
            <Switch checked={form.show_answers ?? true} onChange={(v) => onChange({ show_answers: v })} label="แสดงเฉลยหลังส่งคำตอบ" description="ผู้สอบดูคำตอบที่ถูกและคำอธิบายได้" />
            <Switch checked={form.is_active ?? true} onChange={(v) => onChange({ is_active: v })} label="เปิดใช้งานชุดข้อสอบ" description="ปิดไว้ระหว่างเตรียมข้อสอบ" />
          </div>
        </Card>
      </aside>

      <PreviewDialog open={preview} onClose={() => setPreview(false)} form={form} />
    </div>
  );
}

// =====================================================================
// Question card
// =====================================================================

function QuestionCard({
  q,
  index,
  total,
  error,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: {
  q: ExamQuestion;
  index: number;
  total: number;
  error: string | null;
  onChange: (q: ExamQuestion) => void;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[q.type] || CircleDot;
  const set = (patch: Partial<ExamQuestion>) => onChange({ ...q, ...patch });

  return (
    <Card id={`q-${q.id}`} className={cn('scroll-mt-40 overflow-hidden transition', error && 'border-brand-300 ring-4 ring-brand-600/5')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-zinc-900 px-2 text-xs font-semibold text-zinc-50 tabular">{index + 1}</span>
        <div className="w-44">
          <Select value={q.type} onChange={(e) => onChange(convertType(q, e.target.value as QuestionType))} className="h-8 rounded-lg text-[0.8125rem]">
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <Icon className="hidden h-4 w-4 text-zinc-400 sm:block" />
        <div className="ml-auto flex items-center gap-1">
          <label className="mr-1 flex items-center gap-1.5 text-[0.8125rem] text-zinc-600">
            คะแนน
            <input
              type="number"
              min={0}
              step="0.5"
              inputMode="decimal"
              value={q.score}
              onChange={(e) => set({ score: Number(e.target.value) })}
              className="control h-8 w-16 rounded-lg px-2 text-center text-[0.8125rem] tabular"
              aria-label="คะแนนของข้อนี้"
            />
          </label>
          <IconBtn label="เลื่อนขึ้น" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="เลื่อนลง" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="ทำสำเนา" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="ลบ" onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <Textarea
          rows={2}
          value={q.question_text}
          invalid={!!error && !q.question_text.trim()}
          onChange={(e) => set({ question_text: e.target.value })}
          placeholder="พิมพ์โจทย์คำถาม…"
          className="text-[0.9375rem]"
          aria-label={`โจทย์ข้อที่ ${index + 1}`}
        />

        {(q.type === 'single_choices' || q.type === 'multiple_choices') && <ChoicesEditor q={q} onChange={onChange} />}
        {q.type === 'true_false' && <TrueFalseEditor q={q} onChange={onChange} />}
        {q.type === 'matching' && <MatchingEditor q={q} onChange={onChange} />}
        {q.type === 'short_answer' && <ShortAnswerEditor q={q} onChange={onChange} />}
        {q.type === 'text_choices' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ข้อความแนะนำในช่องตอบ">
              {(id) => <Input id={id} value={q.placeholder_text || ''} onChange={(e) => set({ placeholder_text: e.target.value })} placeholder="เช่น อธิบายขั้นตอนอย่างน้อย 3 ข้อ" />}
            </Field>
            <Field label="แนวคำตอบ / เกณฑ์การตรวจ" hint="แสดงให้ผู้ตรวจเห็นตอนให้คะแนน">
              {(id) => <Textarea id={id} rows={2} value={q.correct_answer_text || ''} onChange={(e) => set({ correct_answer_text: e.target.value })} />}
            </Field>
          </div>
        )}

        <details className="group" open={!!q.explanation}>
          <summary className="cursor-pointer list-none text-[0.8125rem] font-medium text-zinc-500 hover:text-zinc-800">
            <span className="group-open:hidden">+ เพิ่มคำอธิบายเฉลย</span>
            <span className="hidden group-open:inline">คำอธิบายเฉลย (แสดงหลังส่งคำตอบ)</span>
          </summary>
          <Textarea rows={2} className="mt-2" value={q.explanation || ''} onChange={(e) => set({ explanation: e.target.value })} placeholder="อธิบายว่าทำไมคำตอบนี้ถูก" />
        </details>

        {error && (
          <div className="flex items-center gap-2 text-[0.8125rem] text-brand-700">
            <TriangleAlert className="h-3.5 w-3.5" />
            {error.replace(/^ข้อที่ \d+: /, '')}
          </div>
        )}
      </div>
    </Card>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30',
        danger && 'hover:bg-brand-50 hover:text-brand-700'
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------
// Per-type editors
// ---------------------------------------------------------------------

function ChoicesEditor({ q, onChange }: { q: ExamQuestion; onChange: (q: ExamQuestion) => void }) {
  const single = q.type === 'single_choices';
  const choices = q.choices || [];
  const setChoices = (c: ExamChoice[]) => onChange({ ...q, choices: c });

  const toggleCorrect = (id: string) =>
    setChoices(choices.map((c) => (single ? { ...c, is_correct: c.id === id } : c.id === id ? { ...c, is_correct: !c.is_correct } : c)));

  return (
    <div className="space-y-2">
      <div className="text-[0.8125rem] text-zinc-500">
        {single ? 'คลิกวงกลมเพื่อเลือกคำตอบที่ถูก 1 ข้อ' : 'ติ๊กทุกข้อที่เป็นคำตอบที่ถูก'}
      </div>
      {choices.map((c, i) => (
        <div
          key={c.id}
          className={cn(
            'flex items-center gap-2 rounded-xl border p-1.5 pl-2 transition',
            c.is_correct ? 'border-emerald-300 bg-emerald-50/60' : 'border-zinc-200 bg-surface'
          )}
        >
          <button
            type="button"
            onClick={() => toggleCorrect(c.id)}
            aria-label={c.is_correct ? 'คำตอบที่ถูก' : 'ตั้งเป็นคำตอบที่ถูก'}
            aria-pressed={c.is_correct}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center border-2 transition',
              single ? 'rounded-full' : 'rounded-md',
              c.is_correct ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-zinc-300 text-transparent hover:border-emerald-500'
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
          <span className="w-5 text-center text-sm font-medium text-zinc-400">{THAI_LETTERS[i] || i + 1}</span>
          <input
            value={c.choice_text}
            onChange={(e) => setChoices(choices.map((x) => (x.id === c.id ? { ...x, choice_text: e.target.value } : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (i === choices.length - 1) setChoices([...choices, newChoice()]);
                requestAnimationFrame(() => {
                  const inputs = (e.target as HTMLElement).closest('.space-y-2')?.querySelectorAll<HTMLInputElement>('input[data-choice]');
                  inputs?.[i + 1]?.focus();
                });
              }
            }}
            data-choice
            placeholder={`ตัวเลือก ${THAI_LETTERS[i] || i + 1}`}
            className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
          {c.is_correct && <Badge tone="green">ถูก</Badge>}
          <button
            type="button"
            disabled={choices.length <= 2}
            onClick={() => setChoices(choices.filter((x) => x.id !== c.id))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-brand-700 disabled:opacity-30"
            aria-label="ลบตัวเลือก"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setChoices([...choices, newChoice()])} disabled={choices.length >= 10}>
          เพิ่มตัวเลือก
        </Button>
        {!single && (
          <div className="w-full sm:w-auto">
            <Switch
              checked={!!q.partial_credit}
              onChange={(v) => onChange({ ...q, partial_credit: v })}
              label="ให้คะแนนบางส่วน"
              description="ได้คะแนนตามสัดส่วนข้อที่ถูก หักข้อที่เลือกผิด"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TrueFalseEditor({ q, onChange }: { q: ExamQuestion; onChange: (q: ExamQuestion) => void }) {
  return (
    <div>
      <div className="mb-2 text-[0.8125rem] text-zinc-500">เลือกคำตอบที่ถูกต้อง</div>
      <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
        {[
          { v: true, label: 'ถูก' },
          { v: false, label: 'ผิด' },
        ].map((o) => {
          const on = q.true_false_answer === o.v;
          return (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => onChange({ ...q, true_false_answer: o.v })}
              aria-pressed={on}
              className={cn(
                'flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition',
                on
                  ? o.v
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_0_4px_rgb(16_185_129/0.12)]'
                    : 'border-brand-500 bg-brand-50 text-brand-800 shadow-ring'
                  : 'border-zinc-200 bg-surface text-zinc-600 hover:border-zinc-300'
              )}
            >
              {on && <Check className="h-4 w-4" strokeWidth={3} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchingEditor({ q, onChange }: { q: ExamQuestion; onChange: (q: ExamQuestion) => void }) {
  const pairs = q.matching_pairs || [];
  const setPairs = (p: MatchingPair[]) => onChange({ ...q, matching_pairs: p });
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-1 text-[0.8125rem] text-zinc-500">
        <span>ฝั่งซ้าย (โจทย์)</span>
        <span>ฝั่งขวา (คำตอบที่คู่กัน)</span>
        <span />
      </div>
      {pairs.map((p, i) => (
        <div key={p.id} className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 tabular">{i + 1}</span>
            <Input value={p.left_text} onChange={(e) => setPairs(pairs.map((x) => (x.id === p.id ? { ...x, left_text: e.target.value } : x)))} className="h-10 pl-8" placeholder="เช่น ค้อน" />
          </div>
          <Input value={p.right_text} onChange={(e) => setPairs(pairs.map((x) => (x.id === p.id ? { ...x, right_text: e.target.value } : x)))} className="h-10" placeholder="เช่น ใช้ตอกตะปู" />
          <button
            type="button"
            disabled={pairs.length <= 2}
            onClick={() => setPairs(pairs.filter((x) => x.id !== p.id))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-brand-700 disabled:opacity-30"
            aria-label="ลบคู่"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setPairs([...pairs, newPair()])} disabled={pairs.length >= 12}>
          เพิ่มคู่
        </Button>
        <span className="text-xs text-zinc-500">ผู้สอบเห็นฝั่งขวาแบบสุ่มลำดับ · คิดคะแนนตามสัดส่วนคู่ที่ถูก</span>
      </div>
    </div>
  );
}

function ShortAnswerEditor({ q, onChange }: { q: ExamQuestion; onChange: (q: ExamQuestion) => void }) {
  const [draft, setDraft] = useState('');
  const answers = q.accepted_answers || [];
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!answers.some((a) => a.trim().toLowerCase() === v.toLowerCase())) onChange({ ...q, accepted_answers: [...answers, v] });
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="text-[0.8125rem] text-zinc-500">คำตอบที่ยอมรับ (ไม่สนตัวพิมพ์เล็ก/ใหญ่และช่องว่างซ้ำ) — กด Enter เพื่อเพิ่ม</div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-surface p-1.5 focus-within:border-brand-500 focus-within:shadow-ring">
        {answers.map((a, i) => (
          <span key={`${a}-${i}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 py-1 pl-2.5 pr-1 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            {a}
            <button
              type="button"
              onClick={() => onChange({ ...q, accepted_answers: answers.filter((_, j) => j !== i) })}
              className="rounded p-0.5 hover:bg-emerald-100"
              aria-label={`ลบ ${a}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && answers.length) {
              onChange({ ...q, accepted_answers: answers.slice(0, -1) });
            }
          }}
          onBlur={add}
          placeholder={answers.length ? 'เพิ่มคำตอบอื่นที่ยอมรับ…' : 'พิมพ์คำตอบที่ถูก แล้วกด Enter'}
          className="h-8 min-w-[160px] flex-1 border-0 bg-transparent px-2 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Candidate-view preview (read-only)
// ---------------------------------------------------------------------

function PreviewDialog({ open, onClose, form }: { open: boolean; onClose: () => void; form: FormDraft }) {
  const questions = form.questions || [];
  return (
    <Dialog open={open} onClose={onClose} size="lg" title={form.title || 'ตัวอย่างข้อสอบ'} description={`${questions.length} ข้อ · ${form.time_limit_minutes} นาที · ผ่าน ${form.passing_percentage}% — มุมมองผู้สอบ (ไม่แสดงเฉลย)`}>
      <div className="space-y-5 pb-2">
        {form.description && <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">{form.description}</div>}
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-3 border-b border-zinc-100 pb-5 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[0.9375rem] font-medium text-zinc-900">
                <span className="mr-1.5 text-zinc-400">{i + 1}.</span>
                {q.question_text || <span className="text-zinc-400">(ยังไม่มีโจทย์)</span>}
              </div>
              <Badge className="shrink-0">
                {QUESTION_TYPE_LABEL[q.type]} · {num(q.score)} คะแนน
              </Badge>
            </div>
            {(q.type === 'single_choices' || q.type === 'multiple_choices') && (
              <div className="space-y-1.5">
                {q.choices.map((c, j) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700">
                    <span className={cn('h-4 w-4 border-2 border-zinc-300', q.type === 'single_choices' ? 'rounded-full' : 'rounded')} />
                    <span className="text-zinc-400">{THAI_LETTERS[j]}.</span> {c.choice_text}
                  </div>
                ))}
              </div>
            )}
            {q.type === 'true_false' && (
              <div className="grid max-w-xs grid-cols-2 gap-2">
                {['ถูก', 'ผิด'].map((l) => (
                  <div key={l} className="rounded-xl border border-zinc-200 py-2.5 text-center text-sm text-zinc-700">
                    {l}
                  </div>
                ))}
              </div>
            )}
            {q.type === 'matching' && (
              <div className="space-y-1.5">
                {(q.matching_pairs || []).map((p) => (
                  <div key={p.id} className="grid grid-cols-2 items-center gap-2 text-sm">
                    <div className="rounded-xl bg-zinc-50 px-3.5 py-2.5 text-zinc-800">{p.left_text}</div>
                    <div className="rounded-xl border border-zinc-200 px-3.5 py-2.5 text-zinc-400">เลือกคำตอบ…</div>
                  </div>
                ))}
              </div>
            )}
            {q.type === 'short_answer' && <div className="h-11 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-400">พิมพ์คำตอบ…</div>}
            {q.type === 'text_choices' && (
              <div className="h-24 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-400">{q.placeholder_text || 'พิมพ์คำตอบ…'}</div>
            )}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
