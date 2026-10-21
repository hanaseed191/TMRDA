import type { QuestionType } from './types';

export const TITLES_TH = ['นาย', 'นาง', 'นางสาว'] as const;
export const TITLES_EN = ['Mr.', 'Mrs.', 'Ms.'] as const;
export const TITLE_TH_TO_EN: Record<string, string> = { นาย: 'Mr.', นาง: 'Mrs.', นางสาว: 'Ms.' };
export const TITLE_TO_SEX: Record<string, string> = { นาย: 'ชาย', นาง: 'หญิง', นางสาว: 'หญิง' };
export const SEXES = ['ชาย', 'หญิง', 'อื่นๆ'] as const;

export const EDUCATION_LEVELS = [
  'ไม่จบการศึกษา',
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'ประกาศนียบัตรวิชาชีพ (ปวช.)',
  'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)',
  'อนุปริญญา',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
] as const;

export const DISABILITY_TYPES = [
  'การเห็น',
  'การได้ยินหรือสื่อความหมาย',
  'การเคลื่อนไหวหรือทางร่างกาย',
  'ทางจิตใจหรือพฤติกรรม',
  'ทางสติปัญญา',
  'การเรียนรู้',
  'ออทิสติก',
] as const;

export const APPLICANT_TYPES = [
  'บุคคลทั่วไป',
  'ผู้รับการฝึกจาก กพร.',
  'จากสถานศึกษา',
  'จากภาครัฐ',
  'จากภาคเอกชน',
] as const;

export const LABOR = {
  haveJob: ['ทำงาน', 'ไม่ทำงานหรือว่างงาน'],
  status: ['ภาคเอกชน', 'รัฐวิสาหกิจ', 'ภาครัฐ', 'ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ'],
  salary: [
    '1 - 5,000 บาท',
    '5,001 – 9,000 บาท',
    '9,001 – 15,000 บาท',
    '15,001 – 20,000 บาท',
    '20,001 – 30,000 บาท',
    '30,001 – 40,000 บาท',
    '40,001 บาทขึ้นไป',
  ],
  industry: [
    'การแปรรูปอาหาร',
    'การเกษตรและเทคโนโลยีชีวภาพ',
    'ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ',
    'อิเล็กทรอนิกส์อัจฉริยะ',
    'ยานยนต์สมัยใหม่',
    'ดิจิตอล',
    'เชื้อเพลิง/เคมีชีวภาพ',
    'ขนส่งและการบิน',
    'การแพทย์ครบวงจร',
    'หุ่นยนต์เพื่ออุตสาหกรรม',
  ],
  notHaveJob: ['อยู่ระหว่างหางาน', 'นักเรียน/นักศึกษา', 'ผู้ประกันตนที่ถูกเลิกจ้าง', 'ผู้ต้องขัง', 'ทหารก่อนปลด'],
  source: ['โทรทัศน์', 'วิทยุ', 'หนังสือพิมพ์', 'สื่อออนไลน์', 'เว็บไซต์กรมพัฒนาฝีมือแรงงาน', 'เพื่อน / คนรู้จัก'],
  publish: ['ยินยอมเปิดเผย', 'ไม่ยินยอมเปิดเผย'],
  wantJob: ['ไม่ต้องการ', 'ต้องการจัดหางานในประเทศ', 'ต้องการจัดหางานในต่างประเทศ'],
};

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: 'single_choices', label: 'ตัวเลือกเดียว', hint: 'เลือกคำตอบที่ถูกต้อง 1 ข้อ' },
  { value: 'multiple_choices', label: 'หลายคำตอบ', hint: 'เลือกได้มากกว่า 1 ข้อ' },
  { value: 'true_false', label: 'ถูก / ผิด', hint: 'ตัดสินว่าข้อความถูกหรือผิด' },
  { value: 'matching', label: 'จับคู่', hint: 'จับคู่ข้อความซ้าย–ขวา คิดคะแนนตามคู่ที่ถูก' },
  { value: 'short_answer', label: 'เติมคำตอบสั้น', hint: 'ตรวจอัตโนมัติจากคำตอบที่ยอมรับ' },
  { value: 'text_choices', label: 'อัตนัย / ข้อเขียน', hint: 'เจ้าหน้าที่ตรวจให้คะแนนเอง' },
];

export const QUESTION_TYPE_LABEL = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label])) as Record<
  QuestionType,
  string
>;

export const PRACTICAL_LEVELS = ['หมวดหลัก', 'หัวข้อย่อย', 'รายการประเมิน', 'เกณฑ์ย่อย'] as const;
export const MAX_PRACTICAL_DEPTH = 4;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
