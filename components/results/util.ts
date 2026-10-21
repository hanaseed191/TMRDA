import type { CandidateResult } from '@/lib/results';
import { fullName, RESULT_LABEL, APPROVAL_LABEL } from '@/lib/format';

export { num } from '@/lib/format';
export { pct } from '@/lib/scoring';

/** CSV with a UTF-8 BOM so Excel opens Thai text correctly. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? '' : String(v);
    // Neutralise spreadsheet formulas in text cells (CSV / formula injection).
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function resultsCsv(courseName: string, rows: CandidateResult[]) {
  downloadCsv(
    `ผลคะแนน-${courseName}.csv`,
    ['ลำดับ', 'ชื่อ-นามสกุล', 'เลขบัตรประชาชน', 'ทฤษฎี', 'ทฤษฎีเต็ม', 'ทฤษฎี %', 'ปฏิบัติ (เฉลี่ย)', 'ปฏิบัติเต็ม', 'ผู้ประเมินส่งแล้ว', 'ผลรวม', 'สถานะอนุมัติ', 'เลขที่ใบประกาศ'],
    rows.map((r, i) => [
      i + 1,
      fullName(r.user),
      r.user?.th_human_number,
      r.theory?.score ?? '',
      r.theory?.max ?? '',
      r.theory?.percent ?? '',
      r.practical?.average?.average ?? '',
      r.practical?.max ?? '',
      r.practical ? `${r.practical.average?.submitted ?? 0}/${r.practical.evaluators.length}` : '',
      RESULT_LABEL[r.final.status],
      APPROVAL_LABEL[r.application.approval_status || 'none'],
      r.application.certificate_no || '',
    ])
  );
}
