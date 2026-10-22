/* eslint-disable @next/next/no-img-element */
import type { CourseResults, CandidateResult } from '@/lib/results';
import { formatCitizenId, fullName, num, thaiDate, thaiDateRange, APPROVAL_LABEL } from '@/lib/format';
import { REQUIRED_EVALUATORS } from '@/lib/scoring';

// "บัญชีรายชื่อและผลการทดสอบ เสนอเพื่อพิจารณาอนุมัติ" — the per-course document staff send to
// the director. Official values (snapshot sent for approval) are used when available.

export interface ReportRow {
  r: CandidateResult;
  theoryScore: number | null;
  theoryMax: number | null;
  practicalScore: number | null;
  practicalMax: number | null;
  passed: boolean | null;
}

/** Use the frozen snapshot once results were sent to the director; live values before that. */
export function toReportRow(r: CandidateResult): ReportRow {
  const a = r.application;
  const official = a.approval_status !== 'none';
  return {
    r,
    theoryScore: official ? (a.theory_score ?? null) : (r.theory?.score ?? null),
    theoryMax: official ? (a.theory_max ?? null) : (r.theory?.max ?? null),
    practicalScore: official ? (a.practical_score ?? null) : (r.practical?.score ?? null),
    practicalMax: official ? (a.practical_max ?? null) : (r.practical?.max ?? null),
    passed: official ? (a.result_status === 'passed' ? true : a.result_status === 'failed' ? false : null) : r.final.status === 'passed' ? true : r.final.status === 'failed' ? false : null,
  };
}

const cell = 'border border-zinc-800 px-1.5 py-1 align-middle';
const head = `${cell} bg-zinc-100 font-bold text-center`;

