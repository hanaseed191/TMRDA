/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { DISABILITY_TYPES } from '@/lib/constants';
import type { LaborHistory, TrainingApplication, TrainingCourse, User } from '@/lib/types';

// Official DSD application form (ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน).
// Every value comes from the database — missing data is left as a blank dotted line.

const NBSP = ' ';

function beDate(v?: string | null): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
}

function CB({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 3, lineHeight: 1.15 }}>
      <span
        className="inline-flex shrink-0 items-center justify-center border border-zinc-900 bg-surface"
        style={{ width: 10, height: 10, fontSize: '7.5pt', fontWeight: 700 }}
      >
        {checked ? '✓' : NBSP}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Dot({ w, children, center }: { w?: string; children?: React.ReactNode; center?: boolean }) {
  const empty = children === undefined || children === null || children === '';
  return (
    <span
      className={`inline-block border-b border-dotted border-zinc-700 ${center ? 'text-center' : ''}`}
      style={{ minWidth: w || '45px', flex: w ? undefined : 1, paddingLeft: 2, paddingRight: 2 }}
    >
      {empty ? NBSP : children}
    </span>
  );
}

const row = (extra?: React.CSSProperties): React.CSSProperties => ({ marginTop: 1, ...extra });

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
  const salary = (v: string) => hasJob && (labor?.labor_salary || '').replace(/\s/g, '') === v.replace(/\s/g, '');
  const status = (v: string) => hasJob && labor?.labor_status === v;
  const industry = (v: string) => hasJob && labor?.industrial_groups_working === v;
  const notJob = (v: string) => noJob && labor?.not_have_job_status === v;
  const source = (v: string) => (labor?.known_source_of_training || '').includes(v);
  const knownOther =
    labor?.known_source_of_training && !['โทรทัศน์', 'วิทยุ', 'หนังสือพิมพ์', 'สื่อออนไลน์'].some(source)
      ? labor.known_source_of_training
      : '';
  const nameTh = `${user.title_th || ''}${user.first_name_th} ${user.last_name_th}`;
  const nameEn = user.first_name_en ? `${user.title_en ? user.title_en + ' ' : ''}${user.first_name_en} ${user.last_name_en || ''}` : '';
  const between = course?.startswith_date ? `${beDate(course.startswith_date)} - ${beDate(course.endswith_date)}` : '';
  const realHouse = user.house_number && user.house_number !== '-' ? user.house_number : '';
  const otherNotJob =
    noJob && labor?.not_have_job_status && !['อยู่ระหว่างหางาน', 'นักเรียน/นักศึกษา', 'ผู้ประกันตนที่ถูกเลิกจ้าง', 'ผู้ต้องขัง', 'ทหารก่อนปลด'].includes(labor.not_have_job_status)
      ? labor.not_have_job_status
      : '';

  return (
    <div
      className="print-area relative box-border overflow-hidden bg-surface font-doc text-zinc-950 shadow-lift"
      style={{ width: '210mm', height: '297mm', fontSize: '10pt', lineHeight: 1.15, padding: '6mm 9mm' }}
    >
      {/* Photo */}
      <div
        className="absolute z-10 flex items-center justify-center overflow-hidden border border-zinc-900 bg-zinc-50 text-center"
        style={{ top: '6mm', right: '9mm', width: '2.5cm', height: '3cm' }}
      >
        {user.id_photo_file_pathname && /^https?:/.test(user.id_photo_file_pathname) ? (
          <img src={user.id_photo_file_pathname} alt="รูปถ่าย" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span style={{ fontSize: '8pt' }}>
            ติดรูปถ่าย
            <br />
            1.5 นิ้ว
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3" style={{ paddingRight: '2.8cm' }}>
        <img src="/logo.jpeg" alt="" className="shrink-0 object-contain" style={{ width: 72, height: 72 }} />
        <p className="flex-1 text-center" style={{ fontSize: '12pt', fontWeight: 700 }}>
          ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน
        </p>
      </div>
      <div className="flex items-center gap-1" style={{ marginTop: 3, fontWeight: 700, paddingRight: '2.8cm' }}>
        <span>กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน หน่วยงาน:</span>
        <Dot>{course?.agency_name}</Dot>
      </div>

      {/* Purpose */}
      <div style={{ marginTop: 3 }}>
        <div className="flex flex-wrap items-center gap-1.5" style={{ paddingRight: '2.8cm' }}>
          <span style={{ fontWeight: 700 }}>ข้าพเจ้ามีความประสงค์เข้ารับ</span>
          {['การฝึกอบรมฝีมือแรงงาน', 'ฝึกเตรียมเข้าทำงาน', 'ฝึกยกระดับฝีมือแรงงาน', 'ฝึกอาชีพเสริม', 'ฝึกคนครัวบนเรือ'].map((t) => (
            <CB key={t} checked={application?.training_type === t} label={t} />
          ))}
        </div>
        <div className="flex items-center gap-2" style={row({ paddingLeft: 130 })}>
          <span style={{ fontWeight: 700 }}>การทดสอบฝีมือแรงงาน</span>
          <CB checked={Boolean(application?.is_skill_testing)} label="ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ" />
        </div>
        <div className="flex items-center gap-1" style={row()}>
          <span>หลักสูตร (ฝึกอบรม)</span>
          <Dot>{course?.course_name}</Dot>
          <span>จำนวนชั่วโมงฝึก</span>
          <Dot w="40px" center>
            {course?.traning_hours ? String(course.traning_hours) : ''}
          </Dot>
          <span>ชั่วโมง</span>
        </div>
        <div className="flex items-center gap-1" style={row()}>
          <span>สาขา (ทดสอบ)</span>
          <Dot>{application?.is_skill_testing ? course?.branch_name || course?.course_name : ''}</Dot>
          <span>ระดับ (ทดสอบ)</span>
          <Dot w="60px" center>
            {application?.is_skill_testing ? course?.level_name : ''}
          </Dot>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row()}>
          <span>ประเภทผู้สมัคร (ทดสอบ)</span>
          {['ผู้รับการฝึกจาก กพร.', 'จากสถานศึกษา', 'จากภาครัฐ', 'จากภาคเอกชน', 'บุคคลทั่วไป'].map((t) => (
            <CB key={t} checked={applicant === t} label={t} />
          ))}
          <span>ระหว่างวันที่</span>
          <Dot w="120px" center>
            {between}
          </Dot>
        </div>
      </div>

      {/* 1. Personal */}
      <div style={{ marginTop: 4 }}>
        <p style={{ fontSize: '10.5pt', fontWeight: 700 }}>1. ข้อมูลส่วนบุคคล</p>
        <div className="flex items-center gap-1 whitespace-nowrap" style={row()}>
          <span>ชื่อ-สกุล ภาษาไทย (นาย/นาง/นางสาว)</span>
          <Dot w="230px" center>
            {nameTh}
          </Dot>
          <span style={{ marginLeft: 10 }}>เพศ</span>
          <Dot w="50px" center>
            {user.sex_name}
          </Dot>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap" style={row()}>
          <span>ชื่อ-สกุล ภาษาอังกฤษ</span>
          <Dot w="320px">{nameEn}</Dot>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap" style={row()}>
          <span>เลขบัตรประชาชน</span>
          <Dot w="98px" center>
            {user.th_human_number}
          </Dot>
          <span>สัญชาติ</span>
          <Dot w="35px" center>
            {user.nationality_name}
          </Dot>
          <span>วัน/เดือน/ปีเกิด</span>
          <Dot w="70px" center>
            {beDate(user.birth_day)}
          </Dot>
          <span>โทรศัพท์</span>
          <Dot w="78px" center>
            {user.phone_number && user.phone_number !== '-' ? user.phone_number : ''}
          </Dot>
          <span>อีเมล (ถ้ามี)</span>
          <Dot>{user.email}</Dot>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap" style={row()}>
          <span>ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ตามบัตรประชาชน เลขที่</span>
          <Dot w="55px" center>
            {realHouse}
          </Dot>
          <span>หมู่</span>
          <Dot w="28px" center>
            {user.house_group ? String(user.house_group) : ''}
          </Dot>
          <span>ถนน</span>
          <Dot w="100px" center>
            {user.road_name}
          </Dot>
          <span>ซอย</span>
          <Dot>{user.alley_name}</Dot>
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap" style={row()}>
          <span>แขวง/ตำบล</span>
          <Dot w="100px" center>
            {user.subdistrict_name}
          </Dot>
          <span>เขต/อำเภอ</span>
          <Dot w="100px" center>
            {user.district_name}
          </Dot>
          <span>จังหวัด</span>
          <Dot w="110px" center>
            {user.province_name}
          </Dot>
          <span>รหัสไปรษณีย์</span>
          <Dot center>{user.zip_code}</Dot>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row()}>
          <span>วุฒิการศึกษาสูงสุด</span>
          <CB checked={edu === 'ประถมศึกษา'} label="ประถมศึกษา" />
          <CB checked={edu === 'มัธยมศึกษาตอนต้น'} label="มัธยมต้น" />
          <CB checked={edu === 'มัธยมศึกษาตอนปลาย'} label="มัธยมปลาย" />
          <CB checked={edu === 'อนุปริญญา'} label="อนุปริญญา" />
          <CB checked={edu === 'ประกาศนียบัตรวิชาชีพ (ปวช.)'} label="ปวช." />
          <CB checked={edu === 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)'} label="ปวส./ปวท." />
          <CB checked={['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'].includes(edu)} label="ปริญญาตรีขึ้นไป" />
          <CB checked={edu === 'ไม่จบการศึกษา'} label="ไม่จบการศึกษา" />
        </div>
        <div className="flex items-center gap-1" style={row()}>
          <span>สาขา</span>
          <Dot>{user.branch_name}</Dot>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row()}>
          <span>สภาพร่างกาย</span>
          <CB checked={user.physical_id === 1} label="ปกติ" />
          <CB checked={disabled} label="พิการ (" />
          {DISABILITY_TYPES.slice(0, 4).map((d) => (
            <CB key={d} checked={disabled && disabilities.has(d)} label={d} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={{ paddingLeft: 80 }}>
          {DISABILITY_TYPES.slice(4).map((d) => (
            <CB key={d} checked={disabled && disabilities.has(d)} label={d} />
          ))}
          <span>)</span>
        </div>
      </div>

      {/* 2. Labor status */}
      <div style={{ marginTop: 4 }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>2. สถานภาพแรงงาน</span>
          <CB checked={hasJob} label="ทำงาน (กรอกข้อ 2.1)" />
          <CB checked={noJob} label="ไม่ทำงานหรือว่างงาน (กรอกข้อ 2.2)" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row({ paddingLeft: 15 })}>
          <span style={{ fontWeight: 700 }}>2.1 ผู้มีงานทำ</span>
          <CB checked={status('ภาคเอกชน')} label="ภาคเอกชน" />
          <CB checked={status('รัฐวิสาหกิจ')} label="รัฐวิสาหกิจ" />
          <CB checked={status('ภาครัฐ')} label="ภาครัฐ" />
          <span>( ) ข้าราชการพลเรือน ( ) ข้าราชการตำรวจ ( ) ข้าราชการทหาร ( ) ข้าราชการครู</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={{ paddingLeft: 40 }}>
          <CB checked={status('ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ')} label="ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ" />
          <span>( ) วิสาหกิจชุมชน ( ) เกษตรกร ( ) ผู้รับจ้างทั่วไปโดยไม่มีนายจ้าง (Freelance)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row({ paddingLeft: 15 })}>
          <span>รายได้เฉลี่ยต่อเดือน</span>
          {['1 - 5,000 บาท', '5,001 – 9,000 บาท', '9,001 – 15,000 บาท', '15,001 – 20,000 บาท', '20,001 – 30,000 บาท', '30,001 – 40,000 บาท', '40,001 บาทขึ้นไป'].map((s) => (
            <CB key={s} checked={salary(s)} label={s} />
          ))}
        </div>
        <div className="flex items-center gap-1" style={row({ paddingLeft: 15 })}>
          <span>อาชีพ</span>
          <Dot w="110px">{hasJob ? labor?.occupation : ''}</Dot>
          <span>ตำแหน่ง</span>
          <Dot w="110px">{hasJob ? labor?.position : ''}</Dot>
          <span>อายุงาน</span>
          <Dot w="50px" center>
            {hasJob ? String(labor?.year_of_service || '').replace(/\s*ปี\s*$/, '') : ''}
          </Dot>
          <span>ปี</span>
        </div>
        <div className="flex items-center gap-1" style={row({ paddingLeft: 15 })}>
          <span>สถานที่ทำงาน ชื่อหน่วยงาน</span>
          <Dot>{hasJob ? labor?.agency_name : ''}</Dot>
          <span>โทรศัพท์</span>
          <Dot w="90px" center>
            {hasJob ? labor?.phone_number : ''}
          </Dot>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row({ paddingLeft: 15 })}>
          <span>กลุ่มอุตสาหกรรมที่ทำงาน</span>
          {['การแปรรูปอาหาร', 'การเกษตรและเทคโนโลยีชีวภาพ', 'ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ'].map((s) => (
            <CB key={s} checked={industry(s)} label={s} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={{ paddingLeft: 15 }}>
          {['อิเล็กทรอนิกส์อัจฉริยะ', 'ยานยนต์สมัยใหม่', 'ดิจิตอล', 'เชื้อเพลิง/เคมีชีวภาพ', 'ขนส่งและการบิน', 'การแพทย์ครบวงจร', 'หุ่นยนต์เพื่ออุตสาหกรรม'].map((s) => (
            <CB key={s} checked={industry(s)} label={s} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" style={row({ paddingLeft: 15 })}>
          <span style={{ fontWeight: 700 }}>2.2 ผู้ไม่มีงานทำ</span>
          {['อยู่ระหว่างหางาน', 'นักเรียน/นักศึกษา', 'ผู้ประกันตนที่ถูกเลิกจ้าง', 'ผู้ต้องขัง', 'ทหารก่อนปลด'].map((s) => (
            <CB key={s} checked={notJob(s)} label={s} />
          ))}
          <span>อื่น ๆ ระบุ</span>
          <Dot w="90px">{otherNotJob}</Dot>
        </div>
      </div>

      {/* 3. Source */}
      <div style={{ marginTop: 4 }} className="flex flex-wrap items-center gap-1.5">
        <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>3. แหล่งที่ทราบการฝึก</span>
        <CB checked={source('โทรทัศน์')} label="โทรทัศน์" />
        <CB checked={source('วิทยุ')} label="วิทยุ" />
        <CB checked={source('หนังสือพิมพ์')} label="หนังสือพิมพ์" />
        <CB checked={source('สื่อออนไลน์')} label="สื่อออนไลน์ของหนังสือพิมพ์ วิทยุ หรือโทรทัศน์ ทั้งสื่อส่วนกลางและสื่อท้องถิ่น" />
        {knownOther && <CB checked label={`อื่น ๆ: ${knownOther}`} />}
      </div>

      {/* 4. Consent / job */}
      <div style={{ marginTop: 4 }}>
        <p style={{ fontWeight: 700 }}>
          4. ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล ให้กับหน่วยงานของรัฐและเอกชนทราบ เพื่อประโยชน์ในการจัดหางานและบริหารแรงงานต่อไป
        </p>
        <div className="flex items-center gap-3" style={row({ paddingLeft: 15 })}>
          <CB checked={labor?.is_accept_publish === 'ยินยอมเปิดเผย'} label="ยินยอมเปิดเผย" />
          <CB checked={labor?.is_accept_publish === 'ไม่ยินยอมเปิดเผย'} label="ไม่ยินยอมเปิดเผย" />
        </div>
        <p style={row({ paddingLeft: 15 })}>
          ท่านมีความประสงค์จะให้กรมการจัดหางาน หางานให้เมื่อผ่านการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน
        </p>
        <div className="flex flex-wrap items-center gap-1.5" style={row({ paddingLeft: 15 })}>
          <CB checked={labor?.is_want_job === 'ไม่ต้องการ'} label="ไม่ต้องการ" />
          <span className="inline-flex items-center gap-1">
            <CB checked={labor?.is_want_job === 'ต้องการจัดหางานในประเทศ'} label="ต้องการจัดหางานในประเทศ ตำแหน่ง" />
            <Dot w="80px" center>
              {labor?.is_want_job === 'ต้องการจัดหางานในประเทศ' ? labor?.accept_job_position : ''}
            </Dot>
          </span>
          <span className="inline-flex items-center gap-1">
            <CB checked={labor?.is_want_job === 'ต้องการจัดหางานในต่างประเทศ'} label="ต้องการจัดหางานในต่างประเทศ ประเทศ" />
            <Dot w="80px" center>
              {labor?.is_want_job === 'ต้องการจัดหางานในต่างประเทศ' ? labor?.accept_job_in_country_name : ''}
            </Dot>
          </span>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 border border-zinc-900" style={{ marginTop: 8 }}>
        <div className="flex flex-col justify-between border-r border-zinc-900" style={{ padding: '4px 8px', minHeight: '28mm' }}>
          <div>
            <p style={{ fontWeight: 700 }}>
              <u>(เฉพาะเจ้าหน้าที่)</u> ตรวจสอบข้อมูลข้างต้นจากฐานข้อมูลในระบบ
            </p>
            <p>และหลักฐานตัวจริงเรียบร้อยแล้ว</p>
          </div>
          <div>
            <p style={{ marginTop: 8 }}>เจ้าหน้าที่รับสมัคร ............................................................</p>
            <p style={{ marginTop: 2 }}>วันที่รับสมัคร .............. / .............. / ..................</p>
          </div>
        </div>
        <div className="flex flex-col justify-between text-center" style={{ padding: '4px 8px' }}>
          <p style={{ fontWeight: 700 }}>ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ</p>
          <div>
            <p style={{ marginTop: 8 }}>ลงชื่อ ........................................................................ ผู้สมัคร</p>
            <p style={{ marginTop: 2 }}>({nameTh})</p>
            <p style={{ marginTop: 2 }}>วันที่ .............. / .............. / ..................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
