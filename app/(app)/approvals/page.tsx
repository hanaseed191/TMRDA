'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BadgeCheck, CircleCheck, CircleX, FileText, PartyPopper, Stamp, Undo2 } from 'lucide-react';
import { applications, courses, users } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import { errorMessage, formatCitizenId, fullName, num, relativeTime, thaiDateRange } from '@/lib/format';
import { pct } from '@/lib/scoring';
import type { TrainingApplication, TrainingCourse, User } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  PageHeader,
  SkeletonRows,
  Stat,
  Table,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  useConfirm,
} from '@/components/ui';
import { PassFail, ResultBadge } from '@/components/status';
import CandidateDrawer from '@/components/results/CandidateDrawer';

async function load() {
  const pending = await applications.list({ approval: ['submitted'] });
  const [allCourses, people, approvedToday] = await Promise.all([
    courses.list(),
    users.byIds(Array.from(new Set(pending.map((a) => a.user_id)))),
    applications.list({ approval: ['approved'] }),
  ]);
  return { pending, courses: allCourses, people, approvedCount: approvedToday.length };
}

function Score({ score, max, passed }: { score: number | null | undefined; max: number | null | undefined; passed: boolean | null | undefined }) {
  if (!max) return <span className="text-sm text-zinc-300">—</span>;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1">
        <span className="font-semibold tabular text-zinc-950">{num(score)}</span>
        <span className="text-xs tabular text-zinc-400">/ {num(max)}</span>
        <span className="text-xs tabular text-zinc-500">· {num(pct(Number(score), Number(max)))}%</span>
      </div>
      <PassFail passed={passed} />
    </div>
  );
}

