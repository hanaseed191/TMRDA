'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarDays, Check, CircleDot, Lock, MapPin, PenLine, Send, ShieldOff, Users } from 'lucide-react';
import { applications, courses, forms, rounds, scores, users } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useDebouncedCallback, useLoad, useUnsavedWarning } from '@/lib/hooks';
import { errorMessage, formatCitizenId, fullName, num, thaiDate } from '@/lib/format';
import { isLeaf, itemEarned, itemMax, leafItems, missingLeaves, pct, round2, treeEarned, treeMax } from '@/lib/scoring';
import { PRACTICAL_LEVELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { PracticalItem, PracticalScore, TrainingApplication, User } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  Kbd,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
  useConfirm,
} from '@/components/ui';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

async function loadRound(roundId: number) {
  const round = await rounds.get(roundId);
  const [course, form, apps, roundScores] = await Promise.all([
    courses.get(round.training_id),
    forms.get(round.test_form_id),
    applications.list({ trainingId: round.training_id }),
    scores.list({ roundIds: [round.id] }),
  ]);
  const candidates = apps.filter((a) => a.practical_round_id === round.id && a.status === 'อนุมัติ');
  const people = await users.byIds(Array.from(new Set([...candidates.map((a) => a.user_id), ...round.evaluator_ids])));
  return { round, course, form, candidates, roundScores, people };
}

function sheetStatus(s: PracticalScore | undefined) {
  if (!s) return { label: 'ยังไม่ประเมิน', tone: 'text-zinc-400', dot: 'bg-zinc-300' };
  if (s.status === 'submitted') return { label: 'ส่งแล้ว', tone: 'text-emerald-700', dot: 'bg-emerald-500' };
  return { label: 'ร่าง', tone: 'text-amber-700', dot: 'bg-amber-500' };
}

