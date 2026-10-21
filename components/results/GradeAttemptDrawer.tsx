'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CircleCheck, CircleX, PenLine } from 'lucide-react';
import { attempts } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage, fullName, num, thaiDateTime } from '@/lib/format';
import { gradeAttempt, gradeQuestion } from '@/lib/scoring';
import { QUESTION_TYPE_LABEL } from '@/lib/constants';
import type { AnswerValue, ExamAttempt, ExamQuestion, User } from '@/lib/types';
import { Badge, Button, Callout, Drawer, Input } from '@/components/ui';
import { PassFail } from '@/components/status';

function describeAnswer(q: ExamQuestion, a: AnswerValue | undefined): string {
  if (a === undefined || a === null || a === '') return '— ไม่ได้ตอบ —';
  switch (q.type) {
    case 'single_choices':
      return q.choices.find((c) => c.id === a)?.choice_text || '—';
    case 'multiple_choices':
      return (Array.isArray(a) ? a : [])
        .map((id) => q.choices.find((c) => c.id === id)?.choice_text)
        .filter(Boolean)
        .join(', ');
    case 'true_false':
      return a === true ? 'ถูก' : 'ผิด';
    case 'matching': {
      const map = (a || {}) as Record<string, string>;
      return (q.matching_pairs || [])
        .map((p) => `${p.left_text} → ${(q.matching_pairs || []).find((x) => x.id === map[p.id])?.right_text || '—'}`)
        .join(' · ');
    }
    default:
      return String(a);
  }
}