export default function ApprovalsPage() {
  const me = useUser();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useLoad(load, []);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [detail, setDetail] = useState<TrainingApplication | null>(null);

  const userById = useMemo(() => new Map((data?.people || []).map((u) => [u.id, u])), [data]);
  const courseById = useMemo(() => new Map((data?.courses || []).map((c) => [c.id, c])), [data]);

  const groups = useMemo(() => {
    const m = new Map<number, TrainingApplication[]>();
    for (const a of data?.pending || []) m.set(a.training_id, [...(m.get(a.training_id) || []), a]);
    return Array.from(m.entries()).map(([trainingId, apps]) => ({
      course: courseById.get(trainingId) as TrainingCourse | undefined,
      apps: apps.sort((x, y) => (userById.get(x.user_id)?.first_name_th || '').localeCompare(userById.get(y.user_id)?.first_name_th || '', 'th')),
    }));
  }, [data, courseById, userById]);

  const pending = data?.pending || [];
  const passedCount = pending.filter((a) => a.result_status === 'passed').length;

  const toggle = (ids: number[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });

  const approve = async () => {
    const ids = Array.from(selected);
    const chosen = pending.filter((a) => selected.has(a.id));
    const passed = chosen.filter((a) => a.result_status === 'passed').length;
    const ok = await confirm({
      title: `อนุมัติผลการสอบ ${ids.length} รายการ?`,
      description: (
        <>
          ระบบจะออกเลขที่ใบประกาศนียบัตรให้ผู้ที่ผ่าน <b className="text-zinc-900">{passed}</b> คน
          {chosen.length - passed > 0 && <> และรับรองผลไม่ผ่าน {chosen.length - passed} คน</>}
          <br />
          ลงนามในนาม <b className="text-zinc-900">{fullName(me)}</b>
          {me.position_title ? ` (${me.position_title})` : ''}
        </>
      ),
      confirmLabel: 'อนุมัติและลงนาม',
      tone: 'primary',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const n = await applications.decide(ids, 'approved');
      toast.success(`อนุมัติแล้ว ${n} รายการ`);
      setSelected(new Set());
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!note.trim()) return toast.error('กรุณาระบุเหตุผลที่ส่งกลับ');
    setBusy(true);
    try {
      const n = await applications.decide(Array.from(selected), 'rejected', note.trim());
      toast.success(`ส่งกลับให้เจ้าหน้าที่แก้ไข ${n} รายการ`);
      setSelected(new Set());
      setNote('');
      setRejectOpen(false);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="ผู้อำนวยการ"
        title="อนุมัติผลการสอบ"
        description="ตรวจสอบผลที่เจ้าหน้าที่ส่งมา เมื่ออนุมัติแล้ว ผู้ที่ผ่านจะได้รับเลขที่ใบประกาศนียบัตรและพิมพ์ได้ทันที"
        actions={<ButtonLink href="/approvals/issued" variant="outline" icon={<BadgeCheck className="h-4 w-4" />}>ใบประกาศที่ออกแล้ว</ButtonLink>}
      />

      {error && <Callout tone="red" className="mb-6">{error}</Callout>}

      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="รอพิจารณา" value={pending.length} tone="blue" icon={<Stamp className="h-[18px] w-[18px]" />} />
          <Stat label="ผลผ่าน" value={passedCount} tone="green" icon={<CircleCheck className="h-[18px] w-[18px]" />} />
          <Stat label="ผลไม่ผ่าน" value={pending.length - passedCount} tone="red" icon={<CircleX className="h-[18px] w-[18px]" />} />
          <Stat label="อนุมัติแล้วทั้งหมด" value={data.approvedCount} icon={<BadgeCheck className="h-[18px] w-[18px]" />} href="/approvals/issued" />
        </div>
      )}

      {loading ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : pending.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-b from-emerald-50/60 to-surface">
            <EmptyState
              icon={<PartyPopper className="h-5 w-5 text-emerald-600" />}
              title="ไม่มีรายการรออนุมัติ"
              description="คุณพิจารณาผลครบทุกรายการแล้ว เมื่อเจ้าหน้าที่ส่งผลใหม่ รายการจะปรากฏที่นี่"
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6 pb-24">
          {groups.map(({ course, apps }) => {
            const ids = apps.map((a) => a.id);
            const all = ids.every((id) => selected.has(id));
            const some = ids.some((id) => selected.has(id));
            return (
              <Card key={course?.id ?? apps[0].training_id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Checkbox checked={all} indeterminate={!all && some} onChange={(on) => toggle(ids, on)} />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{course?.course_name || 'หลักสูตร'}</h2>
                      <p className="text-[0.8125rem] text-zinc-500">
                        {course?.level_name && `${course.level_name} · `}
                        {thaiDateRange(course?.startswith_date, course?.endswith_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="green">ผ่าน {apps.filter((a) => a.result_status === 'passed').length}</Badge>
                    <Badge tone="red">ไม่ผ่าน {apps.filter((a) => a.result_status === 'failed').length}</Badge>
                    <ButtonLink href={`/print/approval-report/${course?.id ?? apps[0].training_id}`} variant="outline" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>
                      บัญชีเสนออนุมัติ
                    </ButtonLink>
                  </div>
                </div>
                <Table>
                  <THead>
                    <tr>
                      <TH className="w-10" />
                      <TH>ผู้สอบ</TH>
                      <TH>ภาคทฤษฎี</TH>
                      <TH>ภาคปฏิบัติ (เฉลี่ย)</TH>
                      <TH>ผล</TH>
                      <TH>ส่งเมื่อ</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {apps.map((a) => {
                      const u = userById.get(a.user_id) as User | undefined;
                      return (
                        <TR key={a.id} className={`cursor-pointer ${selected.has(a.id) ? 'bg-brand-50/40 hover:bg-brand-50/60' : ''}`} onClick={() => setDetail(a)}>
                          <TD>
                            <Checkbox checked={selected.has(a.id)} onChange={(on) => toggle([a.id], on)} />
                          </TD>
                          <TD>
                            <div className="flex items-center gap-3">
                              <Avatar name={u?.first_name_th || '?'} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate font-medium text-zinc-900">{fullName(u)}</div>
                                <div className="text-xs tabular text-zinc-500">{formatCitizenId(u?.th_human_number)}</div>
                              </div>
                            </div>
                          </TD>
                          <TD>
                            <Score score={a.theory_score} max={a.theory_max} passed={a.theory_passed} />
                          </TD>
                          <TD>
                            <Score score={a.practical_score} max={a.practical_max} passed={a.practical_passed} />
                          </TD>
                          <TD>
                            <ResultBadge status={a.result_status} />
                          </TD>
                          <TD className="whitespace-nowrap text-[0.8125rem] text-zinc-500">{relativeTime(a.submitted_at)}</TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
              </Card>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 lg:pl-[264px]">
          <div className="flex w-full max-w-xl animate-fade-up items-center justify-between gap-3 rounded-2xl bg-ink-950 dark:bg-ink-800 dark:ring-1 dark:ring-white/10 px-4 py-3 text-white shadow-pop">
            <span className="text-sm">
              เลือก <b className="tabular">{selected.size}</b> รายการ
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-zinc-300 hover:bg-white/10 hover:text-white" icon={<Undo2 className="h-3.5 w-3.5" />} onClick={() => setRejectOpen(true)}>
                ส่งกลับแก้ไข
              </Button>
              <Button size="sm" icon={<Stamp className="h-3.5 w-3.5" />} loading={busy} onClick={approve}>
                อนุมัติ
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`ส่งกลับให้เจ้าหน้าที่แก้ไข (${selected.size} รายการ)`}
        description="เจ้าหน้าที่จะเห็นเหตุผลนี้ และสามารถแก้ไขแล้วส่งกลับมาใหม่ได้"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="dark" loading={busy} onClick={reject} disabled={!note.trim()}>
              ส่งกลับ
            </Button>
          </>
        }
      >
        <Field label="เหตุผล / สิ่งที่ต้องแก้ไข" required>
          {(id) => <Textarea id={id} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น คะแนนภาคปฏิบัติของผู้ประเมินคนที่ 2 ไม่สอดคล้องกับเกณฑ์ กรุณาตรวจสอบ" />}
        </Field>
      </Dialog>

      <CandidateDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        application={detail}
        user={detail ? userById.get(detail.user_id) || null : null}
        course={detail ? courseById.get(detail.training_id) || null : null}
      />
    </>
  );
}