export default function EvaluateRoundPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = Number(params.roundId);
  const me = useUser();
  const confirm = useConfirm();
  const { data, loading, error, setData } = useLoad(() => loadRound(roundId), [roundId]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useUnsavedWarning(dirty);

  const userById = useMemo(() => new Map((data?.people || []).map((u) => [u.id, u])), [data]);
  const myScores = useMemo(() => {
    const m = new Map<number, PracticalScore>();
    for (const s of data?.roundScores || []) if (s.evaluator_id === me.id) m.set(s.application_id, s);
    return m;
  }, [data, me.id]);

  const items = useMemo(() => data?.form.practical_items || [], [data]);
  const leaves = useMemo(() => leafItems(items), [items]);
  const max = useMemo(() => treeMax(items), [items]);

  const candidates = useMemo(() => {
    const list = (data?.candidates || []).map((a) => ({ app: a, user: userById.get(a.user_id) || null }));
    list.sort((a, b) => (a.user?.first_name_th || '').localeCompare(b.user?.first_name_th || '', 'th'));
    return list;
  }, [data, userById]);

  const filtered = candidates.filter(({ user }) => {
    const q = query.trim().toLowerCase();
    return !q || `${fullName(user)} ${user?.th_human_number || ''}`.toLowerCase().includes(q);
  });

  // pick the first candidate that still needs my score
  useEffect(() => {
    if (selectedId !== null || candidates.length === 0) return;
    const next = candidates.find((c) => myScores.get(c.app.id)?.status !== 'submitted') || candidates[0];
    setSelectedId(next.app.id);
  }, [candidates, myScores, selectedId]);

  const selected = candidates.find((c) => c.app.id === selectedId) || null;
  const current = selected ? myScores.get(selected.app.id) : undefined;

  // load the selected sheet into the editor
  useEffect(() => {
    if (!selected) return;
    const s = myScores.get(selected.app.id);
    const init: Record<string, string> = {};
    for (const [k, v] of Object.entries(s?.item_scores || {})) init[k] = String(v);
    setInputs(init);
    setComment(s?.comment || '');
    setDirty(false);
    setSaveState(s ? 'saved' : 'idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.app.id]);

  /** Parsed leaf scores, clamped to 0..max — the only values ever persisted. */
  const toNumeric = useCallback(
    (raw: Record<string, string>) => {
      const out: Record<string, number> = {};
      for (const leaf of leaves) {
        const v = raw[String(leaf.id)];
        if (v === undefined || v.trim() === '') continue;
        const n = Number(v);
        if (Number.isFinite(n)) out[String(leaf.id)] = Math.min(itemMax(leaf), Math.max(0, n));
      }
      return out;
    },
    [leaves]
  );
  const numeric = useMemo(() => toNumeric(inputs), [inputs, toNumeric]);

  const total = treeEarned(items, numeric);
  const scoredCount = leaves.filter((l) => numeric[String(l.id)] !== undefined).length;

  const appLocked = (a?: TrainingApplication) => !!a && !['none', 'rejected'].includes(a.approval_status || 'none');
  const roundClosed = data?.round.status === 'closed';
  const readOnly = !selected || current?.status === 'submitted' || appLocked(selected.app) || roundClosed;
  const canReopen =
    !!selected && current?.status === 'submitted' && !appLocked(selected.app) && !roundClosed;

  const upsertLocal = useCallback(
    (s: PracticalScore) =>
      setData((d) =>
        d
          ? {
              ...d,
              roundScores: [
                ...d.roundScores.filter((x) => !(x.application_id === s.application_id && x.evaluator_id === s.evaluator_id)),
                s,
              ],
            }
          : d
      ),
    [setData]
  );

  // Writes are serialised (a later write can never land before an earlier one) and only the
  // latest write per candidate may update local state, so a slow draft can't undo a submit.
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const writeSeqRef = useRef<Map<number, number>>(new Map());

  const persist = useCallback(
    (appId: number, payload: { itemScores: Record<string, number>; comment: string }, status: 'draft' | 'submitted') => {
      const seq = (writeSeqRef.current.get(appId) || 0) + 1;
      writeSeqRef.current.set(appId, seq);
      const isLatest = () => writeSeqRef.current.get(appId) === seq;
      const run = async () => {
        setSaveState('saving');
        try {
          const saved = await scores.save({
            round_id: roundId,
            application_id: appId,
            evaluator_id: me.id,
            item_scores: payload.itemScores,
            total: treeEarned(items, payload.itemScores),
            max_total: max,
            comment: payload.comment,
            status,
          });
          if (isLatest()) {
            upsertLocal(saved);
            setSaveState('saved');
          }
          return saved;
        } catch (e) {
          if (isLatest()) setSaveState('error');
          throw e;
        }
      };
      const p = queueRef.current.then(run, run);
      queueRef.current = p.catch(() => undefined);
      return p;
    },
    [roundId, me.id, items, max, upsertLocal]
  );

  /** bumps on every edit — an autosave may only clear `dirty` if nothing changed since it was scheduled */
  const editSeqRef = useRef(0);

  /** applications whose sheet is being submitted — pending autosaves must skip them */
  const lockedRef = useRef<Set<number>>(new Set());
  const myScoresRef = useRef(myScores);
  myScoresRef.current = myScores;

  const autosave = useDebouncedCallback((appId: number, itemScores: Record<string, number>, c: string, editSeq: number) => {
    // never downgrade a sheet that is being / has been submitted
    if (lockedRef.current.has(appId) || myScoresRef.current.get(appId)?.status === 'submitted') return;
    persist(appId, { itemScores, comment: c }, 'draft')
      .then(() => {
        if (editSeqRef.current === editSeq) setDirty(false);
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, 900);

  const clampValue = (leaf: PracticalItem, raw: string) => {
    if (raw.trim() === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    return String(Math.min(itemMax(leaf), Math.max(0, n)));
  };

  const setLeaf = (leaf: PracticalItem, raw: string) => {
    if (readOnly || !selected) return;
    const next = { ...inputs, [String(leaf.id)]: raw };
    setInputs(next);
    setDirty(true);
    autosave(selected.app.id, toNumeric(next), comment, ++editSeqRef.current);
  };

  const onComment = (v: string) => {
    if (readOnly || !selected) return;
    setComment(v);
    setDirty(true);
    autosave(selected.app.id, numeric, v, ++editSeqRef.current);
  };

  const flushAndSelect = async (appId: number) => {
    if (appId === selectedId) return;
    if (dirty && selected && !readOnly) {
      try {
        await persist(selected.app.id, { itemScores: numeric, comment }, 'draft');
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }
    setSelectedId(appId);
  };

  const focusLeaf = (index: number) => {
    const leaf = leaves[index];
    if (!leaf) return;
    const el = inputRefs.current.get(String(leaf.id));
    el?.focus();
    el?.select();
  };

  const submit = async () => {
    if (!selected) return;
    const missing = missingLeaves(items, numeric);
    if (missing.length > 0) {
      toast.error(`ยังให้คะแนนไม่ครบ ${missing.length} รายการ`);
      const el = inputRefs.current.get(String(missing[0].id));
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.focus(), 250);
      return;
    }
    const appId = selected.app.id;
    // Lock first: a debounced draft firing while the dialog is open is skipped (it would race the submit).
    lockedRef.current.add(appId);
    const ok = await confirm({
      title: `ส่งคะแนน ${fullName(selected.user)}?`,
      description: (
        <>
          คะแนนรวม <b className="tabular text-zinc-900">{num(total)}</b> / {num(max)} ({num(pct(total, max))}%)
          <br />
          หลังส่งแล้วยังแก้ไขได้จนกว่าเจ้าหน้าที่จะส่งผลให้ผู้อำนวยการ
        </>
      ),
      confirmLabel: 'ส่งคะแนน',
      tone: 'primary',
    });
    if (!ok) {
      lockedRef.current.delete(appId);
      // re-queue any edit whose autosave was skipped while the dialog was open
      if (dirty) autosave(appId, numeric, comment, editSeqRef.current);
      return;
    }
    setSubmitting(true);
    try {
      // persist() is serialised behind any in-flight draft write, so 'submitted' always lands last
      await persist(appId, { itemScores: numeric, comment }, 'submitted');
      setDirty(false);
      toast.success('ส่งคะแนนแล้ว');
      const idx = candidates.findIndex((c) => c.app.id === selected.app.id);
      const next =
        candidates.slice(idx + 1).find((c) => myScores.get(c.app.id)?.status !== 'submitted') ||
        candidates.slice(0, idx).find((c) => myScores.get(c.app.id)?.status !== 'submitted');
      if (next) setSelectedId(next.app.id);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      lockedRef.current.delete(appId);
      setSubmitting(false);
    }
  };

  const reopen = async () => {
    if (!selected || !current) return;
    try {
      await persist(selected.app.id, { itemScores: current.item_scores, comment: current.comment || '' }, 'draft');
      toast.success('เปิดแก้ไขคะแนนแล้ว อย่าลืมกดส่งอีกครั้ง');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  if (error || !data) {
    return <Callout tone="red" title="โหลดรอบสอบไม่สำเร็จ">{error}</Callout>;
  }
  if (!data.round.evaluator_ids.includes(me.id)) {
    return (
      <Card>
        <EmptyState
          icon={<ShieldOff className="h-5 w-5" />}
          title="คุณไม่ได้เป็นผู้ประเมินในรอบนี้"
          description="เฉพาะผู้ประเมินที่ได้รับมอบหมายเท่านั้นที่ให้คะแนนได้ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อเจ้าหน้าที่"
          action={<ButtonLink href="/evaluate" variant="outline">กลับไปงานประเมิน</ButtonLink>}
        />
      </Card>
    );
  }

  const evaluatorProgress = data.round.evaluator_ids.map((id, i) => ({
    index: i + 1,
    user: userById.get(id),
    isMe: id === me.id,
    submitted: data.roundScores.filter(
      (s) => s.evaluator_id === id && s.status === 'submitted' && candidates.some((c) => c.app.id === s.application_id)
    ).length,
  }));

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'งานประเมิน', href: '/evaluate' }, { label: data.round.name }]}
        eyebrow={data.course.course_name}
        title={data.round.name}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{data.form.title}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-zinc-400" />
              {thaiDate(data.round.exam_date)} {data.round.start_time && `· ${data.round.start_time} น.`}
            </span>
            {data.round.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {data.round.location}
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-surface px-3 py-2">
            <Users className="h-4 w-4 text-zinc-400" />
            {evaluatorProgress.map((e) => (
              <span key={e.index} className="flex items-center gap-1.5 text-xs" title={e.user ? fullName(e.user) : undefined}>
                <Avatar name={e.user?.first_name_th || '?'} size="sm" className={e.isMe ? 'ring-brand-500' : ''} />
                <span className="tabular text-zinc-600">
                  {e.submitted}/{candidates.length}
                </span>
              </span>
            ))}
          </div>
        }
      />

      {roundClosed && (
        <Callout tone="neutral" icon={<Lock className="h-4 w-4" />} className="mb-5">
          รอบสอบนี้ปิดแล้ว ดูคะแนนได้อย่างเดียว
        </Callout>
      )}

      {candidates.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-5 w-5" />} title="ยังไม่มีผู้สอบในรอบนี้" description="เจ้าหน้าที่ยังไม่ได้จัดผู้มีสิทธิ์สอบเข้ารอบนี้" />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title="แบบประเมินยังไม่มีเกณฑ์" description="เจ้าหน้าที่ต้องกำหนดหัวข้อเกณฑ์ประเมินในแบบประเมินภาคปฏิบัติก่อน" />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Candidate list */}
          <Card className="overflow-hidden lg:sticky lg:top-24">
            <div className="hidden border-b border-zinc-100 p-3 lg:block">
              <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาผู้สอบ" />
            </div>
            <div className="p-3 lg:hidden">
              <Select value={selectedId ?? ''} onChange={(e) => flushAndSelect(Number(e.target.value))} aria-label="เลือกผู้สอบ">
                {candidates.map((c) => (
                  <option key={c.app.id} value={c.app.id}>
                    {fullName(c.user)} — {sheetStatus(myScores.get(c.app.id)).label}
                  </option>
                ))}
              </Select>
            </div>
            <ul className="hidden max-h-[calc(100dvh-14rem)] overflow-y-auto p-1.5 lg:block">
              {filtered.map((c, i) => {
                const s = myScores.get(c.app.id);
                const st = sheetStatus(s);
                const active = c.app.id === selectedId;
                return (
                  <li key={c.app.id}>
                    <button
                      onClick={() => flushAndSelect(c.app.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition',
                        active ? 'bg-zinc-950 text-zinc-50' : 'hover:bg-zinc-50'
                      )}
                    >
                      <span className={cn('w-5 shrink-0 text-center text-xs tabular', active ? 'text-zinc-400' : 'text-zinc-400')}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-sm font-medium', active ? 'text-white' : 'text-zinc-900')}>{fullName(c.user)}</span>
                        <span className={cn('flex items-center gap-1.5 text-xs', active ? 'text-zinc-400' : st.tone)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                          {st.label}
                        </span>
                      </span>
                      {s && (
                        <span className={cn('shrink-0 text-xs tabular', active ? 'text-zinc-300' : 'text-zinc-500')}>
                          {num(s.total)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-400">ไม่พบผู้สอบ</li>}
            </ul>
          </Card>

          {/* Scoring sheet */}
          {selected && (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={selected.user?.first_name_th || '?'} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-950">{fullName(selected.user)}</div>
                    <div className="text-xs text-zinc-500 tabular">{formatCitizenId(selected.user?.th_human_number)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {current?.status === 'submitted' ? (
                    <Badge tone="green" dot>ส่งคะแนนแล้ว</Badge>
                  ) : current ? (
                    <Badge tone="amber" dot>ร่าง</Badge>
                  ) : (
                    <Badge>ยังไม่ประเมิน</Badge>
                  )}
                  {appLocked(selected.app) && <Badge icon={<Lock className="h-3 w-3" />}>ส่งผลอนุมัติแล้ว</Badge>}
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                {!readOnly && (
                  <p className="hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex">
                    ใช้ <Kbd>↑</Kbd> <Kbd>↓</Kbd> เลื่อนระหว่างช่องคะแนน · ระบบบันทึกร่างอัตโนมัติ
                  </p>
                )}
                {items.map((item, i) => (
                  <CriteriaNode
                    key={item.id}
                    item={item}
                    level={1}
                    prefix={`${i + 1}`}
                    inputs={inputs}
                    numeric={numeric}
                    leaves={leaves}
                    readOnly={readOnly}
                    onChange={setLeaf}
                    onBlurClamp={(leaf) => {
                      const v = inputs[String(leaf.id)];
                      if (v !== undefined) {
                        const c = clampValue(leaf, v);
                        if (c !== v) setLeaf(leaf, c);
                      }
                    }}
                    registerRef={(id, el) => {
                      if (el) inputRefs.current.set(id, el);
                      else inputRefs.current.delete(id);
                    }}
                    onNav={(idx) => focusLeaf(idx)}
                  />
                ))}

                <div className="pt-2">
                  <label className="mb-1.5 block text-[0.8125rem] font-medium text-zinc-800">ความเห็นของผู้ประเมิน</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => onComment(e.target.value)}
                    disabled={readOnly}
                    placeholder="ข้อสังเกต จุดเด่น หรือสิ่งที่ควรปรับปรุง (ไม่บังคับ)"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-surface/95 px-5 py-3.5 backdrop-blur sm:px-6">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-zinc-500">คะแนนรวม</div>
                    <div className="font-display text-xl font-semibold tabular text-zinc-950">
                      {num(total)} <span className="text-sm font-normal text-zinc-400">/ {num(max)}</span>
                      <span className="ml-2 text-sm font-medium text-zinc-500">{num(pct(total, max))}%</span>
                    </div>
                  </div>
                  <div className="hidden text-xs text-zinc-500 sm:block">
                    ให้คะแนนแล้ว <span className="tabular">{scoredCount}/{leaves.length}</span> รายการ
                    <div className="mt-0.5">
                      {saveState === 'saving' ? (
                        <span className="text-zinc-400">กำลังบันทึก…</span>
                      ) : saveState === 'saved' && !dirty ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Check className="h-3 w-3" /> บันทึกแล้ว
                        </span>
                      ) : saveState === 'error' ? (
                        <span className="text-brand-600">บันทึกไม่สำเร็จ</span>
                      ) : dirty ? (
                        <span className="text-amber-600">มีการเปลี่ยนแปลง</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canReopen && (
                    <Button variant="outline" icon={<PenLine className="h-4 w-4" />} onClick={reopen}>
                      แก้ไขคะแนน
                    </Button>
                  )}
                  {!readOnly && (
                    <Button icon={<Send className="h-4 w-4" />} loading={submitting} onClick={submit}>
                      ส่งคะแนน
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------

function CriteriaNode({
  item,
  level,
  prefix,
  inputs,
  numeric,
  leaves,
  readOnly,
  onChange,
  onBlurClamp,
  registerRef,
  onNav,
}: {
  item: PracticalItem;
  level: number;
  prefix: string;
  inputs: Record<string, string>;
  numeric: Record<string, number>;
  leaves: PracticalItem[];
  readOnly: boolean;
  onChange: (leaf: PracticalItem, raw: string) => void;
  onBlurClamp: (leaf: PracticalItem) => void;
  registerRef: (id: string, el: HTMLInputElement | null) => void;
  onNav: (index: number) => void;
}) {
  const max = itemMax(item);
  const earned = itemEarned(item, numeric);

  if (isLeaf(item)) {
    const key = String(item.id);
    const idx = leaves.findIndex((l) => l.id === item.id);
    const v = inputs[key] ?? '';
    const n = Number(v);
    const invalid = v.trim() !== '' && (!Number.isFinite(n) || n < 0 || n > max);
    const filled = v.trim() !== '' && !invalid;
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl border px-4 py-3 transition sm:flex-row sm:items-center',
          filled ? 'border-zinc-200 bg-surface' : 'border-dashed border-zinc-300 bg-zinc-50/50',
          invalid && 'border-brand-300 bg-brand-50/40'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="mt-px shrink-0 text-xs font-semibold text-zinc-400 tabular">{prefix}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-900">{item.item_name}</div>
              {(item.criteria || item.description) && (
                <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.criteria || item.description}</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
          {!readOnly && (
            <div className="flex gap-1">
              {[
                { l: '0', v: 0 },
                { l: '½', v: round2(max / 2) },
                { l: 'เต็ม', v: max },
              ].map((q) => (
                <button
                  key={q.l}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onChange(item, String(q.v))}
                  className={cn(
                    'h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition',
                    filled && Number(v) === q.v ? 'bg-zinc-900 text-zinc-50' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {q.l}
                </button>
              ))}
            </div>
          )}
          <input
            ref={(el) => registerRef(key, el)}
            type="number"
            inputMode="decimal"
            min={0}
            max={max}
            step={0.5}
            value={v}
            disabled={readOnly}
            aria-invalid={invalid || undefined}
            aria-label={`คะแนน ${prefix} ${item.item_name}`}
            onChange={(e) => onChange(item, e.target.value)}
            onBlur={() => onBlurClamp(item)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                onNav(idx + 1);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onNav(idx - 1);
              }
            }}
            className="control h-10 w-20 text-center font-semibold tabular"
          />
          <span className="w-12 text-sm text-zinc-400 tabular">/ {num(max)}</span>
        </div>
      </div>
    );
  }

  const header =
    level === 1 ? (
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-brand-600 px-1.5 text-xs font-semibold text-white tabular">
            {prefix}
          </span>
          <div className="min-w-0">
            <div className="eyebrow">{PRACTICAL_LEVELS[0]}</div>
            <h3 className="truncate text-[0.9375rem] font-semibold">{item.item_name}</h3>
          </div>
        </div>
        <span className="shrink-0 text-sm tabular text-zinc-500">
          <b className="text-zinc-900">{num(earned)}</b> / {num(max)}
        </span>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <CircleDot className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-400 tabular">{prefix}</span>
          <span className="truncate text-sm font-semibold text-zinc-800">{item.item_name}</span>
        </div>
        <span className="shrink-0 text-xs tabular text-zinc-500">
          {num(earned)} / {num(max)}
        </span>
      </div>
    );

  return (
    <div className={cn(level === 1 ? 'rounded-2xl border border-zinc-200 bg-surface p-4' : 'space-y-2 border-l-2 border-zinc-100 pl-3 sm:pl-4')}>
      {header}
      <div className={cn('space-y-2', level === 1 && 'pt-3')}>
        {item.children!.map((c, i) => (
          <CriteriaNode
            key={c.id}
            item={c}
            level={level + 1}
            prefix={`${prefix}.${i + 1}`}
            inputs={inputs}
            numeric={numeric}
            leaves={leaves}
            readOnly={readOnly}
            onChange={onChange}
            onBlurClamp={onBlurClamp}
            registerRef={registerRef}
            onNav={onNav}
          />
        ))}
      </div>
    </div>
  );
}
