'use client';

import { applications, attempts, courses, forms, labor, rounds } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import type {
  ExamAttempt,
  LaborHistory,
  PracticalRound,
  TestForm,
  TrainingApplication,
  TrainingCourse,
  User,
} from '@/lib/types';

export interface StudentData {
  myApps: TrainingApplication[];
  courses: TrainingCourse[];
  courseById: Map<number, TrainingCourse>;
  /** applications per training (all applicants) — for seat counts */
  seatsUsed: Map<number, number>;
  theoryForms: TestForm[];
  practicalForms: TestForm[];
  myAttempts: ExamAttempt[];
  myRounds: Map<number, PracticalRound>;
  laborHistory: LaborHistory | null;
}

export async function loadStudentData(user: User): Promise<StudentData> {
  const [allApps, courseList, theoryForms, practicalForms, rawAttempts, laborHistory] = await Promise.all([
    applications.list(),
    courses.list(),
    forms.list({ type: 'theory' }),
    forms.list({ type: 'practical' }),
    attempts.list({ userId: user.id }),
    labor.get(user.id),
  ]);
  // Attempts abandoned past their deadline are graded on the answers saved in time.
  const myAttempts = await attempts.finalizeExpired(rawAttempts);
  const myApps = allApps.filter((a) => a.user_id === user.id);
  const roundIds = myApps.map((a) => a.practical_round_id).filter((x): x is number => !!x);
  const roundList = roundIds.length ? await rounds.list({ ids: roundIds }) : [];

  const seatsUsed = new Map<number, number>();
  for (const a of allApps) if (a.status !== 'ปฏิเสธ') seatsUsed.set(a.training_id, (seatsUsed.get(a.training_id) || 0) + 1);

  return {
    myApps,
    courses: courseList,
    courseById: new Map(courseList.map((c) => [c.id, c])),
    seatsUsed,
    theoryForms,
    practicalForms,
    myAttempts,
    myRounds: new Map(roundList.map((r) => [r.id, r])),
    laborHistory,
  };
}

export function useStudentData(user: User) {
  return useLoad(() => loadStudentData(user), [user.id]);
}

// ---------------------------------------------------------------------
// Theory form availability for one candidate
// ---------------------------------------------------------------------

export type FormState = 'in_progress' | 'open' | 'upcoming' | 'closed' | 'done' | 'not_eligible';

export interface FormStatus {
  state: FormState;
  used: number;
  remaining: number;
  inProgress?: ExamAttempt;
  best?: ExamAttempt;
}

export function formStatus(form: TestForm, app: TrainingApplication, myAttempts: ExamAttempt[], now = Date.now()): FormStatus {
  const mine = myAttempts.filter((a) => a.test_form_id === form.id);
  const finished = mine.filter((a) => a.status !== 'in_progress');
  const inProgress = mine.find((a) => a.status === 'in_progress');
  const best = bestAttempt(finished);
  const used = mine.length;
  const remaining = Math.max(0, (form.max_attempts || 1) - used);
  const base = { used, remaining, best, inProgress };

  if (inProgress) return { ...base, state: 'in_progress' };
  if (app.status !== 'อนุมัติ') return { ...base, state: 'not_eligible' };
  if (remaining === 0) return { ...base, state: 'done' };
  if (!isFormOpen(form, now)) {
    const start = form.exam_start_date ? new Date(form.exam_start_date).getTime() : null;
    return { ...base, state: !form.is_active || (start && now < start) ? 'upcoming' : 'closed' };
  }
  return { ...base, state: 'open' };
}

/**
 * The theory set a candidate sits for a course. When a course has several sets, each
 * candidate gets ONE of them: the set they already started (sticky), otherwise a
 * deterministic pseudo-random pick among the sets open right now. This keeps the attempt
 * limit meaningful — a candidate cannot multiply attempts by taking every set.
 */
export function assignedTheoryForms(app: TrainingApplication, data: StudentData, now = Date.now()): TestForm[] {
  const courseForms = data.theoryForms.filter((f) => f.training_id === app.training_id).sort((a, b) => a.id - b.id);
  const startedIds = new Set(
    data.myAttempts.filter((a) => a.training_id === app.training_id && a.test_form_id).map((a) => a.test_form_id)
  );
  const started = courseForms.filter((f) => startedIds.has(f.id));
  if (started.length) return started;

  const pick = (list: TestForm[]) => (list.length ? [list[(app.user_id * 2654435761 + app.id * 40503) % list.length]] : []);
  const open = courseForms.filter((f) => isFormOpen(f, now));
  if (open.length) return pick(open);
  return pick(courseForms.filter((f) => f.is_active));
}

export function isFormOpen(form: TestForm, now = Date.now()): boolean {
  if (!form.is_active) return false;
  if (form.exam_start_date && now < new Date(form.exam_start_date).getTime()) return false;
  if (form.exam_end_date && now > new Date(form.exam_end_date).getTime()) return false;
  return true;
}

export function bestAttempt(list: ExamAttempt[]): ExamAttempt | undefined {
  return list
    .filter((a) => a.status !== 'in_progress')
    .sort((a, b) => Number(b.percent) - Number(a.percent) || +new Date(b.submitted_at || 0) - +new Date(a.submitted_at || 0))[0];
}

// ---------------------------------------------------------------------
// Candidate journey (6 steps)
// ---------------------------------------------------------------------

