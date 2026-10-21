'use client';

import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Lock, Paperclip, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { applications } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage, formatCitizenId, fullName, num, relativeTime } from '@/lib/format';
import type { EnrollmentStatus, TrainingApplication } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  SearchInput,
  Segmented,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
  useConfirm,
} from '@/components/ui';
import { ApprovalBadge, EnrollmentBadge } from '@/components/status';
import ApplicantDrawer from '@/components/admin/ApplicantDrawer';
import { bestAttempt, type HubData } from './types';

type Filter = 'all' | EnrollmentStatus;

const isLocked = (a: TrainingApplication) => ['submitted', 'approved'].includes(a.approval_status);

export default function ApplicantsTab({ data, reload }: { data: HubData; reload: () => void }) {
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const { apps, userMap, attempts, rounds, course } = data;

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: apps.length, รอพิจารณา: 0, อนุมัติ: 0, ปฏิเสธ: 0 };
    apps.forEach((a) => c[a.status]++);
    return c;
  }, [apps]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return apps
      .filter((a) => filter === 'all' || a.status === filter)
      .filter((a) => {
        if (!t) return true;
        const u = userMap.get(a.user_id);
        return [u && fullName(u), u?.th_human_number, u?.email, u?.phone_number].some((s) => String(s || '').toLowerCase().includes(t));
      });
  }, [apps, filter, q, userMap]);

  const visibleIds = rows.filter((a) => !isLocked(a)).map((a) => a.id);
  const allOn = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someOn = visibleIds.some((id) => selected.has(id));
  const sel = Array.from(selected).filter((id) => apps.some((a) => a.id === id && !isLocked(a)));

  const setEnrollment = async (ids: number[], status: 'อนุมัติ' | 'ปฏิเสธ') => {
    if (!ids.length) return;
    if (status === 'อนุมัติ') {
      const approvedNow = apps.filter((a) => a.status === 'อนุมัติ').length;
      const adding = ids.filter((id) => apps.find((a) => a.id === id)?.status !== 'อนุมัติ').length;
      if (course.limit_course > 0 && approvedNow + adding > course.limit_course) {
        const ok = await confirm({
          title: 'เกินจำนวนที่รับ',
          description: `หลักสูตรนี้รับ ${course.limit_course} คน หากอนุมัติจะมีผู้มีสิทธิ์สอบ ${approvedNow + adding} คน ต้องการดำเนินการต่อหรือไม่?`,
          confirmLabel: 'อนุมัติต่อ',
        });
        if (!ok) return;
      }
    } else {
      const ok = await confirm({
        title: `ไม่อนุมัติ ${ids.length} ราย?`,
        description: 'ผู้สมัครจะไม่สามารถเข้าสอบในหลักสูตรนี้ได้ (เปลี่ยนกลับเป็นอนุมัติได้ภายหลัง)',
        confirmLabel: 'ไม่อนุมัติ',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await applications.setEnrollment(ids, status);
      toast.success(status === 'อนุมัติ' ? `อนุมัติสิทธิ์สอบ ${ids.length} ราย` : `ไม่อนุมัติ ${ids.length} ราย`);
      setSelected(new Set());
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const assignRound = async (value: string) => {
    const roundId = value === 'none' ? null : Number(value);
    const eligible = sel.filter((id) => apps.find((a) => a.id === id)?.status === 'อนุมัติ');
    if (!eligible.length) return toast.error('จัดรอบได้เฉพาะผู้ที่ได้รับอนุมัติสิทธิ์สอบ');
    setBusy(true);
    try {
      await applications.assignRound(eligible, roundId);
      const name = rounds.find((r) => r.id === roundId)?.name;
      toast.success(roundId ? `จัด ${eligible.length} คนเข้า “${name}” แล้ว` : `นำ ${eligible.length} คนออกจากรอบแล้ว`);
      if (eligible.length < sel.length) toast.info(`ข้าม ${sel.length - eligible.length} คนที่ยังไม่ได้รับอนุมัติสิทธิ์`);
      setSelected(new Set());
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const open = apps.find((a) => a.id === openId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          size="sm"
          options={[
            { value: 'all', label: `ทั้งหมด ${counts.all}` },
            { value: 'รอพิจารณา', label: `รอตรวจ ${counts['รอพิจารณา']}` },
            { value: 'อนุมัติ', label: `อนุมัติ ${counts['อนุมัติ']}` },
            { value: 'ปฏิเสธ', label: `ไม่อนุมัติ ${counts['ปฏิเสธ']}` },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="ค้นหาชื่อ เลขบัตร อีเมล โทรศัพท์" className="lg:w-80" />
      </div>

      {sel.length > 0 && (
        <div className="sticky top-[72px] z-20 flex animate-fade-up flex-wrap items-center gap-2 rounded-2xl border border-ink-800 bg-ink-950 dark:bg-ink-800 dark:ring-1 dark:ring-white/10 px-4 py-2.5 text-sm text-white shadow-pop">
          <span className="mr-1 font-medium tabular">เลือก {sel.length} ราย</span>
          <Button size="sm" variant="success" icon={<CircleCheck className="h-4 w-4" />} loading={busy} onClick={() => setEnrollment(sel, 'อนุมัติ')}>
            อนุมัติสิทธิ์สอบ
          </Button>
          <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" icon={<CircleX className="h-4 w-4" />} disabled={busy} onClick={() => setEnrollment(sel, 'ปฏิเสธ')}>
            ไม่อนุมัติ
          </Button>
          {rounds.length > 0 && (
            <div className="w-52">
              <Select
                value=""
                placeholder="จัดเข้ารอบสอบปฏิบัติ…"
                disabled={busy}
                onChange={(e) => assignRound(e.target.value)}
                className="h-8 border-zinc-700 bg-zinc-900 text-[0.8125rem] text-zinc-100"
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="none">— นำออกจากรอบ —</option>
              </Select>
            </div>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="ยกเลิกการเลือก">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={apps.length ? 'ไม่พบผู้สมัครตามเงื่อนไข' : 'ยังไม่มีผู้สมัครหลักสูตรนี้'}
            description={apps.length ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา' : 'เมื่อผู้ใช้สมัครหลักสูตรจากหน้า “หลักสูตรและการสอบ” จะแสดงที่นี่'}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH className="w-10">
                  <Checkbox
                    checked={allOn}
                    indeterminate={!allOn && someOn}
                    disabled={visibleIds.length === 0}
                    onChange={(v) =>
                      setSelected((p) => {
                        const n = new Set(p);
                        visibleIds.forEach((id) => (v ? n.add(id) : n.delete(id)));
                        return n;
                      })
                    }
                  />
                </TH>
                <TH>ผู้สมัคร</TH>
                <TH>เอกสาร</TH>
                <TH>ทฤษฎี</TH>
                <TH>รอบปฏิบัติ</TH>
                <TH>สถานะ</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((a) => {
                const u = userMap.get(a.user_id);
                const docs = u ? [u.id_photo_file_pathname, u.identification_file_pathname, u.eq_file_pathname].filter(Boolean).length : 0;
                const best = bestAttempt(attempts, a.id);
                const round = rounds.find((r) => r.id === a.practical_round_id);
                const locked = isLocked(a);
                return (
                  <TR key={a.id} className={cn('cursor-pointer', selected.has(a.id) && 'bg-brand-50/40 hover:bg-brand-50/60')} onClick={() => setOpenId(a.id)}>
                    <TD onClick={(e) => e.stopPropagation()}>
                      {locked ? (
                        <span title="ส่งผลให้ผู้อำนวยการแล้ว แก้ไขไม่ได้" className="flex h-[18px] w-[18px] items-center justify-center text-zinc-400">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <Checkbox
                          checked={selected.has(a.id)}
                          onChange={(v) =>
                            setSelected((p) => {
                              const n = new Set(p);
                              if (v) n.add(a.id);
                              else n.delete(a.id);
                              return n;
                            })
                          }
                        />
                      )}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={u?.first_name_th || '?'} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-zinc-900">{u ? fullName(u) : `ผู้ใช้ #${a.user_id}`}</div>
                          <div className="truncate text-xs text-zinc-500 tabular">
                            {formatCitizenId(u?.th_human_number)} · {relativeTime(a.created_at)}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className={cn('inline-flex items-center gap-1 text-[0.8125rem] tabular', docs === 3 ? 'text-emerald-700' : 'text-amber-700')}>
                        <Paperclip className="h-3.5 w-3.5" />
                        {docs}/3
                      </span>
                    </TD>
                    <TD>
                      {best ? (
                        best.needs_review ? (
                          <Badge tone="violet">รอตรวจข้อเขียน</Badge>
                        ) : (
                          <span className={cn('text-[0.8125rem] font-medium tabular', best.passed ? 'text-emerald-700' : 'text-brand-700')}>
                            {num(best.percent, 1)}%
                          </span>
                        )
                      ) : attempts.some((x) => x.application_id === a.id && x.status === 'in_progress') ? (
                        <Badge tone="blue">กำลังสอบ</Badge>
                      ) : (
                        <span className="text-[0.8125rem] text-zinc-400">ยังไม่สอบ</span>
                      )}
                    </TD>
                    <TD className="text-[0.8125rem] text-zinc-600">{round?.name || <span className="text-zinc-400">—</span>}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1.5">
                        <EnrollmentBadge status={a.status} />
                        {a.approval_status !== 'none' && <ApprovalBadge status={a.approval_status} />}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <ApplicantDrawer
        open={!!open}
        onClose={() => setOpenId(null)}
        app={open}
        user={open ? userMap.get(open.user_id) : undefined}
        attempts={open ? attempts.filter((x) => x.application_id === open.id) : []}
        round={open ? rounds.find((r) => r.id === open.practical_round_id) : undefined}
        busy={busy}
        onDecide={async (status) => {
          if (!open) return;
          await setEnrollment([open.id], status);
        }}
      />
    </div>
  );
}
