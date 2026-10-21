'use client';

import { CircleCheck, CircleX, ExternalLink, FileText, ImageIcon, Paperclip } from 'lucide-react';
import { documentUrl, labor } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import {
  formatCitizenId,
  formatPhone,
  fullName,
  fullNameEn,
  num,
  thaiDate,
  thaiDateTime,
} from '@/lib/format';
import type { DocumentField, ExamAttempt, PracticalRound, TrainingApplication, User } from '@/lib/types';
import { Avatar, Badge, Button, DescriptionList, Drawer, Skeleton } from '@/components/ui';
import { EnrollmentBadge, PassFail } from '@/components/status';

const DOCS: { field: DocumentField; label: string }[] = [
  { field: 'id_photo_file_pathname', label: 'รูปถ่ายหน้าตรง' },
  { field: 'identification_file_pathname', label: 'สำเนาบัตรประชาชน' },
  { field: 'eq_file_pathname', label: 'สำเนาวุฒิการศึกษา' },
];

export default function ApplicantDrawer({
  open,
  onClose,
  app,
  user,
  attempts,
  round,
  onDecide,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  app: TrainingApplication | null;
  user: User | undefined;
  attempts: ExamAttempt[];
  round?: PracticalRound;
  onDecide: (status: 'อนุมัติ' | 'ปฏิเสธ') => void;
  busy?: boolean;
}) {
  const { data: lh, loading: lhLoading } = useLoad(async () => (user ? labor.get(user.id) : null), [user?.id, open]);

  if (!app) return null;
  const locked = ['submitted', 'approved'].includes(app.approval_status);
  const address = user
    ? [
        user.house_number && `เลขที่ ${user.house_number}`,
        user.house_group ? `หมู่ ${user.house_group}` : '',
        user.alley_name && `ซ.${user.alley_name}`,
        user.road_name && `ถ.${user.road_name}`,
        user.subdistrict_name,
        user.district_name,
        user.province_name,
        user.zip_code,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="ข้อมูลผู้สมัคร"
      description={`สมัครเมื่อ ${thaiDateTime(app.created_at)}`}
      footer={
        !locked && (
          <>
            {app.status !== 'ปฏิเสธ' && (
              <Button variant="danger" icon={<CircleX className="h-4 w-4" />} onClick={() => onDecide('ปฏิเสธ')} loading={busy}>
                ไม่อนุมัติ
              </Button>
            )}
            {app.status !== 'อนุมัติ' && (
              <Button variant="success" icon={<CircleCheck className="h-4 w-4" />} onClick={() => onDecide('อนุมัติ')} loading={busy}>
                อนุมัติสิทธิ์สอบ
              </Button>
            )}
          </>
        )
      }
    >
      {!user ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <Avatar name={user.first_name_th} src={documentUrl(user, 'id_photo_file_pathname')} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-zinc-950">{fullName(user)}</div>
              {fullNameEn(user) && <div className="truncate text-sm text-zinc-500">{fullNameEn(user)}</div>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <EnrollmentBadge status={app.status} />
                {app.applicant_type && <Badge>{app.applicant_type}</Badge>}
                {app.is_skill_testing && <Badge tone="blue">ทดสอบมาตรฐานฝีมือ</Badge>}
              </div>
            </div>
          </div>

          <section>
            <h3 className="eyebrow mb-1">ข้อมูลส่วนตัว</h3>
            <DescriptionList
              items={[
                { label: 'เลขบัตรประชาชน', value: <span className="tabular">{formatCitizenId(user.th_human_number)}</span> },
                { label: 'วันเกิด', value: thaiDate(user.birth_day) },
                { label: 'เพศ / สัญชาติ', value: `${user.sex_name || '—'} · ${user.nationality_name || '—'}` },
                { label: 'โทรศัพท์', value: formatPhone(user.phone_number) },
                { label: 'อีเมล', value: <span className="break-all">{user.email}</span> },
                { label: 'ที่อยู่', value: address || '—' },
                { label: 'การศึกษา', value: [user.education_level, user.branch_name].filter(Boolean).join(' · ') || '—' },
                {
                  label: 'สภาพร่างกาย',
                  value: user.physical_id === 2 ? `ผู้พิการ${user.disability_types ? ` (${user.disability_types})` : ''}` : 'ปกติ',
                },
              ]}
            />
          </section>

          <section>
            <h3 className="eyebrow mb-2">เอกสารแนบ</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {DOCS.map((d) => {
                const url = documentUrl(user, d.field);
                const isImg = url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
                return url ? (
                  <a
                    key={d.field}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-surface transition hover:border-zinc-300 hover:shadow-card"
                  >
                    <div className="flex h-24 items-center justify-center bg-zinc-50">
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={d.label} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-7 w-7 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-medium text-zinc-700">
                      <span className="truncate">{d.label}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
                    </div>
                  </a>
                ) : (
                  <div key={d.field} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-2 py-5 text-center">
                    {d.field === 'id_photo_file_pathname' ? (
                      <ImageIcon className="h-5 w-5 text-zinc-300" />
                    ) : (
                      <Paperclip className="h-5 w-5 text-zinc-300" />
                    )}
                    <span className="text-xs text-zinc-500">{d.label}</span>
                    <span className="text-[0.6875rem] text-amber-700">ยังไม่แนบ</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="eyebrow mb-1">สถานภาพแรงงาน</h3>
            {lhLoading ? (
              <Skeleton className="h-24" />
            ) : !lh ? (
              <p className="py-2 text-sm text-zinc-500">ผู้สมัครยังไม่ได้กรอกประวัติแรงงาน</p>
            ) : (
              <DescriptionList
                items={[
                  { label: 'สถานภาพ', value: lh.is_have_job },
                  ...(lh.is_have_job === 'ทำงาน'
                    ? [
                        { label: 'ประเภทงาน', value: lh.labor_status || '—' },
                        { label: 'อาชีพ / ตำแหน่ง', value: [lh.occupation, lh.position].filter(Boolean).join(' · ') || '—' },
                        { label: 'สถานที่ทำงาน', value: lh.agency_name || '—' },
                        { label: 'รายได้ต่อเดือน', value: lh.labor_salary || '—' },
                      ]
                    : [{ label: 'สถานะ', value: lh.not_have_job_status || '—' }]),
                  { label: 'ความต้องการหางาน', value: lh.is_want_job || '—' },
                ]}
              />
            )}
          </section>

          <section>
            <h3 className="eyebrow mb-2">การสอบในหลักสูตรนี้</h3>
            <div className="space-y-2">
              {attempts.length === 0 ? (
                <p className="text-sm text-zinc-500">ยังไม่ได้เข้าสอบทฤษฎี</p>
              ) : (
                attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3.5 py-2.5">
                    <div className="min-w-0 text-sm">
                      <div className="font-medium text-zinc-900">
                        ทฤษฎี · {a.status === 'in_progress' ? 'กำลังทำ' : `${num(a.score)}/${num(a.max_score)} คะแนน (${num(a.percent, 1)}%)`}
                      </div>
                      <div className="text-xs text-zinc-500">{thaiDateTime(a.submitted_at || a.started_at)}</div>
                    </div>
                    {a.status === 'in_progress' ? (
                      <Badge tone="blue">กำลังสอบ</Badge>
                    ) : a.needs_review ? (
                      <Badge tone="violet">รอตรวจข้อเขียน</Badge>
                    ) : (
                      <PassFail passed={a.passed} />
                    )}
                  </div>
                ))
              )}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm">
                <span className="font-medium text-zinc-900">รอบสอบปฏิบัติ</span>
                <span className="text-zinc-600">{round ? `${round.name}${round.exam_date ? ` · ${thaiDate(round.exam_date)}` : ''}` : 'ยังไม่จัดรอบ'}</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
