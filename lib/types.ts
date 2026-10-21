export interface User {
  id: number;
  th_human_number: string;
  first_name_th: string;
  last_name_th: string;
  first_name_en?: string;
  last_name_en?: string;
  title_th?: string;
  title_en?: string;
  gender_id?: number;
  sex_name?: string;
  nationality_name?: string;
  birth_day?: string;
  phone_number: string;
  email: string;
  house_number?: string;
  house_group?: number;
  road_name?: string;
  alley_name?: string;
  subdistrict_id?: number;
  subdistrict_name?: string;
  district_id?: number;
  district_name?: string;
  province_id?: number;
  province_name?: string;
  heq_id?: number;
  education_level?: string;
  branch_name?: string;
  physical_id?: number;
  id_photo_file_pathname?: string;
  identification_file_pathname?: string;
  eq_file_pathname?: string;
  is_allowed?: number;
  is_admin?: number;
  status_id?: number;
  redirect_tag?: string;
  created_at?: string;
}

export interface TrainingCourse {
  id: number;
  agency_name: string;
  course_name: string;
  course_name_en?: string;
  traning_hours: number;
  branch_name: string;
  level_name: string;
  startswith_date: string;
  endswith_date: string;
  between_date: string;
  limit_course: number;
  executive_name: string;
  applied_count?: number;
}

export interface TrainingApplication {
  id: number;
  user_id: number;
  training_id: number;
  training_type?: string;
  applicant_type?: string;
  is_skill_testing?: boolean;
  is_accept?: number;
  status: 'รอพิจารณา' | 'อนุมัติ' | 'ปฏิเสธ';
  created_at?: string;
  theory_score?: number;
  theory_max_score?: number;
  theory_passed?: boolean;
  exam_submitted_at?: string;
  course?: TrainingCourse;
  user?: User;
}

export interface ExamResultRecord {
  id: number;
  user_id: number;
  training_id: number;
  test_form_id: number;
  score: number;
  max_score: number;
  passed: boolean;
  submitted_at: string;
}

export interface LaborHistory {
  id?: number;
  user_id: number;
  is_have_job: string; // 'ทำงาน' | 'ไม่ทำงานหรือว่างงาน'
  labor_status: string;
  labor_salary: string;
  occupation: string;
  position: string;
  year_of_service: string;
  agency_name: string;
  province_id: number;
  phone_number: string;
  industrial_groups_working: string;
  not_have_job_status?: string;
  known_source_of_training: string;
  is_accept_publish: string;
  is_want_job: string;
  is_want_job_inside: string;
  accept_job_position?: string;
  accept_job_industry?: string;
  accept_job_in_country_name?: string;
}

export interface ExamChoice {
  id: string;
  choice_text: string;
  is_correct: boolean;
}

export interface MatchingPair {
  id: string;
  left_text: string;
  right_text: string;
}

export type QuestionType = 'single_choices' | 'multiple_choices' | 'text_choices' | 'true_false' | 'matching';

export interface ExamQuestion {
  id: number;
  question_text: string;
  type: QuestionType; // 'single_choices' | 'multiple_choices' | 'text_choices' | 'true_false' | 'matching'
  category: 'knowledge' | 'practice'; // ภาคความรู้ หรือ ภาคความสามารถ
  score: number;
  choices: ExamChoice[];
  matching_pairs?: MatchingPair[]; // สำหรับข้อสอบจับคู่
  true_false_answer?: boolean; // สำหรับข้อสอบถูก/ผิด (true = ถูก, false = ผิด)
  placeholder_text?: string;
  correct_answer_text?: string;
}

export interface PracticalItem {
  id: number;
  item_name: string; // ชื่อหัวข้อเกณฑ์ประเมินปฏิบัติ
  description?: string;
  max_score: number;
  criteria?: string; // เกณฑ์การพิจารณาให้คะแนน
  children?: PracticalItem[]; // ข้อย่อยซ้อนลงไป 3-4 ชั้น
}

export interface TestForm {
  id: number;
  training_id: number;
  exam_type?: 'theory' | 'practical'; // แยกข้อสอบทฤษฎี vs ประเมินปฏิบัติ
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_percentage: number;
  total_score: number;
  score_knowledge_max: number;
  score_practice_max: number;
  is_active: boolean;
  exam_start_date?: string; // วันที่เริ่มเปิดสอบ (เช่น YYYY-MM-DDTHH:mm)
  exam_end_date?: string; // วันที่ปิดการสอบ
  randomize_questions?: boolean;
  randomize_choices?: boolean;
  questions?: ExamQuestion[];
  practical_items?: PracticalItem[];
}

export interface TestFormHistory {
  id: number;
  user_id: number;
  test_form_id: number;
  score_knowledge: number;
  score_practice: number;
  total_score: number;
  result_status: 'ผ่านการประเมิน' | 'ไม่ผ่านการประเมิน' | 'รอประเมิน';
  pratice_history_path?: string;
  created_at?: string;
  user?: User;
}
