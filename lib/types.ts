// =====================================================================
// TMRDA domain types — mirror the Supabase tables (see supabase/migrations)
// =====================================================================

export type Role = 'user' | 'admin' | 'director' | 'evaluator';

export interface User {
  id: number;
  th_human_number: string;
  title_th?: string;
  first_name_th: string;
  last_name_th: string;
  title_en?: string;
  first_name_en?: string;
  last_name_en?: string;
  gender_id?: number;
  sex_name?: string;
  nationality_name?: string;
  birth_day?: string;
  phone_number: string;
  email: string;
  house_number?: string;
  house_group?: number | null;
  road_name?: string;
  alley_name?: string;
  province_name?: string;
  district_name?: string;
  subdistrict_name?: string;
  zip_code?: string;
  education_level?: string;
  branch_name?: string;
  physical_id?: number;
  disability_types?: string;
  id_photo_file_pathname?: string | null;
  identification_file_pathname?: string | null;
  eq_file_pathname?: string | null;
  is_allowed?: number;
  is_admin?: number;
  role: Role;
  position_title?: string;
  created_at?: string;
}

export type DocumentField = 'identification_file_pathname' | 'eq_file_pathname' | 'id_photo_file_pathname';

export interface TrainingCourse {
  id: number;
  agency_name: string;
  course_name: string;
  course_name_en?: string;
  traning_hours: number; // (sic) column name in DB
  branch_name: string;
  level_name: string;
  startswith_date: string | null;
  endswith_date: string | null;
  between_date?: string;
  limit_course: number;
  executive_name?: string;
  description?: string;
  location?: string;
  is_published?: boolean;
  created_at?: string;
}

/** Enrollment review status, stored in Thai as in the original schema. */
export type EnrollmentStatus = 'รอพิจารณา' | 'อนุมัติ' | 'ปฏิเสธ';
export type ResultStatus = 'pending' | 'passed' | 'failed';
export type ApprovalStatus = 'none' | 'submitted' | 'approved' | 'rejected';

export interface TrainingApplication {
  id: number;
  user_id: number;
  training_id: number;
  training_type?: string;
  applicant_type?: string;
  is_skill_testing?: boolean;
  status: EnrollmentStatus;
  reviewed_at?: string | null;
  created_at?: string;
  practical_round_id?: number | null;
  // Official snapshot written when results are sent to the director
  theory_score?: number | null;
  theory_max?: number | null;
  theory_passed?: boolean | null;
  practical_score?: number | null;
  practical_max?: number | null;
  practical_passed?: boolean | null;
  result_status: ResultStatus;
  approval_status: ApprovalStatus;
  submitted_at?: string | null;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_by_title?: string | null;
  approved_at?: string | null;
  approval_note?: string | null;
  certificate_no?: string | null;
}

export interface LaborHistory {
  id?: number;
  user_id: number;
  is_have_job: string;
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

// ---------------------------------------------------------------------
// Theory exam
// ---------------------------------------------------------------------

/**
 * - single_choices   ตัวเลือกเดียว
 * - multiple_choices หลายคำตอบ (all-or-nothing, or partial when `partial_credit`)
 * - true_false       ถูก / ผิด
 * - matching         จับคู่ (score is proportional to correct pairs)
 * - short_answer     เติมคำตอบสั้น (auto-graded against `accepted_answers`)
 * - text_choices     ข้อเขียน / อัตนัย (graded manually by staff)
 */
export type QuestionType =
  | 'single_choices'
  | 'multiple_choices'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'text_choices';

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

export interface ExamQuestion {
  id: number;
  question_text: string;
  type: QuestionType;
  category?: 'knowledge' | 'practice';
  score: number;
  choices: ExamChoice[];
  matching_pairs?: MatchingPair[];
  true_false_answer?: boolean;
  accepted_answers?: string[];
  placeholder_text?: string;
  correct_answer_text?: string;
  explanation?: string;
  partial_credit?: boolean;
}

/** Answers keyed by question id. Matching answers map left pair id -> chosen pair id (right side). */
export type AnswerValue = string | string[] | boolean | Record<string, string>;
export type AnswerMap = Record<string, AnswerValue>;

// ---------------------------------------------------------------------
// Practical exam
// ---------------------------------------------------------------------

export interface PracticalItem {
  id: number;
  item_name: string;
  description?: string;
  max_score: number;
  criteria?: string;
  children?: PracticalItem[];
}

export type ExamType = 'theory' | 'practical';

export interface TestForm {
  id: number;
  training_id: number;
  exam_type: ExamType;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_percentage: number;
  total_score: number;
  score_knowledge_max: number;
  score_practice_max: number;
  is_active: boolean;
  exam_start_date?: string | null;
  exam_end_date?: string | null;
  max_attempts: number;
  show_answers: boolean;
  randomize_questions?: boolean;
  randomize_choices?: boolean;
  questions: ExamQuestion[];
  practical_items: PracticalItem[];
  created_at?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface ExamAttempt {
  id: number;
  user_id: number;
  training_id: number;
  test_form_id: number | null;
  application_id: number | null;
  question_snapshot: ExamQuestion[];
  answers: AnswerMap;
  manual_scores: Record<string, number>;
  auto_score: number;
  score: number;
  max_score: number;
  percent: number;
  passing_percentage: number;
  passed: boolean | null;
  needs_review: boolean;
  status: AttemptStatus;
  started_at: string;
  deadline_at: string | null;
  submitted_at: string | null;
  graded_by?: number | null;
  graded_at?: string | null;
}

export interface PracticalRound {
  id: number;
  training_id: number;
  test_form_id: number;
  name: string;
  exam_date: string | null;
  start_time?: string;
  location?: string;
  evaluator_ids: number[];
  status: 'open' | 'closed';
  created_at?: string;
}

export interface PracticalScore {
  id: number;
  round_id: number;
  application_id: number;
  evaluator_id: number;
  item_scores: Record<string, number>;
  total: number;
  max_total: number;
  comment: string;
  status: 'draft' | 'submitted';
  updated_at: string;
}
