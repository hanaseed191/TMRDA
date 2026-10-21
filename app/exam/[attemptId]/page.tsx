'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  CloudOff,
  Flag,
  Hourglass,
  LayoutGrid,
  LoaderCircle,
  Send,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/lib/auth';
import { attempts, courses, forms } from '@/lib/api';
import { cn } from '@/lib/cn';
import { QUESTION_TYPE_LABEL } from '@/lib/constants';
import { duration, errorMessage, num, thaiDateTime } from '@/lib/format';
import { useDebouncedCallback, useLoad, useNow, useUnsavedWarning } from '@/lib/hooks';
import { isAnswered } from '@/lib/scoring';
import type { AnswerMap, AnswerValue, ExamAttempt, TestForm, TrainingCourse } from '@/lib/types';
import { Badge, Button, ButtonLink, Callout, Card, Dialog, EmptyState, Kbd, ScoreRing } from '@/components/ui';
import { BrandMark } from '@/components/Brand';
import { QuestionInput, QuestionReview, TYPE_HINT } from '@/components/student/exam';

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface Backup {
  answers: AnswerMap;
  dirty: boolean;
  flagged?: string[];
}

const backupKey = (id: number) => `tmrda_attempt_${id}`;

function readBackup(id: number): Backup | null {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    return null;
  }
}

function writeBackup(id: number, b: Backup) {
  try {
    localStorage.setItem(backupKey(id), JSON.stringify(b));
  } catch {
    /* storage full / private mode — DB autosave still works */
  }
}

export default function ExamPage({ params }: { params: { attemptId: string } }) {
  const id = Number(params.attemptId);
  const user = useUser();
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [form, setForm] = useState<TestForm | null>(null);
  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!Number.isFinite(id)) throw new Error('NOT_FOUND');
        const a = await attempts.get(id);
        if (a.user_id !== user.id) throw new Error('FORBIDDEN');
        const [f, c] = await Promise.all([
          a.test_form_id ? forms.get(a.test_form_id).catch(() => null) : Promise.resolve(null),
          courses.get(a.training_id).catch(() => null),
        ]);
        if (!alive) return;
        setForm(f);
        setCourse(c);
        setAttempt(a);
      } catch (e) {
        if (alive) setLoadError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, user.id]);

  if (loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <EmptyState
            icon={<TriangleAlert className="h-5 w-5" />}
            title="เปิดข้อสอบไม่ได้"
            description={loadError}
            action={<ButtonLink href="/courses">กลับไปหน้าหลักสูตร</ButtonLink>}
          />
        </Card>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-zinc-500">
        <LoaderCircle className="h-7 w-7 animate-spin text-brand-600" />
        <span className="text-sm">กำลังเตรียมข้อสอบ…</span>
      </div>
    );
  }

  return attempt.status === 'in_progress' ? (
    <ExamRunner attempt={attempt} form={form} course={course} onFinished={setAttempt} />
  ) : (
    <ExamResult attempt={attempt} form={form} course={course} />
  );
}

// =====================================================================
// Taking the exam
// =====================================================================

