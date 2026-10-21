import type { ApprovalStatus, EnrollmentStatus, ResultStatus, Role, User } from './types';

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function toDate(v?: string | Date | null): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  // Date-only strings are local calendar dates, not UTC midnight.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 21 ต.ค. 2569 */
export function thaiDate(v?: string | Date | null, opts: { full?: boolean } = {}): string {
  const d = toDate(v);
  if (!d) return '—';
  const months = opts.full ? TH_MONTHS_FULL : TH_MONTHS;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** 21 ต.ค. 2569 · 14:05 น. */
export function thaiDateTime(v?: string | Date | null): string {
  const d = toDate(v);
  if (!d) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${thaiDate(d)} · ${hh}:${mm} น.`;
}

export function thaiDateRange(a?: string | null, b?: string | null): string {
  const da = toDate(a);
  const db = toDate(b);
  if (!da && !db) return '—';
  if (!da || !db) return thaiDate(da || db);
  if (da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()) {
    return `${da.getDate()}–${db.getDate()} ${TH_MONTHS[db.getMonth()]} ${db.getFullYear() + 543}`;
  }
  return `${thaiDate(da)} – ${thaiDate(db)}`;
}

/** 'YYYY-MM-DD' for <input type="date"> */
export function toDateInput(v?: string | Date | null): string {
  const d = toDate(v);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DDTHH:mm' for <input type="datetime-local"> */
export function toDateTimeInput(v?: string | null): string {
  const d = toDate(v);
  if (!d) return '';
  return `${toDateInput(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Legacy `between_date` column format: DD/MM/YYYY - DD/MM/YYYY */
export function legacyBetween(start?: string | null, end?: string | null): string {
  const f = (v?: string | null) => {
    const d = toDate(v);
    return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '';
  };
  return [f(start), f(end)].filter(Boolean).join(' - ');
}

export function relativeTime(v?: string | null): string {
  const d = toDate(v);
  if (!d) return '—';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return thaiDate(d);
}

export function fullName(u?: Pick<User, 'title_th' | 'first_name_th' | 'last_name_th'> | null): string {
  if (!u) return '—';
  return `${u.title_th || ''}${u.first_name_th} ${u.last_name_th}`.trim();
}

export function fullNameEn(u?: Pick<User, 'title_en' | 'first_name_en' | 'last_name_en'> | null): string {
  if (!u || !u.first_name_en) return '';
  return `${u.title_en ? u.title_en + ' ' : ''}${u.first_name_en} ${u.last_name_en || ''}`.trim();
}

export function initials(u?: Pick<User, 'first_name_th' | 'last_name_th'> | null): string {
  if (!u) return '?';
  return `${u.first_name_th?.[0] || ''}${u.last_name_th?.[0] || ''}` || '?';
}

/** 1-2345-67890-12-3 */
export function formatCitizenId(id?: string | null): string {
  const s = String(id || '').replace(/\D/g, '');
  if (s.length !== 13) return id || '—';
  return `${s[0]}-${s.slice(1, 5)}-${s.slice(5, 10)}-${s.slice(10, 12)}-${s[12]}`;
}

/** Thai national ID checksum (mod 11). */
export function isValidCitizenId(id: string): boolean {
  const s = id.replace(/\D/g, '');
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(s[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(s[12]);
}

export function formatPhone(p?: string | null): string {
  const s = String(p || '').replace(/\D/g, '');
  if (s.length === 10) return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
  if (s.length === 9) return `${s.slice(0, 2)}-${s.slice(2, 5)}-${s.slice(5)}`;
  return p || '—';
}

export function num(n?: number | null, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('th-TH', { maximumFractionDigits: digits });
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ---------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------

export const ROLE_LABEL: Record<Role, string> = {
  user: 'ผู้สมัคร',
  admin: 'เจ้าหน้าที่ / ผู้ดูแลระบบ',
  director: 'ผู้อำนวยการ',
  evaluator: 'ผู้ประเมิน',
};

export const ENROLLMENT_LABEL: Record<EnrollmentStatus, string> = {
  รอพิจารณา: 'รอตรวจสอบใบสมัคร',
  อนุมัติ: 'มีสิทธิ์สอบ',
  ปฏิเสธ: 'ไม่ผ่านการคัดเลือก',
};

export const RESULT_LABEL: Record<ResultStatus, string> = {
  pending: 'รอผล',
  passed: 'ผ่าน',
  failed: 'ไม่ผ่าน',
};

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  none: 'ยังไม่ส่งอนุมัติ',
  submitted: 'รอผู้อำนวยการอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ส่งกลับแก้ไข',
};

/** Map a Supabase / RPC error to a Thai message a person can act on. */
export function errorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : typeof e === 'string' ? e : (e as { message?: string })?.message || '';
  const map: Record<string, string> = {
    INVALID_CREDENTIALS: 'เลขบัตรประชาชน/อีเมล หรือรหัสผ่านไม่ถูกต้อง',
    ACCOUNT_DISABLED: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าหน้าที่',
    SESSION_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
    DUPLICATE_ID: 'เลขบัตรประชาชนนี้ลงทะเบียนไว้แล้ว',
    DUPLICATE_EMAIL: 'อีเมลนี้ถูกใช้ลงทะเบียนแล้ว',
    WEAK_PASSWORD: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    INVALID_ID: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
    FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
    CANNOT_DEMOTE_SELF: 'ไม่สามารถลดสิทธิ์ผู้ดูแลระบบของตัวเองได้',
    NOT_FOUND: 'ไม่พบข้อมูล',
    NOT_ELIGIBLE: 'คุณยังไม่มีสิทธิ์สอบในหลักสูตรนี้ (รอเจ้าหน้าที่อนุมัติใบสมัคร)',
    EXAM_CLOSED: 'ข้อสอบชุดนี้ยังไม่เปิดหรือปิดรับการสอบแล้ว',
    ATTEMPT_IN_PROGRESS: 'คุณมีข้อสอบที่ทำค้างอยู่ กรุณาทำให้เสร็จก่อน',
    NO_ATTEMPTS_LEFT: 'ใช้สิทธิ์สอบครบตามจำนวนที่กำหนดแล้ว',
    ATTEMPT_CLOSED: 'ข้อสอบนี้ส่งไปแล้ว ไม่สามารถแก้ไขคำตอบได้',
    ATTEMPT_EXPIRED: 'หมดเวลาสอบแล้ว ระบบจะใช้คำตอบที่บันทึกไว้ก่อนหมดเวลา',
  };
  for (const key of Object.keys(map)) if (raw.includes(key)) return map[key];
  if (/Could not find the function|schema cache|does not exist|column .* of relation/i.test(raw)) {
    return 'ฐานข้อมูลยังไม่ได้อัปเดต — กรุณารันไฟล์ supabase/migrations/001_tmrda_v2.sql ใน Supabase SQL Editor';
  }
  if (/Failed to fetch|NetworkError/i.test(raw)) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
  return raw || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}