export default function GradeAttemptDrawer({
  attempt,
  candidate,
  open,
  onClose,
  onSaved,
  readOnly = false,
}: {
  attempt: ExamAttempt | null;
  candidate: User | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Results already sent to / approved by the director — scores can no longer change. */
  readOnly?: boolean;
}) {
  const { user } = useAuth();
  const [manual, setManual] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!attempt) return;
    const init: Record<string, string> = {};
    for (const [k, v] of Object.entries(attempt.manual_scores || {})) init[k] = String(v);
    setManual(init);
  }, [attempt]);

  const questions = useMemo(() => attempt?.question_snapshot || [], [attempt]);
  const essays = questions.filter((q) => q.type === 'text_choices');
  const auto = questions.filter((q) => q.type !== 'text_choices');

  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(manual)) {
      if (v.trim() === '') continue;
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  }, [manual]);

  const preview = attempt ? gradeAttempt(questions, attempt.answers || {}, parsed, attempt.passing_percentage) : null;

  const invalid = essays.some((q) => {
    const v = manual[String(q.id)];
    if (v === undefined || v.trim() === '') return false;
    const n = Number(v);
    return !Number.isFinite(n) || n < 0 || n > Number(q.score);
  });

  const save = async () => {
    if (!attempt || !user || readOnly) return;
    if (invalid) return toast.error('คะแนนบางข้อเกินคะแนนเต็มหรือไม่ถูกต้อง');
    setSaving(true);
    try {
      await attempts.grade(attempt, parsed, user.id);
      toast.success(preview?.needsReview ? 'บันทึกคะแนนบางส่วนแล้ว' : 'ตรวจให้คะแนนครบแล้ว');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={readOnly ? 'คำตอบข้อสอบ (ล็อกแล้ว)' : 'ตรวจข้อสอบอัตนัย'}
      description={candidate ? `${fullName(candidate)} · ส่งเมื่อ ${thaiDateTime(attempt?.submitted_at)}` : undefined}
      footer={
        readOnly ? (
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button variant="dark" loading={saving} onClick={save} disabled={!attempt || invalid}>
              บันทึกคะแนน
            </Button>
          </>
        )
      }
    >
      {attempt && preview && (
        <div className="space-y-6">
          {readOnly && (
            <Callout tone="blue" title="ผลนี้ส่งให้ผู้อำนวยการแล้ว">
              แก้คะแนนไม่ได้ หากต้องการแก้ไข ให้ “ดึงกลับ” ผลก่อน (ทำได้เฉพาะรายการที่ยังไม่ได้อนุมัติ)
            </Callout>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-xs text-zinc-500">คะแนนรวม (คาดการณ์)</div>
              <div className="mt-1 font-display text-xl font-semibold tabular">
                {num(preview.score)} <span className="text-sm font-normal text-zinc-400">/ {num(preview.max)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-xs text-zinc-500">ร้อยละ</div>
              <div className="mt-1 font-display text-xl font-semibold tabular">{num(preview.percent)}%</div>
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-xs text-zinc-500">เกณฑ์ {num(attempt.passing_percentage)}%</div>
              <div className="mt-1.5">
                <PassFail passed={preview.passed} />
              </div>
            </div>
          </div>

          {essays.length === 0 ? (
            <Callout tone="neutral">ชุดข้อสอบนี้ไม่มีข้อสอบอัตนัย</Callout>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">ข้ออัตนัย ({essays.length})</h3>
              {essays.map((q) => {
                const idx = questions.indexOf(q) + 1;
                const key = String(q.id);
                const answer = attempt.answers?.[key];
                const answered = typeof answer === 'string' && answer.trim().length > 0;
                const v = manual[key] ?? '';
                const n = Number(v);
                const bad = v.trim() !== '' && (!Number.isFinite(n) || n < 0 || n > Number(q.score));
                return (
                  <div key={key} className="rounded-2xl border border-zinc-200 bg-surface">
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                      <div className="min-w-0">
                        <div className="eyebrow">ข้อที่ {idx}</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-zinc-900">{q.question_text}</p>
                      </div>
                      <Badge tone="neutral">{num(q.score)} คะแนน</Badge>
                    </div>
                    <div className="space-y-3 px-4 py-3">
                      <div>
                        <div className="mb-1 text-xs font-medium text-zinc-500">คำตอบผู้สอบ</div>
                        <div className="whitespace-pre-wrap rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800">
                          {answered ? String(answer) : <span className="text-zinc-400">— ไม่ได้ตอบ (0 คะแนนอัตโนมัติ) —</span>}
                        </div>
                      </div>
                      {q.correct_answer_text && (
                        <div>
                          <div className="mb-1 text-xs font-medium text-zinc-500">แนวคำตอบ</div>
                          <div className="whitespace-pre-wrap rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-900">
                            {q.correct_answer_text}
                          </div>
                        </div>
                      )}
                      {answered && readOnly && (
                        <div className="text-sm text-zinc-600">
                          คะแนนที่ได้{' '}
                          <span className="font-semibold tabular text-zinc-900">
                            {attempt.manual_scores?.[key] !== undefined ? num(attempt.manual_scores[key]) : '—'}
                          </span>{' '}
                          / {num(q.score)}
                        </div>
                      )}
                      {answered && !readOnly && (
                        <div className="flex flex-wrap items-center gap-2">
                          <PenLine className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-zinc-600">ให้คะแนน</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={q.score}
                            step={0.5}
                            value={v}
                            invalid={bad}
                            onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                            className="h-9 w-24 text-center tabular"
                            aria-label={`คะแนนข้อ ${idx}`}
                          />
                          <span className="text-sm text-zinc-400">/ {num(q.score)}</span>
                          <div className="ml-auto flex gap-1">
                            {[0, Number(q.score) / 2, Number(q.score)].map((s, i) => (
                              <Button key={i} size="sm" variant="soft" onClick={() => setManual((m) => ({ ...m, [key]: String(s) }))}>
                                {i === 0 ? '0' : i === 1 ? 'ครึ่ง' : 'เต็ม'}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {auto.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">ข้อที่ตรวจอัตโนมัติ ({auto.length})</h3>
              <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
                {auto.map((q) => {
                  const g = gradeQuestion(q, attempt.answers?.[String(q.id)]);
                  return (
                    <div key={q.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                      {g.correct ? (
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-zinc-800">
                          {questions.indexOf(q) + 1}. {q.question_text}
                        </div>
                        <div className="truncate text-xs text-zinc-500">
                          {QUESTION_TYPE_LABEL[q.type]} · ตอบ: {describeAnswer(q, attempt.answers?.[String(q.id)])}
                        </div>
                      </div>
                      <span className="shrink-0 tabular text-zinc-600">
                        {num(g.earned)}/{num(g.max)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