function ExamRunner({
  attempt,
  form,
  course,
  onFinished,
}: {
  attempt: ExamAttempt;
  form: TestForm | null;
  course: TrainingCourse | null;
  onFinished: (a: ExamAttempt) => void;
}) {
  const questions = attempt.question_snapshot;
  const total = questions.length;
  const [answers, setAnswers] = useState<AnswerMap>(attempt.answers || {});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [save, setSave] = useState<{ state: SaveState; at?: Date }>({ state: 'idle' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef<AnswerMap>(answers);
  const flaggedRef = useRef<string[]>(flagged);
  const submittingRef = useRef(false);
  /** true once time is up — answers can no longer change */
  const lockedRef = useRef(false);
  const [retryTick, setRetryTick] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const now = useNow(1000);

  // Autosave: writes are queued so they reach the DB in order, and every change bumps a
  // sequence number so a slow, older save can never mark newer answers as "saved".
  const saveSeq = useRef(0);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const persist = useDebouncedCallback((next: AnswerMap, seq: number) => {
    setSave({ state: 'saving' });
    saveChain.current = saveChain.current.then(async () => {
      try {
        await attempts.saveAnswers(attempt.id, next);
        if (seq === saveSeq.current) {
          writeBackup(attempt.id, { answers: next, dirty: false, flagged: flaggedRef.current });
          setSave({ state: 'saved', at: new Date() });
        }
      } catch {
        if (seq === saveSeq.current) setSave({ state: 'error' });
      }
    });
  }, 800);

  // Restore an unsynced local backup (e.g. connection dropped before the last autosave).
  useEffect(() => {
    const b = readBackup(attempt.id);
    if (b?.flagged) {
      setFlagged(b.flagged);
      flaggedRef.current = b.flagged;
    }
    if (b?.dirty && b.answers) {
      answersRef.current = b.answers;
      setAnswers(b.answers);
      setSave({ state: 'pending' });
      persist(b.answers, ++saveSeq.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id]);

  const update = useCallback(
    (qid: string, v: AnswerValue | undefined) => {
      if (submittingRef.current || lockedRef.current) return;
      const next = { ...answersRef.current };
      if (v === undefined) delete next[qid];
      else next[qid] = v;
      answersRef.current = next;
      setAnswers(next);
      writeBackup(attempt.id, { answers: next, dirty: true, flagged: flaggedRef.current });
      setSave({ state: 'pending' });
      persist(next, ++saveSeq.current);
    },
    [attempt.id, persist]
  );

  const toggleFlag = useCallback(
    (qid: string) => {
      const next = flaggedRef.current.includes(qid) ? flaggedRef.current.filter((x) => x !== qid) : [...flaggedRef.current, qid];
      flaggedRef.current = next;
      setFlagged(next);
      writeBackup(attempt.id, { answers: answersRef.current, dirty: save.state !== 'saved' && save.state !== 'idle', flagged: next });
    },
    [attempt.id, save.state]
  );

  const submit = useCallback(
    async (auto: boolean) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      try {
        const done = await attempts.submit(attempt, answersRef.current);
        try {
          localStorage.removeItem(backupKey(attempt.id));
        } catch {
          /* ignore */
        }
        if (auto) toast.info('หมดเวลาสอบ ระบบส่งคำตอบให้อัตโนมัติแล้ว');
        else toast.success('ส่งคำตอบเรียบร้อย');
        window.scrollTo({ top: 0 });
        onFinished(done);
      } catch (e) {
        // Already submitted elsewhere (another tab / device)? Show that result instead.
        try {
          const fresh = await attempts.get(attempt.id);
          if (fresh.status !== 'in_progress') {
            onFinished(fresh);
            return;
          }
        } catch {
          /* fall through */
        }
        submittingRef.current = false;
        setSubmitting(false);
        if (auto) {
          // Time is up: keep retrying in the background until the server accepts it.
          setTimeout(() => setRetryTick((t) => t + 1), 5000);
        } else {
          toast.error(errorMessage(e), { description: 'คำตอบยังถูกเก็บไว้ในเครื่อง กรุณากดส่งอีกครั้ง' });
        }
      }
    },
    [attempt, onFinished]
  );

  const deadline = attempt.deadline_at ? new Date(attempt.deadline_at).getTime() : null;
  const remaining = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : null;
  const expired = remaining !== null && remaining <= 0;
  if (expired) lockedRef.current = true;

  useEffect(() => {
    if (expired) submit(true);
  }, [expired, retryTick, submit]);

  useUnsavedWarning(save.state === 'pending' || save.state === 'saving' || save.state === 'error');

  const q = questions[idx];
  const qid = q ? String(q.id) : '';
  const answeredCount = useMemo(() => questions.filter((x) => isAnswered(x, answers[String(x.id)])).length, [questions, answers]);
  const unanswered = useMemo(
    () => questions.map((x, i) => ({ x, i })).filter(({ x }) => !isAnswered(x, answers[String(x.id)])),
    [questions, answers]
  );

  const go = useCallback(
    (i: number) => {
      setIdx(Math.max(0, Math.min(total - 1, i)));
      setPaletteOpen(false);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [total]
  );

  // Keyboard: ←/→ navigate, 1–9 choose, F flag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (confirmOpen || paletteOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(idx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(idx - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlag(qid);
      } else if (/^[1-9]$/.test(e.key) && q) {
        const n = Number(e.key) - 1;
        if (q.type === 'single_choices' && q.choices[n]) update(qid, q.choices[n].id);
        if (q.type === 'multiple_choices' && q.choices[n]) {
          const cur = Array.isArray(answersRef.current[qid]) ? (answersRef.current[qid] as string[]) : [];
          const id = q.choices[n].id;
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          update(qid, next.length ? next : undefined);
        }
        if (q.type === 'true_false' && n < 2) update(qid, n === 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, q, qid, go, update, toggleFlag, confirmOpen, paletteOpen]);

  if (total === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <EmptyState title="ชุดข้อสอบนี้ยังไม่มีคำถาม" description="กรุณาติดต่อเจ้าหน้าที่" action={<ButtonLink href="/courses">กลับ</ButtonLink>} />
        </Card>
      </div>
    );
  }

  const timerTone = remaining === null ? 'neutral' : remaining < 60 ? 'red' : remaining < 300 ? 'amber' : 'neutral';

  const palette = (
    <div>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 lg:grid-cols-5">
        {questions.map((x, i) => {
          const k = String(x.id);
          const done = isAnswered(x, answers[k]);
          const fl = flagged.includes(k);
          return (
            <button
              key={k}
              onClick={() => go(i)}
              aria-label={`ข้อ ${i + 1}${done ? ' ตอบแล้ว' : ''}${fl ? ' ทำเครื่องหมายไว้' : ''}`}
              className={cn(
                'relative flex h-10 items-center justify-center rounded-xl text-sm font-medium tabular transition',
                i === idx
                  ? 'bg-zinc-950 text-zinc-50 shadow-lift'
                  : done
                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-surface text-zinc-600 ring-1 ring-inset ring-zinc-200 hover:ring-zinc-300'
              )}
            >
              {i + 1}
              {fl && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-surface" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.75rem] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-200" /> ตอบแล้ว
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded ring-1 ring-zinc-300" /> ยังไม่ตอบ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> ทำเครื่องหมาย
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas pb-24 lg:pb-10">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <BrandMark className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-950">{form?.title || 'แบบทดสอบภาคทฤษฎี'}</div>
            <div className="truncate text-[0.75rem] text-zinc-500">{course?.course_name}</div>
          </div>

          <SaveIndicator save={save} onRetry={() => persist(answersRef.current, ++saveSeq.current)} />

          {remaining !== null && (
            <div
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-xl px-3 font-display text-[0.9375rem] font-semibold tabular transition-colors',
                timerTone === 'red' && 'animate-pulse-ring bg-brand-600 text-white',
                timerTone === 'amber' && 'bg-amber-100 text-amber-900',
                timerTone === 'neutral' && 'bg-zinc-100 text-zinc-900'
              )}
              aria-live="off"
              title={`หมดเวลา ${thaiDateTime(attempt.deadline_at)}`}
            >
              <Timer className="h-4 w-4" />
              {duration(remaining)}
            </div>
          )}
          <Button size="sm" variant="dark" className="hidden sm:inline-flex" onClick={() => setConfirmOpen(true)} loading={submitting} icon={<Send className="h-3.5 w-3.5" />}>
            ส่งคำตอบ
          </Button>
        </div>
        <div className="h-0.5 bg-zinc-100">
          <div className="h-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </header>

      <div ref={topRef} className="mx-auto grid max-w-6xl scroll-mt-20 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Question */}
        <main className="min-w-0">
          {timerTone !== 'neutral' && (
            <Callout tone={timerTone === 'red' ? 'red' : 'amber'} icon={<Hourglass className="h-4 w-4" />} className="mb-4 animate-fade-in">
              {timerTone === 'red' ? 'เหลือเวลาไม่ถึง 1 นาที ระบบจะส่งคำตอบอัตโนมัติเมื่อหมดเวลา' : 'เหลือเวลาไม่ถึง 5 นาที ตรวจทานคำตอบและเตรียมส่ง'}
            </Callout>
          )}

          <Card key={qid} className="animate-fade-up p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-zinc-400">
                  ข้อ <span className="text-zinc-950">{idx + 1}</span> / {total}
                </span>
                <Badge>{QUESTION_TYPE_LABEL[q.type]}</Badge>
                <Badge tone="neutral">{num(q.score)} คะแนน</Badge>
              </div>
              <button
                onClick={() => toggleFlag(qid)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-medium transition',
                  flagged.includes(qid) ? 'bg-amber-100 text-amber-900' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                )}
              >
                <Flag className={cn('h-3.5 w-3.5', flagged.includes(qid) && 'fill-amber-500 text-amber-600')} />
                {flagged.includes(qid) ? 'ทำเครื่องหมายแล้ว' : 'ทำเครื่องหมาย'}
              </button>
            </div>

            <h2 className="mt-5 whitespace-pre-line font-sans text-lg font-medium leading-relaxed text-zinc-950 sm:text-xl">{q.question_text}</h2>
            <p className="mt-2 text-[0.8125rem] text-zinc-500">{TYPE_HINT[q.type]}</p>

            <div className="mt-6">
              <QuestionInput q={q} value={answers[qid]} onChange={(v) => update(qid, v)} seed={attempt.id} />
            </div>

            <div className="mt-8 hidden items-center justify-between border-t border-zinc-100 pt-5 lg:flex">
              <Button variant="ghost" disabled={idx === 0} onClick={() => go(idx - 1)} icon={<ArrowLeft className="h-4 w-4" />}>
                ข้อก่อนหน้า
              </Button>
              {idx < total - 1 ? (
                <Button variant="dark" onClick={() => go(idx + 1)} iconRight={<ArrowRight className="h-4 w-4" />}>
                  ข้อถัดไป
                </Button>
              ) : (
                <Button onClick={() => setConfirmOpen(true)} icon={<Send className="h-4 w-4" />}>
                  ตรวจทานและส่งคำตอบ
                </Button>
              )}
            </div>
          </Card>
        </main>

        {/* Palette (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">ภาพรวมข้อสอบ</span>
                <span className="text-sm tabular text-zinc-500">
                  <span className="font-semibold text-zinc-900">{answeredCount}</span>/{total}
                </span>
              </div>
              {palette}
              <Button className="mt-5 w-full" onClick={() => setConfirmOpen(true)} loading={submitting} icon={<Send className="h-4 w-4" />}>
                ส่งคำตอบ
              </Button>
            </Card>
            <div className="space-y-1.5 px-1 text-[0.75rem] text-zinc-500">
              <div className="flex items-center gap-2">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd> เปลี่ยนข้อ
              </div>
              <div className="flex items-center gap-2">
                <Kbd>1</Kbd>–<Kbd>9</Kbd> เลือกคำตอบ
              </div>
              <div className="flex items-center gap-2">
                <Kbd>F</Kbd> ทำเครื่องหมายทบทวน
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-surface/95 px-3 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Button variant="outline" size="icon" disabled={idx === 0} onClick={() => go(idx - 1)} aria-label="ข้อก่อนหน้า">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="soft" className="flex-1" onClick={() => setPaletteOpen(true)} icon={<LayoutGrid className="h-4 w-4" />}>
            ข้อ {idx + 1}/{total} · ตอบแล้ว {answeredCount}
          </Button>
          {idx < total - 1 ? (
            <Button variant="dark" size="icon" onClick={() => go(idx + 1)} aria-label="ข้อถัดไป">
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={() => setConfirmOpen(true)} aria-label="ส่งคำตอบ">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {expired && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-surface/75 p-6 backdrop-blur-sm" role="alertdialog" aria-live="assertive">
          <Card className="w-full max-w-sm animate-scale-in p-7 text-center shadow-pop">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Hourglass className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">หมดเวลาสอบ</h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              {submitting ? 'กำลังส่งคำตอบที่บันทึกไว้…' : 'ยังส่งคำตอบไม่สำเร็จ ระบบจะลองใหม่อัตโนมัติทุก 5 วินาที'}
            </p>
            <Button className="mt-5 w-full" onClick={() => submit(true)} loading={submitting} icon={<Send className="h-4 w-4" />}>
              ส่งคำตอบตอนนี้
            </Button>
          </Card>
        </div>
      )}

      <Dialog open={paletteOpen} onClose={() => setPaletteOpen(false)} title="ภาพรวมข้อสอบ" description={`ตอบแล้ว ${answeredCount} จาก ${total} ข้อ`}>
        <div className="pb-2">
          {palette}
          <Button
            className="mt-5 w-full"
            onClick={() => {
              setPaletteOpen(false);
              setConfirmOpen(true);
            }}
            icon={<Send className="h-4 w-4" />}
          >
            ส่งคำตอบ
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="md"
        title="ยืนยันส่งคำตอบ"
        description="เมื่อส่งแล้วจะแก้ไขคำตอบไม่ได้"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              กลับไปทำต่อ
            </Button>
            <Button onClick={() => submit(false)} loading={submitting} icon={<Send className="h-4 w-4" />}>
              ส่งคำตอบ
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-1">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <div className="font-display text-2xl font-semibold tabular text-emerald-700">{answeredCount}</div>
              <div className="text-[0.75rem] text-emerald-800">ตอบแล้ว</div>
            </div>
            <div className={cn('rounded-2xl p-3', unanswered.length ? 'bg-brand-50' : 'bg-zinc-50')}>
              <div className={cn('font-display text-2xl font-semibold tabular', unanswered.length ? 'text-brand-700' : 'text-zinc-400')}>{unanswered.length}</div>
              <div className={cn('text-[0.75rem]', unanswered.length ? 'text-brand-800' : 'text-zinc-500')}>ยังไม่ตอบ</div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <div className="font-display text-2xl font-semibold tabular text-amber-700">{flagged.length}</div>
              <div className="text-[0.75rem] text-amber-800">ทำเครื่องหมาย</div>
            </div>
          </div>
          {unanswered.length > 0 && (
            <div>
              <div className="mb-2 text-[0.8125rem] font-medium text-zinc-700">ข้อที่ยังไม่ได้ตอบ (คลิกเพื่อไปยังข้อนั้น)</div>
              <div className="flex flex-wrap gap-1.5">
                {unanswered.map(({ x, i }) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      setConfirmOpen(false);
                      go(i);
                    }}
                    className="h-8 min-w-8 rounded-lg bg-surface px-2 text-sm font-medium tabular text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          {save.state === 'error' && (
            <Callout tone="amber" icon={<CloudOff className="h-4 w-4" />}>
              การบันทึกอัตโนมัติล่าสุดไม่สำเร็จ — ไม่ต้องกังวล คำตอบทั้งหมดจะถูกส่งไปพร้อมกันเมื่อกดส่ง
            </Callout>
          )}
        </div>
      </Dialog>
    </div>
  );
}

function SaveIndicator({ save, onRetry }: { save: { state: SaveState; at?: Date }; onRetry: () => void }) {
  if (save.state === 'idle') return null;
  const base = 'hidden items-center gap-1.5 text-[0.75rem] md:inline-flex';
  if (save.state === 'error')
    return (
      <button onClick={onRetry} className={cn(base, 'rounded-lg px-2 py-1 text-brand-700 hover:bg-brand-50')}>
        <CloudOff className="h-3.5 w-3.5" />
        บันทึกไม่สำเร็จ · ลองใหม่
      </button>
    );
  if (save.state === 'saved' && save.at)
    return (
      <span className={cn(base, 'text-zinc-500')}>
        <Check className="h-3.5 w-3.5 text-emerald-600" />
        บันทึกแล้ว {save.at.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  return (
    <span className={cn(base, 'text-zinc-500')}>
      <Cloud className="h-3.5 w-3.5 animate-pulse" />
      กำลังบันทึก…
    </span>
  );
}

// =====================================================================
// Result
// =====================================================================

function ExamResult({ attempt, form, course }: { attempt: ExamAttempt; form: TestForm | null; course: TrainingCourse | null }) {
  const router = useRouter();
  const user = useUser();
  // The answer key is only revealed once the candidate can no longer retake this set
  // (all attempts used, or the exam window has closed) — otherwise a retake would be trivial.
  const { data: siblingCount } = useLoad(
    async () => (form ? (await attempts.list({ userId: user.id, formId: form.id })).length : 0),
    [form?.id, user.id]
  );
  const windowClosed = !!form?.exam_end_date && Date.now() > new Date(form.exam_end_date).getTime();
  const noRetakesLeft = siblingCount !== null && !!form && siblingCount >= (form.max_attempts || 1);
  const keyAllowed = !!form?.show_answers;
  const showAnswers = keyAllowed && (noRetakesLeft || windowClosed || !form?.is_active);
  const pending = attempt.needs_review || attempt.status === 'submitted';
  const passed = pending ? null : attempt.passed;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-zinc-200/70 bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <BrandMark className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{form?.title || 'ผลการสอบภาคทฤษฎี'}</div>
            <div className="truncate text-[0.75rem] text-zinc-500">{course?.course_name}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} icon={<ArrowLeft className="h-4 w-4" />}>
            กลับ
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Card className="relative animate-fade-up overflow-hidden p-6 text-center sm:p-10">
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b',
              passed === true ? 'from-emerald-50' : passed === false ? 'from-brand-50' : 'from-zinc-50',
              'to-transparent'
            )}
          />
          <div className="relative">
            <ScoreRing value={pending ? null : Number(attempt.score)} max={Number(attempt.max_score)} passed={passed} size={148} stroke={10} label={pending ? 'รอตรวจ' : 'คะแนน'} />
            <h1 className="mt-5 text-2xl font-semibold">
              {pending ? 'ส่งคำตอบเรียบร้อย' : passed ? 'ยินดีด้วย คุณสอบผ่าน' : 'ยังไม่ผ่านเกณฑ์ในครั้งนี้'}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              {pending
                ? 'ข้อสอบนี้มีข้อเขียนที่ต้องให้เจ้าหน้าที่ตรวจ ผลสุดท้ายจะแสดงในหน้า “ผลสอบและใบประกาศ” เมื่อตรวจเสร็จ'
                : passed
                  ? 'ผลสอบภาคทฤษฎีถูกบันทึกแล้ว ขั้นตอนต่อไปคือการประเมินภาคปฏิบัติ (ถ้ามี)'
                  : 'ทบทวนเนื้อหาแล้วลองใหม่ได้หากยังมีสิทธิ์สอบเหลืออยู่'}
            </p>
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 divide-x divide-zinc-100 rounded-2xl border border-zinc-200 bg-surface">
              <div className="p-3">
                <div className="font-display text-xl font-semibold tabular">
                  {num(attempt.score)}
                  <span className="text-sm text-zinc-400">/{num(attempt.max_score)}</span>
                </div>
                <div className="text-[0.75rem] text-zinc-500">{pending ? 'คะแนนส่วนที่ตรวจแล้ว' : 'คะแนนที่ได้'}</div>
              </div>
              <div className="p-3">
                <div className="font-display text-xl font-semibold tabular">{pending ? '—' : `${num(attempt.percent, 1)}%`}</div>
                <div className="text-[0.75rem] text-zinc-500">ร้อยละ</div>
              </div>
              <div className="p-3">
                <div className="font-display text-xl font-semibold tabular">{num(attempt.passing_percentage, 0)}%</div>
                <div className="text-[0.75rem] text-zinc-500">เกณฑ์ผ่าน</div>
              </div>
            </div>
            <p className="mt-4 text-[0.75rem] text-zinc-400">ส่งเมื่อ {thaiDateTime(attempt.submitted_at)}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <ButtonLink href="/results" variant="dark">
                ดูผลสอบทั้งหมด
              </ButtonLink>
              <ButtonLink href="/courses" variant="outline">
                กลับไปหน้าหลักสูตร
              </ButtonLink>
            </div>
          </div>
        </Card>

        {showAnswers ? (
          <section className="space-y-3">
            <div className="flex items-end justify-between">
              <h2 className="text-lg font-semibold">เฉลยและคำตอบของคุณ</h2>
              <span className="text-sm text-zinc-500">{attempt.question_snapshot.length} ข้อ</span>
            </div>
            {attempt.question_snapshot.map((q, i) => (
              <QuestionReview key={q.id} q={q} index={i} value={attempt.answers?.[String(q.id)]} manualScore={attempt.manual_scores?.[String(q.id)]} />
            ))}
          </section>
        ) : (
          <p className="text-center text-sm text-zinc-500">
            {keyAllowed
              ? 'เฉลยจะแสดงเมื่อคุณใช้สิทธิ์สอบครบ หรือเมื่อปิดรอบการสอบแล้ว'
              : 'ชุดข้อสอบนี้ไม่เปิดเผยเฉลย'}
          </p>
        )}
        <div className="h-6" />
      </main>
    </div>
  );
}
