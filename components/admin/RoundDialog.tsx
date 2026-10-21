'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { rounds, users } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage, fullName, ROLE_LABEL, toDateInput } from '@/lib/format';
import { REQUIRED_EVALUATORS } from '@/lib/scoring';
import type { PracticalRound, TestForm, User } from '@/lib/types';
import { Avatar, Badge, Button, Callout, Dialog, Field, Input, SearchInput, Segmented, Select } from '@/components/ui';

interface Draft {
  name: string;
  test_form_id: number | '';
  exam_date: string;
  start_time: string;
  location: string;
  evaluator_ids: number[];
  status: 'open' | 'closed';
}

export default function RoundDialog({
  open,
  onClose,
  round,
  trainingId,
  practicalForms,
  staff,
  defaultLocation,
  existingCount,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  round?: PracticalRound | null;
  trainingId: number;
  practicalForms: TestForm[];
  staff: User[];
  defaultLocation?: string;
  existingCount: number;
  onSaved: (r: PracticalRound) => void;
}) {
  const [d, setD] = useState<Draft>({
    name: '',
    test_form_id: '',
    exam_date: '',
    start_time: '09:00',
    location: '',
    evaluator_ids: [],
    status: 'open',
  });
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);
  // Evaluators already on the round who are no longer in the active staff list (disabled / demoted).
  const [extra, setExtra] = useState<User[]>([]);

  useEffect(() => {
    if (!open || !round) {
      setExtra([]);
      return;
    }
    const missing = (round.evaluator_ids || []).filter((id) => !staff.some((s) => s.id === id));
    if (missing.length === 0) {
      setExtra([]);
      return;
    }
    let alive = true;
    users
      .byIds(missing)
      .then((list) => alive && setExtra(list))
      .catch(() => alive && setExtra([]));
    return () => {
      alive = false;
    };
  }, [open, round, staff]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setD(
      round
        ? {
            name: round.name,
            test_form_id: round.test_form_id,
            exam_date: toDateInput(round.exam_date),
            start_time: round.start_time || '09:00',
            location: round.location || '',
            evaluator_ids: round.evaluator_ids || [],
            status: round.status,
          }
        : {
            name: `รอบที่ ${existingCount + 1}`,
            test_form_id: practicalForms.find((f) => f.is_active)?.id ?? practicalForms[0]?.id ?? '',
            exam_date: '',
            start_time: '09:00',
            location: defaultLocation || '',
            evaluator_ids: [],
            status: 'open',
          }
    );
  }, [open, round, practicalForms, defaultLocation, existingCount]);

  const filteredStaff = useMemo(() => {
    const t = q.trim().toLowerCase();
    return staff.filter(
      (u) => u.is_allowed !== 0 && (!t || [fullName(u), u.email, u.position_title].some((s) => String(s || '').toLowerCase().includes(t)))
    );
  }, [staff, q]);

  const toggle = (id: number) => {
    setD((p) => {
      if (p.evaluator_ids.includes(id)) return { ...p, evaluator_ids: p.evaluator_ids.filter((x) => x !== id) };
      if (p.evaluator_ids.length >= REQUIRED_EVALUATORS) {
        toast.error(`เลือกผู้ประเมินได้สูงสุด ${REQUIRED_EVALUATORS} ท่านต่อรอบ`);
        return p;
      }
      return { ...p, evaluator_ids: [...p.evaluator_ids, id] };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) return toast.error('กรุณาตั้งชื่อรอบสอบ');
    if (!d.test_form_id) return toast.error('กรุณาเลือกแบบประเมินภาคปฏิบัติ');
    setSaving(true);
    try {
      const saved = await rounds.save({
        id: round?.id,
        training_id: trainingId,
        test_form_id: Number(d.test_form_id),
        name: d.name,
        exam_date: d.exam_date || null,
        start_time: d.start_time,
        location: d.location,
        evaluator_ids: d.evaluator_ids,
        status: d.status,
      });
      toast.success(round ? 'บันทึกรอบสอบแล้ว' : 'สร้างรอบสอบแล้ว');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const lookup = (id: number) => staff.find((s) => s.id === id) || extra.find((s) => s.id === id) || null;
  const inactiveReason = (u: User | null) =>
    !u ? 'ไม่พบบัญชี' : u.is_allowed === 0 ? 'ระงับแล้ว' : u.role === 'user' ? 'ไม่ใช่เจ้าหน้าที่แล้ว' : null;
  const remove = (id: number) => setD((p) => ({ ...p, evaluator_ids: p.evaluator_ids.filter((x) => x !== id) }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={round ? 'แก้ไขรอบสอบปฏิบัติ' : 'สร้างรอบสอบปฏิบัติ'}
      description="กำหนดวัน สถานที่ และผู้ประเมิน 3 ท่าน — คะแนนปฏิบัติของผู้สอบคือค่าเฉลี่ยของคะแนนจากผู้ประเมินทุกท่าน"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="round-form" loading={saving}>
            {round ? 'บันทึก' : 'สร้างรอบสอบ'}
          </Button>
        </>
      }
    >
      <form id="round-form" onSubmit={submit} className="space-y-5 pb-2">
        {practicalForms.length === 0 && (
          <Callout tone="amber" icon={<Info className="h-4 w-4" />}>
            หลักสูตรนี้ยังไม่มีแบบประเมินภาคปฏิบัติ กรุณาสร้างแบบประเมินก่อนสร้างรอบสอบ
          </Callout>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อรอบสอบ" required>
            {(id) => <Input id={id} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />}
          </Field>
          <Field label="แบบประเมินที่ใช้" required>
            {(id) => (
              <Select
                id={id}
                value={d.test_form_id === '' ? '' : String(d.test_form_id)}
                placeholder="เลือกแบบประเมิน"
                onChange={(e) => setD({ ...d, test_form_id: Number(e.target.value) })}
              >
                {practicalForms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                    {f.is_active ? '' : ' (ปิดใช้งาน)'}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="วันสอบ">
            {(id) => <Input id={id} type="date" value={d.exam_date} onChange={(e) => setD({ ...d, exam_date: e.target.value })} />}
          </Field>
          <Field label="เวลาเริ่ม">
            {(id) => <Input id={id} type="time" value={d.start_time} onChange={(e) => setD({ ...d, start_time: e.target.value })} />}
          </Field>
          <Field label="สถานที่สอบ" className="sm:col-span-2">
            {(id) => (
              <Input id={id} value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} placeholder="เช่น โรงฝึกงาน อาคาร 2" />
            )}
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[0.8125rem] font-medium text-zinc-800">ผู้ประเมิน</div>
              <div className="text-[0.8125rem] text-zinc-500">เลือกจากเจ้าหน้าที่ ผู้อำนวยการ หรือผู้ประเมินในระบบ</div>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold tabular',
                d.evaluator_ids.length === REQUIRED_EVALUATORS ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              )}
            >
              เลือกแล้ว {d.evaluator_ids.length}/{REQUIRED_EVALUATORS}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: REQUIRED_EVALUATORS }).map((_, i) => {
              const id = d.evaluator_ids[i];
              const u = id !== undefined ? lookup(id) : null;
              const reason = id !== undefined ? inactiveReason(u) : null;
              return (
                <div
                  key={i}
                  className={cn(
                    'relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center',
                    id === undefined
                      ? 'border-dashed border-zinc-300 bg-zinc-50/60'
                      : reason
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-zinc-200 bg-surface'
                  )}
                >
                  {id !== undefined ? (
                    <>
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        className="absolute right-1 top-1 rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-brand-700"
                        aria-label={`นำผู้ประเมินคนที่ ${i + 1} ออก`}
                        title="นำออก"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <Avatar name={u?.first_name_th || '?'} size="sm" />
                      <span className="w-full truncate text-xs font-medium text-zinc-800">{u ? u.first_name_th : `#${id}`}</span>
                      {reason && <Badge tone="amber">{reason}</Badge>}
                    </>
                  ) : (
                    <span className="text-xs text-zinc-400">ผู้ประเมินคนที่ {i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {d.evaluator_ids.length > 0 && d.evaluator_ids.length < REQUIRED_EVALUATORS && (
            <Callout tone="amber" icon={<Info className="h-4 w-4" />}>
              ตอนนี้มีผู้ประเมิน {d.evaluator_ids.length} ท่าน คะแนนปฏิบัติจะเฉลี่ยจาก {d.evaluator_ids.length} ท่านนี้ — แนะนำให้กำหนดครบ 3 ท่าน
            </Callout>
          )}

          <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อ อีเมล ตำแหน่ง" />
          <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200">
            {filteredStaff.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                {staff.length === 0 ? 'ยังไม่มีบัญชีผู้ประเมิน — เพิ่มได้ที่เมนู “สมาชิกและสิทธิ์”' : 'ไม่พบรายชื่อ'}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {filteredStaff.map((u) => {
                  const on = d.evaluator_ids.includes(u.id);
                  const order = d.evaluator_ids.indexOf(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => toggle(u.id)}
                        className={cn('flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition', on ? 'bg-brand-50/50' : 'hover:bg-zinc-50')}
                      >
                        <Avatar name={u.first_name_th} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-900">{fullName(u)}</span>
                          <span className="block truncate text-xs text-zinc-500">
                            {u.position_title || ROLE_LABEL[u.role]}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                            on ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-300 text-transparent'
                          )}
                        >
                          {on ? order + 1 : <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <Field label="สถานะรอบ">
          {() => (
            <Segmented<'open' | 'closed'>
              value={d.status}
              onChange={(v) => setD({ ...d, status: v })}
              options={[
                { value: 'open', label: 'เปิดให้ประเมิน' },
                { value: 'closed', label: 'ปิดรอบแล้ว' },
              ]}
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
