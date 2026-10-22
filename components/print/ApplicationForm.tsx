/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { DISABILITY_TYPES } from '@/lib/constants';
import type { LaborHistory, TrainingApplication, TrainingCourse, User } from '@/lib/types';

// Official DSD application form (ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน),
// laid out row by row after the original template (PDF.pdf). Every value comes from the
// database — missing data is left as a blank dotted line, never invented.

const INK = '#1e3a8a'; // filled-in values look like blue pen on the printed form
const ROW = '6.55mm';

function beDate(v?: string | null): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
}

/** Shrinks its text until it fits (long e-mail addresses, long course names, …). */
function useFitText<T extends HTMLElement>(deps: unknown[], minPt = 7) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      const min = (minPt * 96) / 72;
      while (el.scrollWidth > el.clientWidth + 0.5 && size > min) {
        size -= 0.25;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    document.fonts?.ready.then(fit).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** One printed line of the form. Shrinks slightly if its content is wider than the page. */
function Line({ children, indent = 0, bold, gap = 6, style }: { children: React.ReactNode; indent?: number; bold?: boolean; gap?: number; style?: React.CSSProperties }) {
  const ref = useFitText<HTMLDivElement>([children], 8.5);
  return (
    <div
      ref={ref}
      className="flex items-end overflow-hidden whitespace-nowrap"
      style={{ height: ROW, paddingLeft: `${indent}mm`, columnGap: gap, fontWeight: bold ? 700 : undefined, ...style }}
    >
      {children}
    </div>
  );
}

/** Dotted fill-in line that stretches (`grow`) to share the remaining width. */
function Fill({ value, grow = 1, min = 8, center = true }: { value?: string | number | null; grow?: number; min?: number; center?: boolean }) {
  const text = value === null || value === undefined ? '' : String(value).trim();
  const ref = useFitText<HTMLSpanElement>([text], 6.5);
  return (
    <span
      ref={ref}
      className="block overflow-hidden whitespace-nowrap"
      style={{
        flex: `${grow} 1 0`,
        minWidth: `${min}mm`,
        borderBottom: '1px dotted #3f3f46',
        lineHeight: 1.25,
        paddingInline: 3,
        textAlign: center ? 'center' : 'left',
        color: INK,
        fontWeight: 600,
      }}
    >
      {text || ' '}
    </span>
  );
}

function Box({ checked, label, bold }: { checked: boolean; label?: React.ReactNode; bold?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-end" style={{ columnGap: 3, fontWeight: bold ? 700 : undefined }}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ width: '3.3mm', height: '3.3mm', border: '1px solid #27272a', marginBottom: '0.6mm' }}
      >
        {checked && (
          <span style={{ position: 'absolute', top: '-1.6mm', left: '0.2mm', color: INK, fontSize: '12pt', fontWeight: 800, lineHeight: 1 }}>✓</span>
        )}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

/** "( )" style option used by the form for sub-categories. */
function Paren({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-end">
      (<span style={{ display: 'inline-block', width: '3mm', textAlign: 'center', color: INK, fontWeight: 800 }}>{checked ? '✓' : ' '}</span>) {label}
    </span>
  );
}

const T = ({ children, bold }: { children: React.ReactNode; bold?: boolean }) => (
  <span className="shrink-0" style={{ fontWeight: bold ? 700 : undefined }}>
    {children}
  </span>
);

export default function ApplicationForm({
  user,
  labor,
  course,
  application,
}: {
  user: User;
  labor: LaborHistory | null;
  course: TrainingCourse | null;
  application: TrainingApplication | null;
}) {
  const edu = user.education_level || '';
  const disabled = user.physical_id === 2;
  const disabilities = new Set(
    String(user.disability_types || '')
      .split(/[,|;]/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const hasJob = labor?.is_have_job === 'ทำงาน';
  const noJob = labor?.is_have_job === 'ไม่ทำงานหรือว่างงาน';
  const applicant = application?.applicant_type || '';
  const salary = (v: string) => hasJob && (labor?.labor_salary || '').replace(/[\s–-]/g, '') === v.replace(/[\s–-]/g, '');
  const status = (v: string) => hasJob && labor?.labor_status === v;
  const industry = (v: string) => hasJob && labor?.industrial_groups_working === v;
  const notJob = (v: string) => noJob && labor?.not_have_job_status === v;
  const source = (v: string) => (labor?.known_source_of_training || '').includes(v);
  const knownNotJob = ['อยู่ระหว่างหางาน', 'นักเรียน/นักศึกษา', 'ผู้ประกันตนที่ถูกเลิกจ้าง', 'ผู้ต้องขัง', 'ทหารก่อนปลด'];
  const otherNotJob = noJob && labor?.not_have_job_status && !knownNotJob.includes(labor.not_have_job_status) ? labor.not_have_job_status : '';

  const nameTh = `${user.title_th || ''}${user.first_name_th} ${user.last_name_th}`;
  const nameEn = user.first_name_en ? `${user.title_en ? user.title_en + ' ' : ''}${user.first_name_en} ${user.last_name_en || ''}` : '';
  const between = course?.startswith_date ? `${beDate(course.startswith_date)} - ${beDate(course.endswith_date)}` : '';
  const real = (v?: string | null) => (v && v !== '-' ? v : '');
  const testing = Boolean(application?.is_skill_testing);
  const wantIn = labor?.is_want_job === 'ต้องการจัดหางานในประเทศ';
  const wantAbroad = labor?.is_want_job === 'ต้องการจัดหางานในต่างประเทศ';
  const photo = user.id_photo_file_pathname && /^https?:/.test(user.id_photo_file_pathname) ? user.id_photo_file_pathname : null;

  return (
    <div
      className="print-area relative box-border overflow-hidden bg-white font-doc text-zinc-950 shadow-lift"
      style={{ width: '210mm', height: '297mm', fontSize: '10.5pt', lineHeight: 1.2, padding: '9mm 11mm 8mm' }}
    >
      {/* Photo */}
      <div
        className="absolute z-10 overflow-hidden bg-white"
        style={{ top: '7mm', right: '11mm', width: '2.6cm', height: '3.2cm', border: '1px solid #27272a' }}
      >
        {photo && <img src={photo} alt="รูปถ่าย" className="h-full w-full object-cover" />}
      </div>

      {/* Header */}
      <div className="flex items-end" style={{ paddingRight: '3cm', height: '21mm', columnGap: '4mm' }}>
        <img src="/logo.jpeg" alt="" className="shrink-0 object-contain" style={{ width: '20mm', height: '20mm' }} />
        <p className="flex-1 text-center" style={{ fontSize: '13.5pt', fontWeight: 700, paddingBottom: '1mm' }}>
          ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน
        </p>
      </div>
      <div style={{ paddingRight: '3cm' }}>
        <Line bold>
          <T>กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน หน่วยงาน:</T>
          <Fill value={course?.agency_name} />
        </Line>
      </div>

      {/* Purpose */}
      <Line gap={10} style={{ marginTop: '1.5mm' }}>
        <T>ข้าพเจ้ามีความประสงค์เข้ารับ</T>
        <T>การฝึกอบรมฝีมือแรงงาน</T>
        {['ฝึกเตรียมเข้าทำงาน', 'ฝึกยกระดับฝีมือแรงงาน', 'ฝึกอาชีพเสริม', 'ฝึกคนครัวบนเรือ'].map((t) => (
          <Box key={t} checked={application?.training_type === t} label={t} />
        ))}
      </Line>
      <Line gap={10} indent={33}>
        <T>การทดสอบฝีมือแรงงาน</T>
        <Box checked={testing} label="ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ" />
      </Line>
      <Line>
        <T>หลักสูตร (ฝึกอบรม)</T>
        <Fill value={course?.course_name} grow={5} />
        <T>จำนวนชั่วโมงฝึก</T>
        <Fill value={course?.traning_hours || ''} grow={1} />
        <T>ชั่วโมง</T>
      </Line>
      <Line>
        <T>สาขา (ทดสอบ)</T>
        <Fill value={testing ? course?.branch_name || course?.course_name : ''} grow={3} />
        <T>ระดับ (ทดสอบ)</T>
        <Fill value={testing ? course?.level_name : ''} grow={3} />
      </Line>
      <Line gap={8}>
        <T>ประเภทผู้สมัคร (ทดสอบ)</T>
        {['ผู้รับการฝึกจาก กพร.', 'จากสถานศึกษา', 'จากภาครัฐ', 'จากภาคเอกชน', 'บุคคลทั่วไป'].map((t) => (
          <Box key={t} checked={applicant === t} label={t} />
        ))}
        <T>ระหว่างวันที่</T>
        <Fill value={between} />
      </Line>

      {/* 1. Personal */}
      <Line bold style={{ marginTop: '1.5mm' }}>
        <T>1. ข้อมูลส่วนบุคคล</T>
      </Line>
      <Line>
        <T>ชื่อ-สกุล ภาษาไทย (นาย/นาง/นางสาว)</T>
        <Fill value={nameTh} grow={4} />
        <T>เพศ</T>
        <Fill value={user.sex_name} grow={1.3} />
      </Line>
      <Line>
        <T>ชื่อ-สกุล ภาษาอังกฤษ</T>
        <Fill value={nameEn} />
      </Line>
      <Line>
        <T>เลขบัตรประชาชน</T>
        <Fill value={user.th_human_number} grow={2.3} />
        <T>สัญชาติ</T>
        <Fill value={user.nationality_name} grow={0.9} />
        <T>วัน/เดือน/ปีเกิด</T>
        <Fill value={beDate(user.birth_day)} grow={1.6} />
        <T>โทรศัพท์</T>
        <Fill value={real(user.phone_number)} grow={1.7} />
        <T>อีเมล (ถ้ามี)</T>
        <Fill value={user.email} grow={2.6} />
      </Line>
      <Line>
        <T>ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ตามบัตรประชาชน เลขที่</T>
        <Fill value={real(user.house_number)} grow={1.3} />
        <T>หมู่</T>
        <Fill value={user.house_group || ''} grow={0.8} />
        <T>ถนน</T>
        <Fill value={user.road_name} grow={2} />
        <T>ซอย</T>
        <Fill value={user.alley_name} grow={2} />
      </Line>
      <Line>
        <T>แขวง/ตำบล</T>
        <Fill value={user.subdistrict_name} grow={2} />
        <T>เขต/อำเภอ</T>
        <Fill value={user.district_name} grow={2} />
        <T>จังหวัด</T>
        <Fill value={user.province_name} grow={2} />
        <T>รหัสไปรษณีย์</T>
        <Fill value={user.zip_code} grow={1.2} />
      </Line>
      <Line gap={7}>
        <T>วุฒิการศึกษาสูงสุด</T>
        <Box checked={edu === 'ประถมศึกษา'} label="ประถมศึกษา" />
        <Box checked={edu === 'มัธยมศึกษาตอนต้น'} label="มัธยมต้น" />
        <Box checked={edu === 'มัธยมศึกษาตอนปลาย'} label="มัธยมปลาย" />
        <Box checked={edu === 'อนุปริญญา'} label="อนุปริญญา" />
        <Box checked={edu === 'ประกาศนียบัตรวิชาชีพ (ปวช.)'} label="ปวช." />
        <Box checked={edu === 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)'} label="ปวส./ปวท." />
        <Box checked={['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'].includes(edu)} label="ปริญญาตรีขึ้นไป" />
        <Box checked={edu === 'ไม่จบการศึกษา'} label="ไม่จบการศึกษา" />
      </Line>
      <Line>
        <T>สาขา</T>
        <Fill value={user.branch_name} grow={1} />
        <span style={{ flex: '1.4 1 0' }} />
      </Line>
      <Line gap={7}>
        <T>สภาพร่างกาย</T>
        <Box checked={user.physical_id !== 2} label="ปกติ" />
        <Box checked={disabled} label="พิการ (" />
        {DISABILITY_TYPES.slice(0, 4).map((d) => (
          <Box key={d} checked={disabled && disabilities.has(d)} label={d} />
        ))}
      </Line>
      <Line gap={7} indent={46}>
        {DISABILITY_TYPES.slice(4).map((d, i, arr) => (
          <Box key={d} checked={disabled && disabilities.has(d)} label={i === arr.length - 1 ? `ทาง${d})` : d} />
        ))}
      </Line>

      {/* 2. Labor status */}
      <Line gap={12} indent={2} style={{ marginTop: '1mm' }}>
        <T bold>2. สถานภาพแรงงาน</T>
        <Box checked={hasJob} label="ทำงาน (กรอกข้อ 2.1)" />
        <Box checked={noJob} label="ไม่ทำงานหรือว่างงาน (กรอกข้อ 2.2)" />
      </Line>
      <Line gap={7} indent={6}>
        <T bold>2.1 ผู้มีงานทำ</T>
        <Box checked={status('ภาคเอกชน')} label="ภาคเอกชน" />
        <Box checked={status('รัฐวิสาหกิจ')} label="รัฐวิสาหกิจ" />
        <Box checked={status('ภาครัฐ')} label="ภาครัฐ" />
        {['ข้าราชการพลเรือน', 'ข้าราชการตำรวจ', 'ข้าราชการทหาร', 'ข้าราชการครู'].map((t) => (
          <Paren key={t} checked={false} label={t} />
        ))}
      </Line>
      <Line gap={7} indent={30}>
        <Box checked={status('ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ')} label="ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ" />
        {['วิสาหกิจชุมชน', 'เกษตรกร', 'ผู้รับจ้างทั่วไปโดยไม่มีนายจ้าง (Freelance)'].map((t) => (
          <Paren key={t} checked={false} label={t} />
        ))}
      </Line>
      <Line gap={8} indent={6}>
        <T>รายได้เฉลี่ยต่อเดือน</T>
        {['1 - 5,000 บาท', '5,001 – 9,000 บาท', '9,001 – 15,000 บาท', '15,001 – 20,000 บาท', '20,001 – 30,000 บาท'].map((s) => (
          <Box key={s} checked={salary(s)} label={s} />
        ))}
      </Line>
      <Line gap={8} indent={30}>
        {['30,001 – 40,000 บาท', '40,001 บาทขึ้นไป'].map((s) => (
          <Box key={s} checked={salary(s)} label={s} />
        ))}
      </Line>
      <Line indent={6}>
        <T>อาชีพ</T>
        <Fill value={hasJob ? labor?.occupation : ''} grow={2} />
        <T>ตำแหน่ง</T>
        <Fill value={hasJob ? labor?.position : ''} grow={2} />
        <T>อายุงาน</T>
        <Fill value={hasJob ? String(labor?.year_of_service || '').replace(/\s*ปี\s*$/, '') : ''} grow={1.6} />
        <T>ปี</T>
      </Line>
      <Line indent={6}>
        <T>สถานที่ทำงาน ชื่อหน่วยงาน</T>
        <Fill value={hasJob ? labor?.agency_name : ''} grow={2.2} />
        <T>จังหวัด</T>
        <Fill value="" grow={1.3} />
        <T>โทรศัพท์</T>
        <Fill value={hasJob ? real(labor?.phone_number) : ''} grow={1.6} />
      </Line>
      <Line gap={7} indent={6}>
        <T>กลุ่มอุตสาหกรรมที่ทำงาน</T>
        {['การแปรรูปอาหาร', 'การเกษตรและเทคโนโลยีชีวภาพ', 'ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ'].map((s) => (
          <Box key={s} checked={industry(s)} label={s} />
        ))}
      </Line>
      <Line gap={6} indent={6}>
        {['อิเล็กทรอนิกส์อัจฉริยะ', 'ยานยนต์สมัยใหม่', 'ดิจิตอล', 'เชื้อเพลิง/เคมีชีวภาพ', 'ขนส่งและการบิน', 'การแพทย์ครบวงจร', 'หุ่นยนต์เพื่ออุตสาหกรรม'].map((s) => (
          <Box key={s} checked={industry(s)} label={s} />
        ))}
      </Line>
      <Line gap={7} indent={6}>
        <T bold>2.2 ผู้ที่ไม่มีงานทำ</T>
        {knownNotJob.map((s) => (
          <Box key={s} checked={notJob(s)} label={s} />
        ))}
        <Box checked={Boolean(otherNotJob)} label="อื่น ๆ ระบุ" />
        <Fill value={otherNotJob} />
      </Line>

      {/* 3. Source */}
      <Line gap={7}>
        <T bold>3. แหล่งที่ทราบการฝึก</T>
        <Box checked={source('โทรทัศน์')} label="โทรทัศน์" />
        <Box checked={source('วิทยุ')} label="วิทยุ" />
        <Box checked={source('หนังสือพิมพ์')} label="หนังสือพิมพ์" />
        <Box checked={source('สื่อออนไลน์') || source('เว็บไซต์')} label="สื่อออนไลน์ของหนังสือพิมพ์ วิทยุ หรือ โทรทัศน์ ทั้งสื่อส่วนกลางและสื่อท้องถิ่น" />
      </Line>

      {/* 4. Consent / job placement */}
      <Line>
        <T bold>4. ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล</T>
        <T>ให้กับหน่วยงานของรัฐและเอกชนทราบ เพื่อประโยชน์ในการจัดหางานและบริหารแรงงานต่อไป</T>
      </Line>
      <Line gap={24} indent={14}>
        <Box checked={labor?.is_accept_publish === 'ยินยอมเปิดเผย'} label="ยินยอมเปิดเผย" />
        <Box checked={labor?.is_accept_publish === 'ไม่ยินยอมเปิดเผย'} label="ไม่ยินยอมเปิดเผย" />
      </Line>
      <Line>
        <T>ท่านมีความประสงค์จะให้กรมการจัดหางาน หางานให้เมื่อผ่านการฝึกอบรมฝีมือแรงงาน/การทดสอบมาตรฐานฝีมือแรงงาน</T>
      </Line>
      <Line gap={8} indent={14}>
        <Box checked={labor?.is_want_job === 'ไม่ต้องการ'} label="ไม่ต้องการ" />
        <Box checked={wantIn} label="ต้องการจัดหางานในประเทศ ตำแหน่ง" />
        <Fill value={wantIn ? labor?.accept_job_position : ''} grow={1.4} />
        <T>ของอุตสาหกรรม</T>
        <Fill value={wantIn ? labor?.accept_job_industry : ''} grow={1.2} />
      </Line>
      <Line gap={8} indent={14}>
        <Box checked={wantAbroad} label="ต้องการจัดหางานในต่างประเทศ ประเทศที่จะไปทำงาน" />
        <Fill value={wantAbroad ? labor?.accept_job_in_country_name : ''} />
      </Line>

      {/* Signatures */}
      <div className="grid grid-cols-2" style={{ marginTop: '3mm', border: '1px solid #27272a' }}>
        <div style={{ padding: '2mm 3.5mm 3mm', borderRight: '1.5px solid #27272a' }}>
          <Line>
            <T>(เฉพาะเจ้าหน้าที่) ตรวจสอบข้อมูลข้างต้นจากฐานข้อมูลในระบบ</T>
          </Line>
          <Line>
            <T>และหลักฐานตัวจริงเรียบร้อยแล้ว</T>
          </Line>
          <Line>
            <T>เจ้าหน้าที่รับสมัคร</T>
            <Fill />
          </Line>
          <Line>
            <T>วันที่รับสมัคร</T>
            <Fill />
            <T>/</T>
            <Fill />
            <T>/</T>
            <Fill />
          </Line>
        </div>
        <div style={{ padding: '2mm 3.5mm 3mm' }}>
          <Line>
            <T>ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นจริงทุกประการ</T>
          </Line>
          <Line>
            <span />
          </Line>
          <Line>
            <T>ลงชื่อ</T>
            <Fill grow={4} />
            <T>ผู้สมัคร</T>
          </Line>
          <Line>
            <T>วันที่</T>
            <Fill />
            <T>/</T>
            <Fill />
            <T>/</T>
            <Fill />
          </Line>
        </div>
      </div>
    </div>
  );
}
