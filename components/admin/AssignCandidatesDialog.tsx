'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { applications } from '@/lib/api';
import { errorMessage, formatCitizenId, fullName } from '@/lib/format';
import type { PracticalRound, TrainingApplication, User } from '@/lib/types';
import { Avatar, Badge, Button, Checkbox, Dialog, EmptyState, SearchInput } from '@/components/ui';

/** Pick which approved candidates sit a given practical round. */
export default function AssignCandidatesDialog({
  open,
  onClose,
  round,
  rounds,
  apps,
  userMap,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  round: PracticalRound | null;
  rounds: PracticalRound[];
  apps: TrainingApplication[];
  userMap: Map<number, User>;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  const eligible = useMemo(
    () => apps.filter((a) => a.status === 'อนุมัติ' && !['submitted', 'approved'].includes(a.approval_status)),
    [apps]
  );

  useEffect(() => {
    if (!open || !round) return;
    setQ('');
    setSelected(new Set(eligible.filter((a) => a.practical_round_id === round.id).map((a) => a.id)));
  }, [open, round, eligible]);

  const roundName = (id?: number | null) => rounds.find((r) => r.id === id)?.name;

  const visible = eligible.filter((a) => {
    const u = userMap.get(a.user_id);
    const t = q.trim().toLowerCase();
    return !t || [u && fullName(u), u?.th_human_number].some((s) => String(s || '').toLowerCase().includes(t));
  });

  const save = async () => {
    if (!round) return;
    const before = new Set(eligible.filter((a) => a.practical_round_id === round.id).map((a) => a.id));
    const add = Array.from(selected).filter((id) => !before.has(id));
    const remove = Array.from(before).filter((id) => !selected.has(id));
    setSaving(true);
    try {
      if (add.length) await applications.assignRound(add, round.id);
      if (remove.length) await applications.assignRound(remove, null);
      toast.success(`จัดผู้สอบเข้ารอบแล้ว ${selected.size} คน`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const allOn = visible.length > 0 && visible.every((a) => selected.has(a.id));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`จัดผู้สอบเข้า${round?.name ? ` “${round.name}”` : 'รอบ'}`}
      description="แสดงเฉพาะผู้ที่ได้รับอนุมัติสิทธิ์สอบ และยังไม่ได้ส่งผลให้ผู้อำนวยการ"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={save} loading={saving}>
            บันทึก ({selected.size} คน)
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <EmptyState compact title="ยังไม่มีผู้มีสิทธิ์สอบ" description="อนุมัติสิทธิ์สอบให้ผู้สมัครในแท็บ “ผู้สมัคร” ก่อน" />
      ) : (
        <div className="space-y-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            <Checkbox
              checked={allOn}
              indeterminate={!allOn && visible.some((a) => selected.has(a.id))}
              onChange={(v) =>
                setSelected((p) => {
                  const n = new Set(p);
                  visible.forEach((a) => (v ? n.add(a.id) : n.delete(a.id)));
                  return n;
                })
              }
              label="เลือกทั้งหมด"
            />
            <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อ / เลขบัตร" className="w-56" />
          </div>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {visible.map((a) => {
              const u = userMap.get(a.user_id);
              const other = a.practical_round_id && a.practical_round_id !== round?.id ? roundName(a.practical_round_id) : null;
              const on = selected.has(a.id);
              const set = (v: boolean) =>
                setSelected((p) => {
                  const n = new Set(p);
                  if (v) n.add(a.id);
                  else n.delete(a.id);
                  return n;
                });
              return (
                <li key={a.id}>
                  <div onClick={() => set(!on)} className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 hover:bg-zinc-50">
                    <Checkbox checked={on} onChange={set} />
                    <Avatar name={u?.first_name_th || '?'} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">{u ? fullName(u) : `#${a.user_id}`}</span>
                      <span className="block truncate text-xs text-zinc-500 tabular">{formatCitizenId(u?.th_human_number)}</span>
                    </span>
                    {other && <Badge tone="amber">{on ? `ย้ายจาก ${other}` : `อยู่ใน ${other}`}</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Dialog>
  );
}
