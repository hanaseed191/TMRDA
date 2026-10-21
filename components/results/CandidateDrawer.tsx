'use client';

import { useLoad } from '@/lib/hooks';
import { buildCourseResults } from '@/lib/results';
import { documentUrl } from '@/lib/api';
import {
  formatCitizenId,
  formatPhone,
  fullName,
  fullNameEn,
  num,
  thaiDate,
  thaiDateTime,
} from '@/lib/format';
import { pct } from '@/lib/scoring';
import type { TrainingApplication, TrainingCourse, User } from '@/lib/types';
import { Avatar, Callout, DescriptionList, Drawer, Skeleton } from '@/components/ui';
import { ApprovalBadge, PassFail, ResultBadge } from '@/components/status';

/** Read-only candidate summary: profile, frozen snapshot and per-evaluator breakdown. */
export default function CandidateDrawer({
  open,
  onClose,
  application,
  user,
  course,
}: {
  open: boolean;
  onClose: () => void;
  application: TrainingApplication | null;
  user: User | null;
  course: TrainingCourse | null;
}) {
  const live = useLoad(
    () => (open && application ? buildCourseResults(application.training_id) : Promise.resolve(null)),
    [open, application?.training_id]
  );
  const row = live.data?.rows.find((r) => r.application.id === application?.id);
  const a = application;

  return (
    <Drawer open={open} onClose={onClose} title="รายละเอียดผู้สอบ" description={course?.course_name}>
      {a && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.first_name_th || '?'} src={documentUrl(user, 'id_photo_file_pathname')} size="lg" />
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-950">{fullName(user)}</div>
              {fullNameEn(user) && <div className="text-sm text-zinc-500">{fullNameEn(user)}</div>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <ResultBadge status={a.result_status} />
                <ApprovalBadge status={a.approval_status} />
              </div>
            </div>
          </div>

          <DescriptionList
            items={[
              { label: 'เลขบัตรประชาชน', value: <span className="tabular">{formatCitizenId(user?.th_human_number)}</span> },
              { label: 'โทรศัพท์', value: formatPhone(user?.phone_number) },
              { label: 'อีเมล', value: user?.email || '—' },
              { label: 'วันเกิด', value: thaiDate(user?.birth_day) },
              { label: 'ประเภทผู้สมัคร', value: a.applicant_type || '—' },
              { label: 'ส่งอนุมัติเมื่อ', value: thaiDateTime(a.submitted_at) },
            ]}
          />

          <div>
            <h3 className="mb-2 text-sm font-semibold">ผลที่ส่งมาให้พิจารณา</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <div className="text-xs text-zinc-500">ภาคทฤษฎี</div>
                {a.theory_max ? (
                  <>
                    <div className="mt-1 font-display text-xl font-semibold tabular">
                      {num(a.theory_score)} <span className="text-sm font-normal text-zinc-400">/ {num(a.theory_max)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      {num(pct(Number(a.theory_score), Number(a.theory_max)))}% <PassFail passed={a.theory_passed} />
                    </div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-zinc-400">ไม่มี</div>
                )}
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <div className="text-xs text-zinc-500">ภาคปฏิบัติ (เฉลี่ย)</div>
                {a.practical_max ? (
                  <>
                    <div className="mt-1 font-display text-xl font-semibold tabular">
                      {num(a.practical_score)} <span className="text-sm font-normal text-zinc-400">/ {num(a.practical_max)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      {num(pct(Number(a.practical_score), Number(a.practical_max)))}% <PassFail passed={a.practical_passed} />
                    </div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-zinc-400">ไม่มี</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">คะแนนจากผู้ประเมินแต่ละท่าน</h3>
            {live.loading ? (
              <Skeleton className="h-24" />
            ) : !row?.practical?.round ? (
              <p className="text-sm text-zinc-400">ไม่มีข้อมูลภาคปฏิบัติ</p>
            ) : (
              <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
                {row.practical.evaluators.map((e, i) => (
                  <div key={e.evaluator_id} className="flex items-start gap-3 px-4 py-3">
                    <Avatar name={e.evaluator?.first_name_th || '?'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900">
                        ผู้ประเมินคนที่ {i + 1} · {fullName(e.evaluator)}
                      </div>
                      {e.score?.comment && <p className="mt-0.5 text-xs text-zinc-500">“{e.score.comment}”</p>}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular">
                      {e.score?.status === 'submitted' ? `${num(e.score.total)} / ${num(row.practical!.max)}` : '—'}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-zinc-50/80 px-4 py-2.5 text-sm">
                  <span className="text-zinc-500">ค่าเฉลี่ย (รวม ÷ {row.practical.average?.submitted || 0})</span>
                  <span className="font-semibold tabular">{num(row.practical.average?.average)}</span>
                </div>
              </div>
            )}
          </div>

          {a.approval_note && (
            <Callout tone={a.approval_status === 'rejected' ? 'red' : 'neutral'} title="หมายเหตุ">
              {a.approval_note}
            </Callout>
          )}
        </div>
      )}
    </Drawer>
  );
}
