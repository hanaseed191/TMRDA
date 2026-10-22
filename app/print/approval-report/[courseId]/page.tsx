'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import { buildCourseResults } from '@/lib/results';
import { APPROVAL_LABEL, fullName, thaiDate, thaiDateRange } from '@/lib/format';
import { REQUIRED_EVALUATORS } from '@/lib/scoring';
import { FullPageLoader } from '@/lib/auth';
import { Button, Segmented } from '@/components/ui';
import PrintToolbar, { PrintMessage } from '@/components/print/PrintToolbar';
import ApprovalReport, { toReportRow, type ReportRow } from '@/components/print/ApprovalReport';
import { downloadCsv } from '@/components/results/util';

type Scope = 'sent' | 'all';

export default function ApprovalReportPage({ params }: { params: { courseId: string } }) {
  const me = useUser();
  const courseId = Number(params.courseId);
  const allowed = me.role === 'admin' || me.role === 'director';
  const { data, loading, error } = useLoad(() => buildCourseResults(courseId), [courseId]);
  const [scope, setScope] = useState<Scope | null>(null);

  if (!allowed) return <PrintMessage title="ไม่มีสิทธิ์เข้าถึงเอกสารนี้" description="เฉพาะเจ้าหน้าที่และผู้อำนวยการ" />;
  if (loading) return <FullPageLoader label="กำลังเตรียมบัญชีรายชื่อ…" />;
  if (error || !data) return <PrintMessage title="โหลดข้อมูลไม่สำเร็จ" description={error || undefined} />;

  const all = data.rows.map(toReportRow);
  const sent = all.filter((x) => x.r.application.approval_status !== 'none');
  // Default: what was actually sent to the director; fall back to everyone (draft) before sending.
  const effective: Scope = scope ?? (sent.length > 0 ? 'sent' : 'all');
  const rows = effective === 'sent' ? sent : all;

  const exportExcel = () => exportReport(data.course.course_name, data, rows);

  return (
    <>
      <style>{`@media print { @page { size: A4 landscape; margin: 0; } }`}</style>
      <PrintToolbar
        title="บัญชีรายชื่อและผลการทดสอบ (เสนออนุมัติ)"
        hint={`${data.course.course_name} · ${rows.length} คน`}
        disabled={rows.length === 0}
        actions={
          <>
            <Segmented<Scope>
              size="sm"
              className="hidden md:inline-flex"
              value={effective}
              onChange={setScope}
              options={[
                { value: 'sent', label: `ส่งอนุมัติแล้ว ${sent.length}` },
                { value: 'all', label: `ทั้งหมด ${all.length}` },
              ]}
            />
            <Button variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcel} disabled={rows.length === 0}>
              <span className="hidden sm:inline">ส่งออก Excel</span>
            </Button>
          </>
        }
      />
      {rows.length === 0 ? (
        <PrintMessage
          title="ยังไม่มีรายชื่อ"
          description={effective === 'sent' ? 'ยังไม่ได้ส่งผลของหลักสูตรนี้ให้ผู้อำนวยการ — เลือก “ทั้งหมด” เพื่อดูฉบับร่าง' : 'หลักสูตรนี้ยังไม่มีผู้มีสิทธิ์สอบ'}
        />
      ) : (
        <div className="overflow-x-auto py-8 print:overflow-visible print:p-0">
          <ApprovalReport data={data} rows={rows} />
        </div>
      )}
    </>
  );
}

function exportReport(courseName: string, data: Awaited<ReturnType<typeof buildCourseResults>>, rows: ReportRow[]) {
  const c = data.course;
  const hasTheory = data.theoryForms.length > 0;
  const hasPractical = data.practicalForms.length > 0;
  const header = [
    'ลำดับ',
    'ชื่อ-สกุล',
    'เลขประจำตัวประชาชน',
    ...(hasTheory ? ['ภาคทฤษฎี', 'ทฤษฎีเต็ม'] : []),
    ...(hasPractical ? [...Array.from({ length: REQUIRED_EVALUATORS }, (_, i) => `ผู้ประเมิน ${i + 1}`), 'ปฏิบัติเฉลี่ย', 'ปฏิบัติเต็ม'] : []),
    'ผล',
    'สถานะอนุมัติ',
    'เลขที่ใบประกาศ',
    'ผู้อนุมัติ',
    'วันที่อนุมัติ',
  ];
  const body = rows.map((x, i) => {
    const a = x.r.application;
    const evs = x.r.practical?.evaluators || [];
    return [
      i + 1,
      fullName(x.r.user),
      x.r.user?.th_human_number,
      ...(hasTheory ? [x.theoryScore, x.theoryMax] : []),
      ...(hasPractical
        ? [
            ...Array.from({ length: REQUIRED_EVALUATORS }, (_, k) => (evs[k]?.score?.status === 'submitted' ? evs[k].score!.total : '')),
            x.practicalScore,
            x.practicalMax,
          ]
        : []),
      x.passed === true ? 'ผ่าน' : x.passed === false ? 'ไม่ผ่าน' : 'รอผล',
      APPROVAL_LABEL[a.approval_status],
      a.certificate_no || '',
      a.approved_by_name || '',
      a.approved_at ? thaiDate(a.approved_at) : '',
    ];
  });
  const passed = rows.filter((x) => x.passed === true).length;
  const meta: (string | number)[][] = [
    ['บัญชีรายชื่อและผลการทดสอบมาตรฐานฝีมือแรงงาน (เสนออนุมัติ)'],
    ['หน่วยงาน', c.agency_name || ''],
    ['หลักสูตร', c.course_name, 'ระดับ', c.level_name || '', 'สาขา', c.branch_name || ''],
    ['ระยะเวลา', thaiDateRange(c.startswith_date, c.endswith_date), 'ชั่วโมง', c.traning_hours],
    ['ผู้เข้าทดสอบ', rows.length, 'ผ่าน', passed, 'ไม่ผ่าน', rows.filter((x) => x.passed === false).length],
    [],
  ];
  downloadCsv(`บัญชีเสนออนุมัติ-${courseName}.csv`, meta[0] as string[], [...meta.slice(1), header, ...body]);
}
