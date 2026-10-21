'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ClipboardCheck,
  Clock,
  Info,
  ListTree,
  MapPin,
  Pencil,
  Plus,
  Target,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { forms, rounds as roundsApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage, fullName, num, thaiDate } from '@/lib/format';
import { leafItems, REQUIRED_EVALUATORS } from '@/lib/scoring';
import type { PracticalRound, TestForm } from '@/lib/types';
import { Avatar, Badge, Button, ButtonLink, Callout, Card, EmptyState, Progress, useConfirm } from '@/components/ui';
import RoundDialog from '@/components/admin/RoundDialog';
import AssignCandidatesDialog from '@/components/admin/AssignCandidatesDialog';
import type { HubData } from './types';

export default function PracticalTab({ data, reload }: { data: HubData; reload: () => void }) {
  const confirm = useConfirm();
  const [roundDialog, setRoundDialog] = useState<{ open: boolean; round: PracticalRound | null }>({ open: false, round: null });
  const [assign, setAssign] = useState<PracticalRound | null>(null);

  const practical = data.forms.filter((f) => f.exam_type === 'practical');
  const newHref = `/admin/exams/new?course=${data.course.id}&type=practical`;

  const removeForm = async (f: TestForm) => {
    const usedBy = data.rounds.filter((r) => r.test_form_id === f.id);
    const ok = await confirm({
      title: `ลบ “${f.title}”?`,
      description: usedBy.length
        ? `แบบประเมินนี้ถูกใช้ใน ${usedBy.length} รอบสอบ (${usedBy.map((r) => r.name).join(', ')}) — รอบสอบและคะแนนที่บันทึกไว้จะถูกลบไปด้วย`
        : 'เกณฑ์การประเมินทั้งหมดในแบบนี้จะถูกลบถาวร',
      confirmLabel: 'ลบแบบประเมิน',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await forms.remove(f.id);
      toast.success('ลบแบบประเมินแล้ว');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const removeRound = async (r: PracticalRound) => {
    const n = data.apps.filter((a) => a.practical_round_id === r.id).length;
    const ok = await confirm({
      title: `ลบ “${r.name}”?`,
      description: `ผู้สอบ ${n} คนจะถูกนำออกจากรอบ และคะแนนที่ผู้ประเมินบันทึกในรอบนี้จะถูกลบ`,
      confirmLabel: 'ลบรอบสอบ',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await roundsApi.remove(r.id);
      toast.success('ลบรอบสอบแล้ว');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const unassigned = data.apps.filter(
    (a) => a.status === 'อนุมัติ' && !a.practical_round_id && !['submitted', 'approved'].includes(a.approval_status)
  ).length;

  return (
    <div className="space-y-8">
      {/* ---------- Criteria forms ---------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">แบบประเมินภาคปฏิบัติ</h2>
            <p className="text-[0.8125rem] text-zinc-500">เกณฑ์การให้คะแนนแบบลำดับชั้นสูงสุด 4 ระดับ ผู้ประเมินให้คะแนนที่หัวข้อย่อยสุด</p>
          </div>
          <ButtonLink href={newHref} variant={practical.length ? 'outline' : 'primary'} icon={<Plus className="h-4 w-4" />}>
            สร้างแบบประเมิน
          </ButtonLink>
        </div>

        {practical.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={<ListTree className="h-5 w-5" />}
              title="ยังไม่มีแบบประเมินภาคปฏิบัติ"
              description="สร้างเกณฑ์การประเมินก่อน แล้วจึงสร้างรอบสอบและกำหนดผู้ประเมิน"
              action={
                <ButtonLink href={newHref} icon={<Plus className="h-4 w-4" />}>
                  สร้างแบบประเมิน
                </ButtonLink>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {practical.map((f) => (
              <Card key={f.id} className="flex items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <Link href={`/admin/exams/${f.id}`} className="group min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-900 group-hover:text-brand-700">{f.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[0.8125rem] text-zinc-500">
                    <span>{leafItems(f.practical_items).length} รายการให้คะแนน</span>
                    <span>เต็ม {num(f.total_score)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3" /> ผ่าน {f.passing_percentage}%
                    </span>
                    {!f.is_active && <Badge>ปิดอยู่</Badge>}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <ButtonLink href={`/admin/exams/${f.id}`} variant="ghost" size="icon-sm" aria-label="แก้ไข" title="แก้ไข">
                    <Pencil className="h-4 w-4" />
                  </ButtonLink>
                  <Button variant="ghost" size="icon-sm" aria-label="ลบ" title="ลบ" className="hover:text-brand-700" onClick={() => removeForm(f)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Rounds ---------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">รอบสอบและผู้ประเมิน</h2>
            <p className="text-[0.8125rem] text-zinc-500">
              แต่ละรอบมีผู้ประเมิน {REQUIRED_EVALUATORS} ท่าน — คะแนนปฏิบัติ = ผลรวมคะแนนจากผู้ประเมิน ÷ จำนวนผู้ประเมิน
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            disabled={practical.length === 0}
            onClick={() => setRoundDialog({ open: true, round: null })}
          >
            สร้างรอบสอบ
          </Button>
        </div>

        {unassigned > 0 && data.rounds.length > 0 && (
          <Callout tone="amber" icon={<Info className="h-4 w-4" />}>
            มีผู้มีสิทธิ์สอบ {unassigned} คนที่ยังไม่ได้จัดเข้ารอบสอบปฏิบัติ
          </Callout>
        )}

        {data.rounds.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={<CalendarDays className="h-5 w-5" />}
              title="ยังไม่มีรอบสอบปฏิบัติ"
              description={practical.length ? 'สร้างรอบสอบ กำหนดวัน สถานที่ และผู้ประเมิน 3 ท่าน' : 'ต้องมีแบบประเมินภาคปฏิบัติก่อน'}
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.rounds.map((r) => {
              const form = data.forms.find((f) => f.id === r.test_form_id);
              const cands = data.apps.filter((a) => a.practical_round_id === r.id);
              const roundScores = data.scores.filter((s) => s.round_id === r.id && cands.some((c) => c.id === s.application_id));
              const totalNeeded = cands.length * r.evaluator_ids.length;
              const totalDone = roundScores.filter((s) => s.status === 'submitted').length;
              return (
                <Card key={r.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[0.9375rem] font-semibold">{r.name}</h3>
                        <Badge tone={r.status === 'open' ? 'green' : 'neutral'} dot>
                          {r.status === 'open' ? 'เปิดประเมิน' : 'ปิดรอบ'}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {r.exam_date ? thaiDate(r.exam_date) : 'ยังไม่กำหนดวัน'}
                        </span>
                        {r.start_time && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {r.start_time} น.
                          </span>
                        )}
                        {r.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {r.location}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[0.8125rem] text-zinc-500">แบบประเมิน: {form?.title || '—'}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label="แก้ไขรอบ" title="แก้ไขรอบ" onClick={() => setRoundDialog({ open: true, round: r })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="ลบรอบ" title="ลบรอบ" className="hover:text-brand-700" onClick={() => removeRound(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 p-5">
                    <div className="flex items-center justify-between text-[0.8125rem]">
                      <span className="text-zinc-500">ความคืบหน้าการให้คะแนน</span>
                      <span className="font-medium text-zinc-900 tabular">
                        {totalDone}/{totalNeeded || 0}
                      </span>
                    </div>
                    {Array.from({ length: REQUIRED_EVALUATORS }).map((_, i) => {
                      const evId = r.evaluator_ids[i];
                      const ev = evId ? data.staff.find((s) => s.id === evId) || data.userMap.get(evId) : undefined;
                      if (!evId) {
                        return (
                          <button
                            key={i}
                            onClick={() => setRoundDialog({ open: true, round: r })}
                            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5 text-left text-[0.8125rem] text-amber-800 transition hover:bg-amber-50"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-amber-400">
                              <UserPlus className="h-3.5 w-3.5" />
                            </span>
                            กำหนดผู้ประเมินคนที่ {i + 1}
                          </button>
                        );
                      }
                      const done = roundScores.filter((s) => s.evaluator_id === evId && s.status === 'submitted').length;
                      const draft = roundScores.filter((s) => s.evaluator_id === evId && s.status === 'draft').length;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <Avatar name={ev?.first_name_th || '?'} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 text-[0.8125rem]">
                              <span className="truncate font-medium text-zinc-800">{ev ? fullName(ev) : `ผู้ใช้ #${evId}`}</span>
                              <span className={cn('shrink-0 tabular', done === cands.length && cands.length > 0 ? 'text-emerald-700' : 'text-zinc-500')}>
                                {done}/{cands.length}
                                {draft > 0 && <span className="text-zinc-400"> · ร่าง {draft}</span>}
                              </span>
                            </div>
                            <Progress className="mt-1.5" value={done} max={cands.length || 1} tone={done === cands.length && cands.length > 0 ? 'green' : 'red'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-zinc-600 tabular">
                      <Users className="h-3.5 w-3.5 text-zinc-400" /> ผู้สอบ {cands.length} คน
                    </span>
                    <Button size="sm" variant="outline" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAssign(r)}>
                      จัดผู้สอบเข้ารอบ
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <RoundDialog
        open={roundDialog.open}
        round={roundDialog.round}
        onClose={() => setRoundDialog({ open: false, round: null })}
        trainingId={data.course.id}
        practicalForms={practical}
        staff={data.staff}
        defaultLocation={data.course.location}
        existingCount={data.rounds.length}
        onSaved={() => reload()}
      />
      <AssignCandidatesDialog
        open={!!assign}
        round={assign}
        rounds={data.rounds}
        apps={data.apps}
        userMap={data.userMap}
        onClose={() => setAssign(null)}
        onSaved={reload}
      />
    </div>
  );
}
