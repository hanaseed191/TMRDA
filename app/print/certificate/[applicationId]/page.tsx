'use client';

/* eslint-disable @next/next/no-img-element */
import { useParams } from 'next/navigation';
import { applications, courses, users } from '@/lib/api';
import { FullPageLoader, useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import { fullName, fullNameEn, num, thaiDate } from '@/lib/format';
import { pct } from '@/lib/scoring';
import PrintToolbar, { PrintMessage } from '@/components/print/PrintToolbar';

const BRAND = '#b91c1c';
const GOLD = '#a16207';

function Corner({ className }: { className: string }) {
  return (
    <svg className={`absolute h-[18mm] w-[18mm] ${className}`} viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M2 58V14C2 7.4 7.4 2 14 2h44" stroke={GOLD} strokeWidth="1.4" />
      <path d="M8 58V18c0-5.5 4.5-10 10-10h40" stroke={BRAND} strokeWidth="0.8" />
      <circle cx="14" cy="14" r="3" fill={BRAND} />
    </svg>
  );
}

function Seal() {
  const text = 'TMRDA · CERTIFIED · SKILL STANDARD · ';
  return (
    <svg viewBox="0 0 120 120" className="h-[30mm] w-[30mm]" aria-hidden>
      <defs>
        <path id="seal-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke={BRAND} strokeWidth="2" />
      <circle cx="60" cy="60" r="51" fill="none" stroke={BRAND} strokeWidth="0.6" />
      <circle cx="60" cy="60" r="34" fill="none" stroke={BRAND} strokeWidth="0.6" />
      <text fill={BRAND} fontSize="8.6" letterSpacing="1.6" fontFamily="var(--font-display)">
        <textPath href="#seal-circle">{text + text.slice(0, 6)}</textPath>
      </text>
      <path d="M44 61l11 11 22-24" fill="none" stroke={BRAND} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CertificatePage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const me = useUser();
  const { data, loading, error } = useLoad(async () => {
    const app = await applications.get(Number(applicationId));
    const [course, user] = await Promise.all([courses.get(app.training_id), users.get(app.user_id)]);
    return { app, course, user };
  }, [applicationId]);

  if (loading) return <FullPageLoader label="กำลังเตรียมใบประกาศ…" />;
  if (error || !data) return <PrintMessage title="ไม่พบใบประกาศ" description={error || undefined} />;

  const { app, course, user } = data;
  const canView = me.id === app.user_id || me.role === 'admin' || me.role === 'director';
  if (!canView) return <PrintMessage title="ไม่มีสิทธิ์เข้าถึงใบประกาศนี้" description="ใบประกาศเปิดดูได้เฉพาะเจ้าของ เจ้าหน้าที่ และผู้อำนวยการ" />;
  if (app.approval_status !== 'approved' || !app.certificate_no) {
    return (
      <PrintMessage
        title="ใบประกาศยังไม่พร้อม"
        description="ใบประกาศจะออกให้เมื่อผลการสอบผ่านเกณฑ์และได้รับการอนุมัติจากผู้อำนวยการแล้ว"
      />
    );
  }

  const nameEn = fullNameEn(user);
  const action = app.is_skill_testing ? 'ได้ผ่านการทดสอบมาตรฐานฝีมือแรงงาน' : 'ได้ผ่านการฝึกอบรมและการทดสอบ';
  const parts = [
    app.theory_max ? { label: 'ภาคทฤษฎี', score: app.theory_score, max: app.theory_max } : null,
    app.practical_max ? { label: 'ภาคปฏิบัติ', score: app.practical_score, max: app.practical_max } : null,
  ].filter(Boolean) as { label: string; score: number | null | undefined; max: number }[];

  return (
    <>
      <style>{`@media print { @page { size: A4 landscape; margin: 0; } }`}</style>
      <PrintToolbar title={`ใบประกาศนียบัตร · ${fullName(user)}`} hint={`เลขที่ ${app.certificate_no}`} />

      <div className="overflow-x-auto py-8 print:overflow-visible print:p-0">
        <div
          className="print-area relative mx-auto box-border overflow-hidden bg-surface text-zinc-900 shadow-lift"
          style={{ width: '297mm', height: '210mm', padding: '9mm' }}
        >
          {/* subtle guilloche background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 46%, rgba(185,28,28,0.05), transparent 55%),
                repeating-radial-gradient(circle at 50% 46%, rgba(161,98,7,0.045) 0 1px, transparent 1px 7px)`,
            }}
          />
          {/* frame */}
          <div className="relative h-full w-full" style={{ border: `2.2px solid ${BRAND}`, padding: '2.2mm' }}>
            <div className="relative flex h-full w-full flex-col items-center" style={{ border: `0.8px solid ${GOLD}`, padding: '9mm 18mm 8mm' }}>
              <Corner className="left-[2mm] top-[2mm]" />
              <Corner className="right-[2mm] top-[2mm] rotate-90" />
              <Corner className="bottom-[2mm] right-[2mm] rotate-180" />
              <Corner className="bottom-[2mm] left-[2mm] -rotate-90" />

              <img src="/logo.jpeg" alt="" className="h-[22mm] w-[22mm] object-contain" />
              <p className="mt-2 font-doc text-[13pt] font-semibold tracking-wide text-zinc-700">{course.agency_name}</p>

              <h1 className="mt-3 font-display text-[34pt] font-semibold leading-none" style={{ color: BRAND }}>
                ประกาศนียบัตร
              </h1>
              <p className="mt-2 font-display text-[10pt] uppercase tracking-[0.42em] text-zinc-500">Certificate of Achievement</p>

              <p className="mt-5 font-doc text-[14pt] text-zinc-600">ให้ไว้เพื่อแสดงว่า</p>
              <p className="mt-1.5 font-doc text-[28pt] font-bold leading-tight text-zinc-950">{fullName(user)}</p>
              {nameEn && <p className="font-display text-[12pt] tracking-wide text-zinc-500">{nameEn}</p>}
              <div className="mt-2 h-px w-[120mm]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

              <p className="mt-3 max-w-[210mm] text-center font-doc text-[14pt] leading-snug text-zinc-800">
                {action} หลักสูตร <b className="text-zinc-950">{course.course_name}</b>
                {course.level_name && <> {course.level_name}</>}
                {course.traning_hours > 0 && <> จำนวน {num(course.traning_hours, 0)} ชั่วโมง</>}
              </p>

              {parts.length > 0 && (
                <div className="mt-3 flex items-center gap-6 font-doc text-[11pt] text-zinc-600">
                  {parts.map((p) => (
                    <span key={p.label}>
                      {p.label} <b className="text-zinc-900">{num(p.score)}</b>/{num(p.max)} คะแนน ({num(pct(Number(p.score), p.max), 1)}%)
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 font-doc text-[12.5pt] text-zinc-700">ให้ไว้ ณ วันที่ {thaiDate(app.approved_at, { full: true })}</p>

              {/* footer: certificate no · seal · signature */}
              <div className="mt-auto grid w-full grid-cols-3 items-end">
                <div className="font-doc text-[9.5pt] leading-relaxed text-zinc-500">
                  <div>
                    เลขที่ <span className="font-semibold tracking-wide text-zinc-800">{app.certificate_no}</span>
                  </div>
                  <div>ตรวจสอบได้ที่ระบบ TMRDA ด้วยเลขที่ใบประกาศ</div>
                </div>
                <div className="flex justify-center opacity-90">
                  <Seal />
                </div>
                <div className="text-center font-doc">
                  <div className="mx-auto mb-1 h-[12mm] w-[62mm] border-b border-dotted border-zinc-500" />
                  <div className="text-[12pt] font-semibold text-zinc-900">({app.approved_by_name || '—'})</div>
                  <div className="text-[11pt] text-zinc-600">{app.approved_by_title || 'ผู้อำนวยการ'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
