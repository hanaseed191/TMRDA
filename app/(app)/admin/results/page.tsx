'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { BadgeCheck, Clock, Download, FileStack, FileText, Hourglass, RotateCcw, Send, CircleCheck, CircleX, Users } from 'lucide-react';
import { applications, courses as coursesApi } from '@/lib/api';
import { buildCourseResults, canSubmit, snapshotOf, type CandidateResult } from '@/lib/results';
import { useLoad } from '@/lib/hooks';
import { errorMessage, formatCitizenId, fullName, thaiDateRange } from '@/lib/format';
import {
  Avatar,
  Button,
  ButtonLink,
  Callout,
  Card,
  Checkbox,
  EmptyState,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  SkeletonRows,
  Stat,
  Table,
  TD,
  TH,
  THead,
  TR,
  useConfirm,
} from '@/components/ui';
import { ApprovalBadge, ResultBadge } from '@/components/status';
import { PracticalCell, TheoryCell } from '@/components/results/ScoreCells';
import GradeAttemptDrawer from '@/components/results/GradeAttemptDrawer';
import { resultsCsv } from '@/components/results/util';

type Filter = 'all' | 'ready' | 'pending' | 'submitted' | 'approved';

function ResultsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const confirm = useConfirm();

  const coursesQ = useLoad(() => coursesApi.list(), []);
  const courseParam = Number(params.get('course')) || null;
  const courseId = courseParam || coursesQ.data?.[0]?.id || null;

  const resultsQ = useLoad(() => (courseId ? buildCourseResults(courseId) : Promise.resolve(null)), [courseId]);
  const data = resultsQ.data;

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [grading, setGrading] = useState<CandidateResult | null>(null);

  useEffect(() => setSelected(new Set()), [courseId]);

  const setCourse = (id: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set('course', String(id));
    router.replace(`${pathname}?${sp.toString()}`);
  };

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const counts = useMemo(
    () => ({
      passed: rows.filter((r) => r.final.status === 'passed').length,
      failed: rows.filter((r) => r.final.status === 'failed').length,
      pending: rows.filter((r) => r.final.status === 'pending').length,
      submitted: rows.filter((r) => r.application.approval_status === 'submitted').length,
      approved: rows.filter((r) => r.application.approval_status === 'approved').length,
      ready: rows.filter(canSubmit).length,
      review: rows.filter((r) => r.theory?.needsReview).length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'ready' && !canSubmit(r)) return false;
      if (filter === 'pending' && r.final.status !== 'pending') return false;
      if (filter === 'submitted' && r.application.approval_status !== 'submitted') return false;
      if (filter === 'approved' && r.application.approval_status !== 'approved') return false;
      if (!q) return true;
      return `${fullName(r.user)} ${r.user?.th_human_number || ''}`.toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  const selectable = visible.filter(canSubmit);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.application.id));
  const toggle = (id: number, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const submit = async () => {
    const chosen = rows.filter((r) => selected.has(r.application.id) && canSubmit(r));
    if (chosen.length === 0) return;
    const passed = chosen.filter((r) => r.final.status === 'passed').length;
    const ok = await confirm({
      title: `ส่งผลของ ${chosen.length} คนให้ผู้อำนวยการอนุมัติ?`,
      description: (
        <>
          ผ่าน {passed} คน · ไม่ผ่าน {chosen.length - passed} คน
          <br />
          ระบบจะบันทึกคะแนน ณ ตอนนี้เป็นผลทางการ หากต้องแก้ไขภายหลังสามารถดึงกลับได้จนกว่าผู้อำนวยการจะพิจารณา
        </>
      ),
      confirmLabel: 'ส่งอนุมัติ',
      tone: 'primary',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const n = await applications.submitForApproval(chosen.map(snapshotOf));
      toast.success(`ส่งผลให้ผู้อำนวยการแล้ว ${n} รายการ`);
      setSelected(new Set());
      await resultsQ.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const recall = async (r: CandidateResult) => {
    const ok = await confirm({
      title: 'ดึงผลกลับมาแก้ไข?',
      description: `${fullName(r.user)} จะถูกนำออกจากรายการรออนุมัติของผู้อำนวยการ`,
      confirmLabel: 'ดึงกลับ',
    });
    if (!ok) return;
    try {
      await applications.recall([r.application.id]);
      toast.success('ดึงผลกลับแล้ว');
      resultsQ.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const course = data?.course;

  return (
    <>
      <PageHeader
        eyebrow="ผลการสอบ"
        title="ผลคะแนนและส่งอนุมัติ"
        description="รวมคะแนนภาคทฤษฎีและค่าเฉลี่ยภาคปฏิบัติจากผู้ประเมิน 3 ท่าน ตรวจข้อเขียน แล้วส่งให้ผู้อำนวยการอนุมัติเพื่อออกใบประกาศ"
        actions={
          <>
            {data && rows.length > 0 && (
              <>
                <ButtonLink href={`/print/approval-report/${data.course.id}`} variant="outline" icon={<FileText className="h-4 w-4" />}>
                  บัญชีเสนออนุมัติ (PDF/Excel)
                </ButtonLink>
                <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => resultsCsv(data.course.course_name, visible)}>
                  ส่งออก CSV
                </Button>
              </>
            )}
          </>
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            {coursesQ.loading ? (
              <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />
            ) : (coursesQ.data?.length ?? 0) === 0 ? (
              <span className="text-sm text-zinc-500">ยังไม่มีหลักสูตรในระบบ</span>
            ) : (
              <Select value={courseId ?? ''} onChange={(e) => setCourse(Number(e.target.value))} aria-label="เลือกหลักสูตร">
                {coursesQ.data!.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_name} {c.level_name ? `· ${c.level_name}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
          {course && (
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <span>{thaiDateRange(course.startswith_date, course.endswith_date)}</span>
              <Link href={`/admin/courses/${course.id}`} className="font-medium text-zinc-800 underline-offset-4 hover:underline">
                จัดการหลักสูตร →
              </Link>
            </div>
          )}
        </div>
      </Card>

      {resultsQ.error && <Callout tone="red" className="mb-6" title="โหลดข้อมูลไม่สำเร็จ">{resultsQ.error}</Callout>}

      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <Stat label="ผ่าน" value={counts.passed} tone="green" icon={<CircleCheck className="h-[18px] w-[18px]" />} />
          <Stat label="ไม่ผ่าน" value={counts.failed} tone="red" icon={<CircleX className="h-[18px] w-[18px]" />} />
          <Stat label="รอผล" value={counts.pending} tone="neutral" icon={<Hourglass className="h-[18px] w-[18px]" />} hint={counts.review ? `รอตรวจข้อเขียน ${counts.review} คน` : undefined} />
          <Stat label="รอผู้อำนวยการ" value={counts.submitted} tone="blue" icon={<Clock className="h-[18px] w-[18px]" />} />
          <Stat label="อนุมัติแล้ว" value={counts.approved} tone="green" icon={<BadgeCheck className="h-[18px] w-[18px]" />} className="col-span-2 lg:col-span-1" />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<Filter>
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `ทั้งหมด ${rows.length}` },
              { value: 'ready', label: `พร้อมส่ง ${counts.ready}` },
              { value: 'pending', label: `รอผล ${counts.pending}` },
              { value: 'submitted', label: `รออนุมัติ ${counts.submitted}` },
              { value: 'approved', label: `อนุมัติแล้ว ${counts.approved}` },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาชื่อ หรือเลขบัตร" className="lg:w-72" />
        </div>

        {selected.size > 0 && (
          <div className="flex animate-fade-in flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-ink-950 dark:bg-ink-800 dark:ring-1 dark:ring-white/10 px-4 py-3 text-white">
            <span className="text-sm">
              เลือกแล้ว <b className="tabular">{selected.size}</b> คน
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-zinc-300 hover:bg-white/10 hover:text-white" onClick={() => setSelected(new Set())}>
                ล้าง
              </Button>
              <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} loading={busy} onClick={submit}>
                ส่งผู้อำนวยการอนุมัติ ({selected.size})
              </Button>
            </div>
          </div>
        )}

        {resultsQ.loading || coursesQ.loading || (!data && courseId && !resultsQ.error) ? (
          <SkeletonRows rows={5} />
        ) : !data ? (
          <EmptyState icon={<FileStack className="h-5 w-5" />} title="ยังไม่มีหลักสูตร" description="สร้างหลักสูตรก่อน แล้วผลคะแนนจะแสดงที่นี่" action={<ButtonLink href="/admin/courses">ไปที่หลักสูตร</ButtonLink>} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="ยังไม่มีผู้มีสิทธิ์สอบ"
            description="อนุมัติใบสมัครของผู้สมัครในหน้าหลักสูตรก่อน ผู้มีสิทธิ์สอบจะแสดงที่นี่"
            action={<ButtonLink href={`/admin/courses/${data.course.id}`} variant="outline">ไปที่ผู้สมัคร</ButtonLink>}
          />
        ) : visible.length === 0 ? (
          <EmptyState compact title="ไม่พบรายการตามตัวกรอง" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH className="w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && selectable.some((r) => selected.has(r.application.id))}
                    disabled={selectable.length === 0}
                    onChange={(on) => setSelected(on ? new Set(selectable.map((r) => r.application.id)) : new Set())}
                  />
                </TH>
                <TH>ผู้สอบ</TH>
                <TH>ภาคทฤษฎี</TH>
                <TH>ภาคปฏิบัติ (เฉลี่ย)</TH>
                <TH>ผลรวม</TH>
                <TH>การอนุมัติ</TH>
                <TH className="text-right" />
              </tr>
            </THead>
            <tbody>
              {visible.map((r) => {
                const id = r.application.id;
                const can = canSubmit(r);
                return (
                  <TR key={id} className={selected.has(id) ? 'bg-brand-50/40 hover:bg-brand-50/60' : undefined}>
                    <TD>
                      <Checkbox checked={selected.has(id)} disabled={!can} onChange={(on) => toggle(id, on)} />
                    </TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.user?.first_name_th || '?'} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-zinc-900">{fullName(r.user)}</div>
                          <div className="text-xs text-zinc-500 tabular">{formatCitizenId(r.user?.th_human_number)}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <TheoryCell
                        part={r.theory}
                        locked={['submitted', 'approved'].includes(r.application.approval_status || 'none')}
                        onGrade={r.theory?.attempt ? () => setGrading(r) : undefined}
                      />
                    </TD>
                    <TD>
                      <PracticalCell part={r.practical} />
                    </TD>
                    <TD>
                      <ResultBadge status={r.final.status} />
                    </TD>
                    <TD>
                      <div className="space-y-1">
                        <ApprovalBadge status={r.application.approval_status} />
                        {r.application.approval_status === 'rejected' && r.application.approval_note && (
                          <p className="max-w-[220px] text-xs text-brand-700" title={r.application.approval_note}>
                            “{r.application.approval_note}”
                          </p>
                        )}
                        {r.application.certificate_no && <p className="text-xs text-zinc-500 tabular">{r.application.certificate_no}</p>}
                      </div>
                    </TD>
                    <TD className="text-right">
                      {r.application.approval_status === 'submitted' && (
                        <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => recall(r)}>
                          ดึงกลับ
                        </Button>
                      )}
                      {r.application.approval_status === 'approved' && r.application.certificate_no && (
                        <ButtonLink size="sm" variant="outline" href={`/print/certificate/${id}`} target="_blank">
                          ใบประกาศ
                        </ButtonLink>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <GradeAttemptDrawer
        open={!!grading}
        attempt={grading?.theory?.attempt || null}
        candidate={grading?.user || null}
        readOnly={['submitted', 'approved'].includes(grading?.application.approval_status || 'none')}
        onClose={() => setGrading(null)}
        onSaved={() => resultsQ.reload()}
      />
    </>
  );
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={6} />}>
      <ResultsPageInner />
    </Suspense>
  );
}
