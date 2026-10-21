'use client';

import React, { useState, useEffect } from 'react';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { User, LaborHistory } from '@/lib/types';

export default function PrintPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [laborHistory, setLaborHistory] = useState<LaborHistory | null>(null);

  useEffect(() => {
    const load = async () => {
      const user = MockDataStore.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const history = await MockDataStore.getLaborHistory(user.id);
        setLaborHistory(history || null);
      } else {
        const users = await MockDataStore.getUsers();
        if (users.length > 1) {
          setCurrentUser(users[1]);
          const history = await MockDataStore.getLaborHistory(users[1].id);
          setLaborHistory(history || null);
        }
      }
    };
    load();
  }, []);

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parts[1];
        const day = parts[2];
        if (!isNaN(year)) {
          const beYear = year < 2400 ? year + 543 : year;
          return `${day}/${month}/${beYear}`;
        }
      }
    } catch (e) {}
    return dateStr;
  };

  const CB = ({ checked, label }: { checked: boolean; label: string }) => (
    <span className="inline-flex items-center" style={{ gap: '3px', lineHeight: '1.2' }}>
      <span className="inline-flex items-center justify-center border border-zinc-900 bg-white shrink-0" style={{ width: '11px', height: '11px', fontSize: '8pt', fontWeight: 700 }}>
        {checked ? '✓' : '\u00A0'}
      </span>
      <span>{label}</span>
    </span>
  );

  const Dot = ({ w, children, center }: { w?: string; children?: React.ReactNode; center?: boolean }) => (
    <span className={`border-b border-dotted border-zinc-700 inline-block ${center ? 'text-center' : ''}`} style={{ minWidth: w || '50px', flex: w ? undefined : 1, paddingBottom: '0px', paddingLeft: '2px', paddingRight: '2px' }}>
      {children || '\u00A0'}
    </span>
  );

  if (!currentUser) {
    return <div className="p-8 text-center">กำลังโหลดเอกสาร...</div>;
  }

  const user = currentUser;
  const photoUrl = MockDataStore.getUserDocumentUrl(user, 'id_photo_file_pathname');
  const isValidPhoto = photoUrl && !photoUrl.toLowerCase().includes('oppo') && (photoUrl.startsWith('http') || photoUrl.startsWith('data:'));

  return (
    <div className="min-h-screen bg-zinc-200 flex flex-col items-center justify-center p-4">
      {/* Print Controls (Hidden during print) */}
      <div className="mb-4 flex items-center gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow cursor-pointer flex items-center gap-2"
        >
          <i className="fa-solid fa-print" />
          <span>พิมพ์เอกสาร A4 / บันทึก PDF (1 หน้าถ้วน)</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 4mm 8mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            box-sizing: border-box !important;
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
            font-size: 10pt !important;
            line-height: 1.15 !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          a[href]:after {
            content: none !important;
          }
        }
      `}} />

      <div
        id="print-document"
        className="bg-white w-[210mm] h-[297mm] max-h-[297mm] shadow-xl border border-zinc-300 text-zinc-950 relative box-border select-none overflow-hidden"
        style={{
          fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
          fontSize: '10pt',
          lineHeight: '1.15',
          padding: '4mm 8mm',
        }}
      >
        {/* Floating Photo Box Frame */}
        <div
          className="absolute border border-zinc-900 flex flex-col items-center justify-center bg-zinc-100 overflow-hidden text-center select-none z-10"
          style={{ top: '4mm', right: '8mm', width: '2.3cm', height: '3.0cm' }}
        >
          {isValidPhoto ? (
            <img src={photoUrl!} alt="รูปถ่าย" className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <span className="text-zinc-700 font-medium" style={{ fontSize: '8pt', lineHeight: '1.15' }}>
              ติดรูปถ่าย<br />1.5 นิ้ว
            </span>
          )}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3" style={{ paddingRight: '2.5cm', paddingTop: '2px' }}>
          <img
            src="/logo.jpeg"
            alt="โลโก้"
            className="object-contain shrink-0"
            style={{ width: '75px', height: '75px' }}
            onError={(e) => {
              e.currentTarget.src = 'https://iccvbxlfntrkqzdhgzqn.supabase.co/storage/v1/object/public/documents/dsd_logo.png';
            }}
          />
          <div className="text-center flex-1" style={{ paddingTop: '2px' }}>
            <p className="whitespace-nowrap" style={{ fontSize: '11.5pt', fontWeight: 700, lineHeight: '1.15' }}>
              ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1" style={{ marginTop: '3px', fontWeight: 700, paddingRight: '2.5cm' }}>
          <span>กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน หน่วยงาน:</span>
          <Dot>{'\u00A0'}</Dot>
        </div>

        {/* ข้าพเจ้ามีความประสงค์ */}
        <div style={{ marginTop: '3px' }}>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingRight: '2.5cm' }}>
            <span style={{ fontWeight: 700 }}>ข้าพเจ้ามีความประสงค์เข้ารับ</span>
            <CB checked={false} label="การฝึกอบรมฝีมือแรงงาน" />
            <CB checked={false} label="ฝึกเตรียมเข้าทำงาน" />
            <CB checked={false} label="ฝึกยกระดับฝีมือแรงงาน" />
            <CB checked={false} label="ฝึกอาชีพเสริม" />
            <CB checked={false} label="ฝึกคนครัวบนเรือ" />
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: '1px', paddingLeft: '130px' }}>
            <span style={{ fontWeight: 700 }}>การทดสอบฝีมือแรงงาน</span>
            <CB checked={true} label="ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ" />
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
            <span>หลักสูตร (ฝึกอบรม)</span>
            <Dot>{'\u00A0'}</Dot>
            <span>จำนวนชั่วโมงฝึก</span>
            <Dot w="40px">{'\u00A0'}</Dot>
            <span>ชั่วโมง</span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
            <span>สาขา (ทดสอบ)</span>
            <Dot>ช่างพ่นสีรถยนต์</Dot>
            <span>ระดับ (ทดสอบ)</span>
            <Dot w="45px" center>1</Dot>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
            <span>ประเภทผู้สมัคร (ทดสอบ)</span>
            <CB checked={false} label="ผู้รับการฝึกจาก กพร." />
            <CB checked={false} label="จากสถานศึกษา" />
            <CB checked={false} label="จากภาครัฐ" />
            <CB checked={false} label="จากภาคเอกชน" />
            <CB checked={true} label="บุคคลทั่วไป" />
            <span>ระหว่างวันที่</span>
            <Dot w="90px">{'\u00A0'}</Dot>
          </div>
        </div>

        {/* Section 1 */}
        <div style={{ marginTop: '3px' }}>
          <p style={{ fontSize: '10.5pt', fontWeight: 700 }}>1. ข้อมูลส่วนบุคคล</p>
          <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
            <span>ชื่อ-สกุล ภาษาไทย (นาย/นาง/นางสาว)</span>
            <Dot w="220px" center>{user.title_th}{user.first_name_th} {user.last_name_th}</Dot>
            <span style={{ marginLeft: '10px' }}>เพศ</span>
            <Dot w="50px" center>{user.sex_name || 'ชาย'}</Dot>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
            <span>ชื่อ-สกุล ภาษาอังกฤษ</span>
            <Dot w="300px">{user.title_en}{user.first_name_en} {user.last_name_en}</Dot>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
            <span>เลขบัตรประชาชน</span>
            <Dot w="95px" center>{user.th_human_number}</Dot>
            <span>สัญชาติ</span>
            <Dot w="35px" center>{user.nationality_name || 'ไทย'}</Dot>
            <span>วัน/เดือน/ปีเกิด</span>
            <Dot w="75px" center>{formatThaiDate(user.birth_day)}</Dot>
            <span>โทรศัพท์</span>
            <Dot w="80px" center>{user.phone_number || '-'}</Dot>
            <span>อีเมล (ถ้ามี)</span>
            <Dot w="120px" center>{user.email || '-'}</Dot>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
            <span>ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ตามบัตรประชาชน เลขที่</span>
            <Dot w="50px" center>{user.house_number || '99/9'}</Dot>
            <span>หมู่</span>
            <Dot w="25px" center>-</Dot>
            <span>ถนน</span>
            <Dot w="110px" center>{user.road_name || 'พหลโยธิน'}</Dot>
            <span>ซอย</span>
            <Dot w="60px">{'\u00A0'}</Dot>
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
            <span>แขวง/ตำบล</span>
            <Dot w="90px" center>{user.subdistrict_name || 'ดุสิต'}</Dot>
            <span>เขต/อำเภอ</span>
            <Dot w="90px" center>{user.district_name || 'ดุสิต'}</Dot>
            <span>จังหวัด</span>
            <Dot w="110px" center>{user.province_name || 'กรุงเทพมหานคร'}</Dot>
            <span>รหัสไปรษณีย์</span>
            <Dot w="45px" center>10300</Dot>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
            <span>วุฒิการศึกษาสูงสุด</span>
            <CB checked={user.education_level === 'ประถมศึกษา'} label="ประถมศึกษา" />
            <CB checked={user.education_level === 'มัธยมศึกษาปีที่ 3'} label="มัธยมต้น" />
            <CB checked={user.education_level === 'มัธยมศึกษาปีที่ 6'} label="มัธยมปลาย" />
            <CB checked={user.education_level === 'อนุปริญญา'} label="อนุปริญญา" />
            <CB checked={user.education_level === 'ประกาศนียบัตรวิชาชีพ (ปวช.)'} label="ปวช." />
            <CB checked={user.education_level === 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)'} label="ปวส./ปวท." />
            <CB checked={['ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'].includes(user.education_level || '')} label="ปริญญาตรีขึ้นไป" />
            <CB checked={user.education_level === 'ไม่จบการศึกษา'} label="ไม่จบการศึกษา" />
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
            <span>สาขา</span>
            <Dot>{user.branch_name || 'คอมพิวเตอร์'}</Dot>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
            <span>สภาพร่างกาย</span>
            <CB checked={true} label="ปกติ" />
            <CB checked={false} label="พิการ (" />
            <CB checked={false} label="การเห็น" />
            <CB checked={false} label="การได้ยินหรือสื่อความหมาย" />
            <CB checked={false} label="การเคลื่อนไหวหรือทางร่างกาย" />
            <CB checked={false} label="ทางจิตใจหรือพฤติกรรม" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '80px' }}>
            <CB checked={false} label="ทางสติปัญญา" />
            <CB checked={false} label="การเรียนรู้" />
            <CB checked={false} label="ทางออทิสติก" />
            <span>)</span>
          </div>
        </div>

        {/* Section 2 */}
        <div style={{ marginTop: '3px' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>2. สถานภาพแรงงาน</span>
            <CB checked={laborHistory?.is_have_job === 'ทำงาน'} label="ทำงาน (กรอกข้อ 2.1)" />
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน'} label="ไม่ทำงานหรือว่างงาน (กรอกข้อ 2.2)" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span style={{ fontWeight: 700 }}>2.1 ผู้มีงานทำ</span>
            <CB checked={laborHistory?.labor_status === 'ภาคเอกชน'} label="ภาคเอกชน" />
            <CB checked={laborHistory?.labor_status === 'รัฐวิสาหกิจ'} label="รัฐวิสาหกิจ" />
            <CB checked={laborHistory?.labor_status === 'ภาครัฐ'} label="ภาครัฐ" />
            <span>( ) ข้าราชการพลเรือน ( ) ข้าราชการตำรวจ ( ) ข้าราชการทหาร ( ) ข้าราชการครู</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '40px' }}>
            <CB checked={laborHistory?.labor_status === 'ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ'} label="ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ" />
            <span>( ) วิสาหกิจชุมชน ( ) เกษตรกร ( ) ผู้รับจ้างทั่วไปโดยไม่มีนายจ้าง (Freelance)</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span>รายได้เฉลี่ยต่อเดือน</span>
            <CB checked={laborHistory?.labor_salary === '1 - 5,000 บาท'} label="1 - 5,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '5,001 – 9,000 บาท'} label="5,001 – 9,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '9,001 – 15,000 บาท'} label="9,001 – 15,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '15,001 – 20,000 บาท'} label="15,001 – 20,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '20,001 – 30,000 บาท'} label="20,001 – 30,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '30,001 – 40,000 บาท'} label="30,001 – 40,000 บาท" />
            <CB checked={laborHistory?.labor_salary === '40,001 บาทขึ้นไป'} label="40,001 บาทขึ้นไป" />
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span>อาชีพ</span>
            <Dot w="90px">{laborHistory?.occupation || '-'}</Dot>
            <span>ตำแหน่ง</span>
            <Dot w="90px">{laborHistory?.position || '-'}</Dot>
            <span>อายุงาน</span>
            <Dot w="35px" center>{laborHistory?.year_of_service || '-'}</Dot>
            <span>ปี</span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span>สถานที่ทำงาน ชื่อหน่วยงาน</span>
            <Dot>{laborHistory?.agency_name || '-'}</Dot>
            <span>จังหวัด</span>
            <Dot w="80px" center>{user.province_name || 'กรุงเทพมหานคร'}</Dot>
            <span>โทรศัพท์</span>
            <Dot w="80px" center>{laborHistory?.phone_number || '-'}</Dot>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span>กลุ่มอุตสาหกรรมที่ทำงาน</span>
            <CB checked={laborHistory?.industrial_groups_working === 'การแปรรูปอาหาร'} label="การแปรรูปอาหาร" />
            <CB checked={laborHistory?.industrial_groups_working === 'การเกษตรและเทคโนโลยีชีวภาพ'} label="การเกษตรและเทคโนโลยีชีวภาพ" />
            <CB checked={false} label="ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '15px' }}>
            <CB checked={false} label="อิเล็กทรอนิกส์อัจฉริยะ" />
            <CB checked={laborHistory?.industrial_groups_working === 'ยานยนต์สมัยใหม่'} label="ยานยนต์สมัยใหม่" />
            <CB checked={laborHistory?.industrial_groups_working === 'ดิจิตอล'} label="ดิจิตอล" />
            <CB checked={false} label="เชื้อเพลิง/เคมีชีวภาพ" />
            <CB checked={laborHistory?.industrial_groups_working === 'ขนส่งและการบิน'} label="ขนส่งและการบิน" />
            <CB checked={laborHistory?.industrial_groups_working === 'การแพทย์ครบวงจร'} label="การแพทย์ครบวงจร" />
            <CB checked={false} label="หุ่นยนต์เพื่ออุตสาหกรรม" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <span style={{ fontWeight: 700 }}>2.2 ผู้ไม่มีงานทำ</span>
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน' && laborHistory?.not_have_job_status === 'อยู่ระหว่างหางาน'} label="อยู่ระหว่างหางาน" />
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน' && laborHistory?.not_have_job_status === 'นักเรียน/นักศึกษา'} label="นักเรียน/นักศึกษา" />
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน' && laborHistory?.not_have_job_status === 'ผู้ประกันตนที่ถูกเลิกจ้าง'} label="ผู้ประกันตนที่ถูกเลิกจ้าง" />
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน' && laborHistory?.not_have_job_status === 'ผู้ต้องขัง'} label="ผู้ต้องขัง" />
            <CB checked={laborHistory?.is_have_job === 'ไม่ทำงานหรือว่างงาน' && laborHistory?.not_have_job_status === 'ทหารก่อนปลด'} label="ทหารก่อนปลด" />
            <span>อื่น ๆ ระบุ</span>
            <Dot w="80px">{'\u00A0'}</Dot>
          </div>
        </div>

        {/* Section 3 */}
        <div style={{ marginTop: '3px' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>3. แหล่งที่ทราบการฝึก</span>
            <CB checked={laborHistory?.known_source_of_training === 'โทรทัศน์'} label="โทรทัศน์" />
            <CB checked={laborHistory?.known_source_of_training === 'วิทยุ'} label="วิทยุ" />
            <CB checked={false} label="หนังสือพิมพ์" />
            <CB checked={['สื่อออนไลน์', 'สื่อออนไลน์ของหนังสือพิมพ์ วิทยุ หรือ โทรทัศน์ ทั้งสื่อส่วนกลางและสื่อท้องถิ่น'].includes(laborHistory?.known_source_of_training || '')} label="สื่อออนไลน์ของหนังสือพิมพ์ วิทยุ หรือ โทรทัศน์ ทั้งสื่อส่วนกลางและสื่อท้องถิ่น" />
          </div>
        </div>

        {/* Section 4 */}
        <div style={{ marginTop: '3px' }}>
          <p style={{ fontWeight: 700 }}>4. ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล ให้กับหน่วยงานของรัฐและเอกชนทราบ เพื่อประโยชน์ในการจัดหางานและบริหารแรงงานต่อไป</p>
          <div className="flex items-center gap-3" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <CB checked={laborHistory?.is_accept_publish === 'ยินยอมเปิดเผย'} label="ยินยอมเปิดเผย" />
            <CB checked={laborHistory?.is_accept_publish === 'ไม่ยินยอมเปิดเผย'} label="ไม่ยินยอมเปิดเผย" />
          </div>
          <p style={{ marginTop: '1px', paddingLeft: '15px' }}>ท่านมีความประสงค์จะให้กรมการจัดหางาน หางานให้เมื่อผ่านการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน</p>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
            <CB checked={laborHistory?.is_want_job === 'ไม่ต้องการ'} label="ไม่ต้องการ" />
            <span className="inline-flex items-center gap-1">
              <CB checked={laborHistory?.is_want_job === 'ต้องการจัดหางานในประเทศ'} label="ต้องการจัดหางานในประเทศ ตำแหน่ง" />
              <Dot w="60px" center>{laborHistory?.accept_job_position || '-'}</Dot>
            </span>
            <span className="inline-flex items-center gap-1">
              <CB checked={laborHistory?.is_want_job === 'ต้องการจัดหางานในต่างประเทศ'} label="ต้องการจัดหางานในต่างประเทศ ประเทศ" />
              <Dot w="60px" center>{laborHistory?.accept_job_in_country_name || '-'}</Dot>
            </span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-2 border border-zinc-900" style={{ marginTop: '4px' }}>
          <div className="border-r border-zinc-900 flex flex-col justify-between" style={{ padding: '3px 6px' }}>
            <div>
              <p style={{ fontWeight: 700 }}><u>(เฉพาะเจ้าหน้าที่)</u> ตรวจสอบข้อมูลข้างต้นจากฐานข้อมูลในระบบ</p>
              <p>และหลักฐานตัวจริงเรียบร้อยแล้ว</p>
            </div>
            <div>
              <p style={{ marginTop: '6px' }}>เจ้าหน้าที่รับสมัคร ............................................................</p>
              <p style={{ marginTop: '1px' }}>วันที่รับสมัคร .............. / .............. / ..................</p>
            </div>
          </div>
          <div className="text-center flex flex-col justify-between" style={{ padding: '3px 6px' }}>
            <p style={{ fontWeight: 700 }}>ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ</p>
            <div>
              <p style={{ marginTop: '6px' }}>ลงชื่อ ........................................................................ ผู้สมัคร</p>
              <p style={{ marginTop: '1px' }}>({user.title_th}{user.first_name_th} {user.last_name_th})</p>
              <p style={{ marginTop: '1px' }}>วันที่ .............. / .............. / ..................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
