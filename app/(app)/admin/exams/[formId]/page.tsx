'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, ClipboardCheck, FileText, Save, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { attempts, courses, forms, rounds, scores } from '@/lib/api';
import { useLoad, useUnsavedWarning } from '@/lib/hooks';
import { errorMessage, relativeTime } from '@/lib/format';
import { validateQuestion } from '@/lib/scoring';
import type { TestForm, TrainingCourse } from '@/lib/types';
import { Badge, Button, Callout, Kbd, Skeleton } from '@/components/ui';
import TheoryBuilder, { type FormDraft } from '@/components/admin/TheoryBuilder';
import PracticalBuilder, { validateTree } from '@/components/admin/PracticalBuilder';

function defaults(trainingId: number, type: 'theory' | 'practical'): FormDraft {
  return type === 'theory'
    ? {
        training_id: trainingId,
        exam_type: 'theory',
        title: 'แบบทดสอบภาคทฤษฎี',
        description: '',
        time_limit_minutes: 60,
        passing_percentage: 60,
        max_attempts: 1,
        show_answers: true,
        randomize_questions: false,
        randomize_choices: false,
        is_active: true,
        exam_start_date: null,
        exam_end_date: null,
        questions: [],
        practical_items: [],
      }
    : {
        training_id: trainingId,
        exam_type: 'practical',
        title: 'แบบประเมินภาคปฏิบัติ',
        description: '',
        time_limit_minutes: 180,
        passing_percentage: 60,
        max_attempts: 1,
        show_answers: false,
        is_active: true,
        questions: [],
        practical_items: [],
      };
}

function ExamBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const isNew = formId === 'new';
  const courseParam = Number(search.get('course'));
  const typeParam = search.get('type') === 'practical' ? 'practical' : 'theory';

  const { data, loading, error } = useLoad<{
    form: FormDraft;
    course: TrainingCourse;
    attemptCount: number;
    /** practical: number of evaluator score sheets already recorded against this form */
    scoreCount: number;
  }>(async () => {
    if (isNew) {
      if (!courseParam) throw new Error('ไม่ได้ระบุหลักสูตร');
      const course = await courses.get(courseParam);
      return { form: defaults(course.id, typeParam), course, attemptCount: 0, scoreCount: 0 };
    }
    const form = await forms.get(Number(formId));
    const [course, att, scoreCount] = await Promise.all([
      courses.get(form.training_id),
      form.exam_type === 'theory' ? attempts.list({ formId: form.id }) : Promise.resolve([]),
      form.exam_type === 'practical'
        ? rounds.list({ trainingId: form.training_id }).then(async (rs) => {
            const ids = rs.filter((r) => r.test_form_id === form.id).map((r) => r.id);
            return ids.length ? (await scores.list({ roundIds: ids })).length : 0;
          })
        : Promise.resolve(0),
    ]);
    return { form, course, attemptCount: att.length, scoreCount };
  }, [formId, courseParam, typeParam]);

  const [draft, setDraft] = useState<FormDraft | null>(null);
  const [savedJson, setSavedJson] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDraft(data.form);
    setSavedJson(JSON.stringify(data.form));
    setShowErrors(false);
  }, [data]);

  const dirty = !!draft && JSON.stringify(draft) !== savedJson;
  useUnsavedWarning(dirty);

  const patch = useCallback((p: Partial<FormDraft>) => setDraft((d) => (d ? { ...d, ...p } : d)), []);

  const isTheory = draft?.exam_type === 'theory';

  const firstError = useMemo(() => {
    if (!draft) return null;
    if (!draft.title?.trim()) return { msg: 'กรุณาตั้งชื่อชุด', anchor: 'form-title' };
    if (draft.exam_type === 'theory') {
      const qs = draft.questions || [];
      if (qs.length === 0) return { msg: 'ต้องมีคำถามอย่างน้อย 1 ข้อ', anchor: null };
      for (let i = 0; i < qs.length; i++) {
        const e = validateQuestion(qs[i], i);
        if (e) return { msg: e, anchor: `q-${qs[i].id}` };
      }
      if (draft.exam_start_date && draft.exam_end_date && draft.exam_end_date <= draft.exam_start_date)
        return { msg: 'เวลาปิดรับการสอบต้องหลังเวลาเปิด', anchor: null };
    } else {
      const e = validateTree(draft.practical_items || []);
      if (e) return { msg: e, anchor: null };
    }
    if (!(Number(draft.time_limit_minutes) > 0)) return { msg: 'เวลาสอบต้องมากกว่า 0 นาที', anchor: null };
    return null;
  }, [draft]);

  // Guards against creating the same new form twice (double click / Ctrl+S before navigation).
  const savingRef = useRef(false);
  const createdIdRef = useRef<number | null>(null);

  const save = useCallback(async () => {
    if (!draft || savingRef.current) return;
    if (firstError) {
      setShowErrors(true);
      toast.error(firstError.msg);
      if (firstError.anchor) {
        const el = document.getElementById(firstError.anchor);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
      }
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      // Once created, further saves on this page update that record instead of inserting again.
      const payload = createdIdRef.current ? { ...draft, id: createdIdRef.current } : draft;
      const saved: TestForm = await forms.save(payload);
      const firstCreate = isNew && !createdIdRef.current;
      if (isNew) createdIdRef.current = saved.id;
      setSavedJson(JSON.stringify(draft));
      setSavedAt(new Date().toISOString());
      toast.success(firstCreate ? 'สร้างชุดเรียบร้อย' : 'บันทึกแล้ว');
      if (firstCreate) router.replace(`/admin/exams/${saved.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [draft, firstError, isNew, router]);

  // Ctrl / Cmd + S
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (error) {
    return (
      <Callout tone="red" title="เปิดชุดข้อสอบไม่สำเร็จ" action={<Link href="/admin/courses" className="text-sm font-medium underline">กลับหน้าหลักสูตร</Link>}>
        {error}
      </Callout>
    );
  }

  if (loading || !data || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const backHref = `/admin/courses/${data.course.id}?tab=${isTheory ? 'theory' : 'practical'}`;

  return (
    <>
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-zinc-200/70 bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-surface text-zinc-600 transition hover:text-zinc-950"
            aria-label="กลับ"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {isTheory ? <FileText className="h-3.5 w-3.5" /> : <ClipboardCheck className="h-3.5 w-3.5" />}
              <span className="truncate">
                {isTheory ? 'ข้อสอบภาคทฤษฎี' : 'แบบประเมินภาคปฏิบัติ'} · {data.course.course_name}
              </span>
            </div>
            <input
              id="form-title"
              value={draft.title || ''}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="ตั้งชื่อชุด…"
              aria-invalid={(showErrors && !draft.title?.trim()) || undefined}
              className="-ml-1.5 mt-0.5 w-full rounded-lg border border-transparent bg-transparent px-1.5 font-display text-lg font-semibold text-zinc-950 placeholder:text-zinc-400 hover:border-zinc-200 focus:border-brand-500 focus:bg-surface focus:outline-none aria-[invalid=true]:border-brand-300"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[0.8125rem] text-zinc-500 md:block">
              {dirty ? (
                <Badge tone="amber" dot>
                  ยังไม่บันทึก
                </Badge>
              ) : savedAt ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> บันทึกแล้ว {relativeTime(savedAt)}
                </span>
              ) : isNew ? (
                'ชุดใหม่'
              ) : (
                'บันทึกล่าสุดแล้ว'
              )}
            </span>
            <span className="hidden items-center gap-1 text-xs text-zinc-400 lg:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>S</Kbd>
            </span>
            <Button
              onClick={save}
              loading={saving}
              disabled={!dirty && (!isNew || createdIdRef.current !== null)}
              icon={<Save className="h-4 w-4" />}
            >
              {isNew && createdIdRef.current === null ? 'สร้างชุด' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </div>

      {isTheory ? (
        <TheoryBuilder form={draft} onChange={patch} showErrors={showErrors} attemptCount={data.attemptCount} />
      ) : (
        <>
          {data.scoreCount > 0 && (
            <Callout
              tone="amber"
              icon={<TriangleAlert className="h-4 w-4" />}
              title={`มีการให้คะแนนด้วยแบบประเมินนี้แล้ว ${data.scoreCount} ใบ`}
              className="mb-5"
            >
              คะแนนที่ให้ไปแล้วอ้างอิงเกณฑ์และคะแนนเต็มเดิม หากเพิ่ม ลบ หรือเปลี่ยนคะแนนเต็มของข้อย่อย ผู้ประเมินควรตรวจและส่งคะแนนใหม่
              เพื่อให้เทียบกันได้ — ระบบรวมผลจะใช้คะแนนเต็มตามที่ผู้ประเมินให้ไว้ ณ ตอนส่ง
            </Callout>
          )}
          <PracticalBuilder form={draft} onChange={patch} showErrors={showErrors} />
        </>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ExamBuilderPage />
    </Suspense>
  );
}