export default function ApprovalReport({ data, rows }: { data: CourseResults; rows: ReportRow[] }) {
  const { course } = data;
  const theoryForm = data.theoryForms[0];
  const practicalForm = data.practicalForms[0];
  const hasTheory = data.theoryForms.length > 0;
  const hasPractical = data.practicalForms.length > 0;
  const passed = rows.filter((x) => x.passed === true).length;
  const failed = rows.filter((x) => x.passed === false).length;
  const approved = rows.filter((x) => x.r.application.approval_status === 'approved');
  const approver = approved[0]?.r.application;
  const submittedAt = rows.map((x) => x.r.application.submitted_at).filter(Boolean).sort().pop();
  const rounds = data.rounds.filter((rd) => rows.some((x) => x.r.application.practical_round_id === rd.id));
  const evaluators = data.evaluators.filter((e) => rounds.some((rd) => rd.evaluator_ids.includes(e.id)));

  return (
    <div className="print-area mx-auto bg-white font-doc text-zinc-950 shadow-lift" style={{ width: '297mm', minHeight: '210mm', padding: '10mm 12mm', fontSize: '10.5pt', lineHeight: 1.35 }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <img src="/logo.jpeg" alt="" style={{ width: '18mm', height: '18mm' }} className="shrink-0 object-contain" />
        <div className="flex-1 text-center">
          <div style={{ fontSize: '14pt', fontWeight: 700 }}>บัญชีรายชื่อและผลการทดสอบมาตรฐานฝีมือแรงงาน</div>
          <div style={{ fontSize: '12pt', fontWeight: 600 }}>เสนอผู้อำนวยการเพื่อพิจารณาอนุมัติผลและออกใบประกาศนียบัตร</div>
          <div className="mt-0.5">{course.agency_name || 'กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน'}</div>
        </div>
        <div className="shrink-0 text-right" style={{ width: '18mm', fontSize: '9pt' }}>
          {approver ? 'อนุมัติแล้ว' : rows.some((x) => x.r.application.approval_status === 'submitted') ? 'รออนุมัติ' : 'ร่าง'}
        </div>
      </div>

      {/* Course info */}
      <table className="mt-4 w-full border-collapse" style={{ fontSize: '10pt' }}>
        <tbody>
          <tr>
            <td className={`${cell} w-[16%] bg-zinc-50 font-bold`}>หลักสูตร / สาขา</td>
            <td className={cell} colSpan={3}>
              {course.course_name}
              {course.course_name_en && <span className="text-zinc-600"> ({course.course_name_en})</span>}
              {course.branch_name && ` · สาขา${course.branch_name}`}
            </td>
            <td className={`${cell} w-[10%] bg-zinc-50 font-bold`}>ระดับ</td>
            <td className={`${cell} w-[12%]`}>{course.level_name || '—'}</td>
          </tr>
          <tr>
            <td className={`${cell} bg-zinc-50 font-bold`}>ระยะเวลา</td>
            <td className={cell}>
              {thaiDateRange(course.startswith_date, course.endswith_date)} · {num(course.traning_hours)} ชั่วโมง
            </td>
            <td className={`${cell} w-[12%] bg-zinc-50 font-bold`}>สถานที่</td>
            <td className={cell}>{course.location || '—'}</td>
            <td className={`${cell} bg-zinc-50 font-bold`}>ผู้เข้าทดสอบ</td>
            <td className={cell}>{rows.length} คน</td>
          </tr>
          <tr>
            <td className={`${cell} bg-zinc-50 font-bold`}>เกณฑ์การผ่าน</td>
            <td className={cell} colSpan={5}>
              {hasTheory && `ภาคทฤษฎีไม่ต่ำกว่าร้อยละ ${num(theoryForm?.passing_percentage, 0)}`}
              {hasTheory && hasPractical && ' และ '}
              {hasPractical &&
                `ภาคปฏิบัติไม่ต่ำกว่าร้อยละ ${num(practicalForm?.passing_percentage, 0)} (คะแนนภาคปฏิบัติ = ผลรวมคะแนนจากผู้ประเมิน ÷ จำนวนผู้ประเมิน ${REQUIRED_EVALUATORS} ท่าน)`}
              {hasTheory && hasPractical && ' — ต้องผ่านทั้งสองภาค'}
            </td>
          </tr>
          {rounds.length > 0 && (
            <tr>
              <td className={`${cell} bg-zinc-50 font-bold`}>รอบสอบปฏิบัติ</td>
              <td className={cell} colSpan={5}>
                {rounds.map((rd) => `${rd.name} (${rd.exam_date ? thaiDate(rd.exam_date) : 'ไม่ระบุวัน'}${rd.location ? ` · ${rd.location}` : ''})`).join(' · ')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Candidates */}
      <table className="mt-4 w-full border-collapse" style={{ fontSize: '10pt' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            <th className={head} rowSpan={2} style={{ width: '4%' }}>ลำดับ</th>
            <th className={head} rowSpan={2}>ชื่อ-สกุล</th>
            <th className={head} rowSpan={2} style={{ width: '14%' }}>เลขประจำตัวประชาชน</th>
            {hasTheory && (
              <th className={head} rowSpan={2} style={{ width: '9%' }}>
                ภาคทฤษฎี
                <div className="font-normal">({num(rows[0]?.theoryMax ?? theoryForm?.total_score)} คะแนน)</div>
              </th>
            )}
            {hasPractical && (
              <th className={head} colSpan={REQUIRED_EVALUATORS + 1}>
                ภาคปฏิบัติ ({num(rows.find((x) => x.practicalMax)?.practicalMax ?? practicalForm?.total_score)} คะแนน)
              </th>
            )}
            <th className={head} rowSpan={2} style={{ width: '7%' }}>ผล</th>
            <th className={head} rowSpan={2} style={{ width: '14%' }}>เลขที่ใบประกาศ</th>
          </tr>
          {hasPractical && (
            <tr>
              {Array.from({ length: REQUIRED_EVALUATORS }).map((_, i) => (
                <th key={i} className={head} style={{ width: '6%' }}>
                  ผู้ประเมิน {i + 1}
                </th>
              ))}
              <th className={head} style={{ width: '7%' }}>เฉลี่ย</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((x, i) => {
            const evs = x.r.practical?.evaluators || [];
            return (
              <tr key={x.r.application.id} style={{ breakInside: 'avoid' }}>
                <td className={`${cell} text-center`}>{i + 1}</td>
                <td className={cell}>{fullName(x.r.user)}</td>
                <td className={`${cell} text-center tabular-nums`}>{formatCitizenId(x.r.user?.th_human_number)}</td>
                {hasTheory && <td className={`${cell} text-center tabular-nums`}>{x.theoryScore === null ? '—' : num(x.theoryScore)}</td>}
                {hasPractical && (
                  <>
                    {Array.from({ length: REQUIRED_EVALUATORS }).map((_, k) => {
                      const s = evs[k]?.score;
                      return (
                        <td key={k} className={`${cell} text-center tabular-nums`}>
                          {s && s.status === 'submitted' ? num(s.total) : '—'}
                        </td>
                      );
                    })}
                    <td className={`${cell} text-center font-bold tabular-nums`}>{x.practicalScore === null ? '—' : num(x.practicalScore)}</td>
                  </>
                )}
                <td className={`${cell} text-center font-bold`}>{x.passed === true ? 'ผ่าน' : x.passed === false ? 'ไม่ผ่าน' : 'รอผล'}</td>
                <td className={`${cell} text-center tabular-nums`} style={{ fontSize: '9pt' }}>
                  {x.r.application.certificate_no || (x.r.application.approval_status !== 'approved' ? APPROVAL_LABEL[x.r.application.approval_status] : '—')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-2 flex justify-between" style={{ fontSize: '10pt' }}>
        <span>
          สรุป: ผู้เข้าทดสอบ {rows.length} คน · ผ่าน {passed} คน · ไม่ผ่าน {failed} คน
          {rows.length > 0 && ` · คิดเป็นผู้ผ่านร้อยละ ${num((passed / rows.length) * 100, 1)}`}
        </span>
        <span className="text-zinc-600">พิมพ์เมื่อ {thaiDate(new Date(), { full: true })}</span>
      </div>

      {/* Signatures */}
      <div className="mt-8 grid gap-6" style={{ gridTemplateColumns: evaluators.length ? '1.4fr 1fr 1fr' : '1fr 1fr', breakInside: 'avoid' }}>
        {evaluators.length > 0 && (
          <div>
            <div className="mb-2 font-bold">คณะผู้ประเมินภาคปฏิบัติ</div>
            {evaluators.map((e, i) => (
              <div key={e.id} className="mt-5">
                {i + 1}. ลงชื่อ ................................................ ผู้ประเมิน
                <div className="pl-12">({fullName(e)})</div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center">
          <div className="mb-2 font-bold">ผู้เสนอ</div>
          <div className="mt-10">ลงชื่อ ................................................</div>
          <div>(................................................)</div>
          <div>เจ้าหน้าที่ผู้รับผิดชอบหลักสูตร</div>
          <div>วันที่ {submittedAt ? thaiDate(submittedAt, { full: true }) : '........./........./.........'}</div>
        </div>
        <div className="text-center">
          <div className="mb-2 font-bold">ผู้อนุมัติ</div>
          <div className="mt-2">{approver ? '☑ อนุมัติ' : '☐ อนุมัติ    ☐ ไม่อนุมัติ'}</div>
          <div className="mt-6">ลงชื่อ ................................................</div>
          <div>({approver?.approved_by_name || '................................................'})</div>
          <div>{approver?.approved_by_title || 'ผู้อำนวยการ'}</div>
          <div>วันที่ {approver?.approved_at ? thaiDate(approver.approved_at, { full: true }) : '........./........./.........'}</div>
        </div>
      </div>
    </div>
  );
}