export type StepState = 'done' | 'current' | 'upcoming' | 'error' | 'skipped';

export interface JourneyStep {
  key: string;
  label: string;
  state: StepState;
  note?: string;
}

export interface NextAction {
  label: string;
  href?: string;
  tone: 'primary' | 'dark' | 'outline';
  note?: string;
}

export function buildJourney(app: TrainingApplication, data: StudentData): { steps: JourneyStep[]; next: NextAction | null } {
  const theory = assignedTheoryForms(app, data);
  const hasPractical = data.practicalForms.some((f) => f.training_id === app.training_id);
  const tries = data.myAttempts.filter((a) => a.training_id === app.training_id);
  const finished = tries.filter((a) => a.status !== 'in_progress');
  const inProgress = tries.find((a) => a.status === 'in_progress');
  const round = app.practical_round_id ? data.myRounds.get(app.practical_round_id) : undefined;
  const eligible = app.status === 'อนุมัติ';
  const sentOrDone = app.approval_status === 'submitted' || app.approval_status === 'approved';

  const steps: JourneyStep[] = [];
  steps.push({ key: 'apply', label: 'สมัคร', state: 'done' });
  steps.push({
    key: 'eligible',
    label: 'ได้รับสิทธิ์สอบ',
    state: app.status === 'อนุมัติ' ? 'done' : app.status === 'ปฏิเสธ' ? 'error' : 'current',
    note: app.status === 'รอพิจารณา' ? 'รอตรวจสอบ' : undefined,
  });

  const theoryState: StepState =
    theory.length === 0
      ? 'skipped'
      : finished.length > 0 || sentOrDone
        ? 'done'
        : eligible
          ? 'current'
          : 'upcoming';
  steps.push({
    key: 'theory',
    label: 'สอบทฤษฎี',
    state: theoryState,
    note: theory.length === 0 ? 'ไม่มีสอบ' : finished.some((a) => a.needs_review) ? 'รอตรวจข้อเขียน' : undefined,
  });

  const practicalState: StepState = !hasPractical
    ? 'skipped'
    : sentOrDone || app.practical_score != null
      ? 'done'
      : eligible && (theoryState === 'done' || theoryState === 'skipped' || round)
        ? 'current'
        : 'upcoming';
  steps.push({
    key: 'practical',
    label: 'ประเมินปฏิบัติ',
    state: practicalState,
    note: !hasPractical ? 'ไม่มีสอบ' : practicalState === 'current' && !round ? 'รอจัดรอบ' : undefined,
  });

  steps.push({
    key: 'approval',
    label: 'ผอ.อนุมัติ',
    state:
      app.approval_status === 'approved'
        ? 'done'
        : app.approval_status === 'rejected'
          ? 'error'
          : app.approval_status === 'submitted'
            ? 'current'
            : 'upcoming',
  });
  steps.push({
    key: 'certificate',
    label: 'รับใบประกาศ',
    state: app.certificate_no ? 'done' : app.approval_status === 'approved' ? 'error' : 'upcoming',
    note: app.approval_status === 'approved' && !app.certificate_no ? 'ไม่ผ่านเกณฑ์' : undefined,
  });

  let next: NextAction | null = null;
  if (app.certificate_no) next = { label: 'พิมพ์ใบประกาศนียบัตร', href: `/print/certificate/${app.id}`, tone: 'primary' };
  else if (app.status === 'ปฏิเสธ') next = { label: 'ดูหลักสูตรอื่น', href: '/courses?tab=open', tone: 'outline', note: 'ใบสมัครไม่ผ่านการคัดเลือก' };
  else if (app.status === 'รอพิจารณา')
    next = { label: 'พิมพ์ใบสมัคร', href: `/print/application?course=${app.training_id}`, tone: 'outline', note: 'เจ้าหน้าที่กำลังตรวจสอบใบสมัคร' };
  else if (inProgress) next = { label: 'ทำข้อสอบต่อ', href: `/exam/${inProgress.id}`, tone: 'primary', note: 'มีข้อสอบที่ทำค้างไว้' };
  else if (theoryState === 'current' && theory.some((f) => formStatus(f, app, data.myAttempts).state === 'open'))
    next = { label: 'เริ่มสอบภาคทฤษฎี', href: '/courses', tone: 'primary' };
  else if (app.approval_status === 'submitted') next = { label: 'ดูผลสอบ', href: '/results', tone: 'outline', note: 'รอผู้อำนวยการอนุมัติผล' };
  else if (app.approval_status === 'approved') next = { label: 'ดูผลสอบ', href: '/results', tone: 'outline' };
  else if (finished.length > 0 || round) next = { label: 'ดูผลสอบ', href: '/results', tone: 'outline' };
  else next = { label: 'ดูรายละเอียดหลักสูตร', href: '/courses', tone: 'outline' };

  return { steps, next };
}

export const DOC_FIELDS = [
  { field: 'identification_file_pathname', label: 'สำเนาบัตรประชาชน' },
  { field: 'eq_file_pathname', label: 'สำเนาวุฒิการศึกษา' },
  { field: 'id_photo_file_pathname', label: 'รูปถ่าย 1.5 นิ้ว' },
] as const;

export function missingDocuments(user: User) {
  return DOC_FIELDS.filter((d) => !user[d.field]);
}
