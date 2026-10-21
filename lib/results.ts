// =====================================================================
// Course results — joins applications, theory attempts, practical rounds
// and evaluator scores into one row per eligible candidate.
// All data is fetched in a handful of batched queries (no N+1).
// =====================================================================

import { applications, attempts, courses, forms, rounds, scores, users } from './api';
import { averagePractical, computeFinal, treeMax, type FinalResult, type PracticalAverage } from './scoring';
import type {
  ExamAttempt,
  PracticalRound,
  PracticalScore,
  TestForm,
  TrainingApplication,
  TrainingCourse,
  User,
} from './types';

export interface TheoryPart {
  attempt: ExamAttempt | null;
  attemptCount: number;
  score: number | null;
  max: number;
  percent: number | null;
  passingPercentage: number;
  needsReview: boolean;
  /** An attempt is currently being taken. */
  inProgress: boolean;
  /** The current result is not a pass and the candidate may still sit the exam again. */
  canRetake: boolean;
  ready: boolean;
}

export interface EvaluatorScore {
  evaluator: User | null;
  evaluator_id: number;
  score: PracticalScore | null;
}

export interface PracticalPart {
  round: PracticalRound | null;
  form: TestForm | null;
  evaluators: EvaluatorScore[];
  average: PracticalAverage | null;
  score: number | null;
  max: number;
  passingPercentage: number;
  ready: boolean;
}

export interface CandidateResult {
  application: TrainingApplication;
  user: User | null;
  theory: TheoryPart | null;
  practical: PracticalPart | null;
  final: FinalResult;
}

export interface CourseResults {
  course: TrainingCourse;
  theoryForms: TestForm[];
  practicalForms: TestForm[];
  rounds: PracticalRound[];
  evaluators: User[];
  rows: CandidateResult[];
}

/**
 * Pick the attempt that decides the theory result:
 * a passing graded attempt wins; otherwise an attempt awaiting essay review
 * (it may still pass); otherwise the best graded attempt.
 */
export function pickTheoryAttempt(list: ExamAttempt[]): ExamAttempt | null {
  const done = list.filter((a) => a.status !== 'in_progress');
  const graded = done.filter((a) => !a.needs_review).sort((a, b) => Number(b.percent) - Number(a.percent));
  if (graded[0]?.passed) return graded[0];
  const review = done.filter((a) => a.needs_review).sort((a, b) => Number(b.percent) - Number(a.percent));
  return review[0] || graded[0] || null;
}

export function isTheoryFormOpen(form: TestForm, now = Date.now()): boolean {
  if (!form.is_active) return false;
  if (form.exam_start_date && now < new Date(form.exam_start_date).getTime()) return false;
  if (form.exam_end_date && now > new Date(form.exam_end_date).getTime()) return false;
  return true;
}

/**
 * Can the candidate still sit a theory set? Uses the set they already attempted
 * (sets are sticky per candidate); with no attempt yet, any open set counts.
 */
export function canRetakeTheory(list: ExamAttempt[], theoryForms: TestForm[], now = Date.now()): boolean {
  const attemptedIds = new Set(list.map((a) => a.test_form_id).filter((x): x is number => !!x));
  const candidates = attemptedIds.size ? theoryForms.filter((f) => attemptedIds.has(f.id)) : theoryForms;
  return candidates.some(
    (f) => isTheoryFormOpen(f, now) && list.filter((a) => a.test_form_id === f.id).length < Math.max(1, f.max_attempts || 1)
  );
}

export function theoryPart(list: ExamAttempt[], fallbackPassing: number, theoryForms: TestForm[] = []): TheoryPart {
  const attempt = pickTheoryAttempt(list);
  const inProgress = list.some((a) => a.status === 'in_progress');
  const retake = canRetakeTheory(list, theoryForms);
  if (!attempt) {
    return {
      attempt: null,
      attemptCount: list.length,
      score: null,
      max: 0,
      percent: null,
      passingPercentage: fallbackPassing,
      needsReview: false,
      inProgress,
      canRetake: retake,
      ready: false,
    };
  }
  const failed = !attempt.needs_review && attempt.passed === false;
  const canRetake = failed && retake;
  return {
    attempt,
    attemptCount: list.length,
    score: Number(attempt.score),
    max: Number(attempt.max_score),
    percent: Number(attempt.percent),
    passingPercentage: Number(attempt.passing_percentage),
    needsReview: attempt.needs_review,
    inProgress,
    canRetake,
    // A pass is final; a fail is final only once no retake is possible and nothing is in progress.
    ready: !attempt.needs_review && (attempt.passed === true || (!inProgress && !canRetake)),
  };
}

export async function buildCourseResults(trainingId: number): Promise<CourseResults> {
  const [course, allForms, apps, allRounds, fetchedAttempts] = await Promise.all([
    courses.get(trainingId),
    forms.list({ trainingId }),
    applications.list({ trainingId }),
    rounds.list({ trainingId }),
    attempts.list({ trainingId }),
  ]);
  // Attempts abandoned past their deadline are graded on the answers saved in time.
  const allAttempts = await attempts.finalizeExpired(fetchedAttempts);

  const eligible = apps.filter((a) => a.status === 'อนุมัติ');
  const theoryForms = allForms.filter((f) => f.exam_type === 'theory');
  const practicalForms = allForms.filter((f) => f.exam_type === 'practical');

  const evaluatorIds = Array.from(new Set(allRounds.flatMap((r) => r.evaluator_ids || [])));
  const [people, allScores] = await Promise.all([
    users.byIds(Array.from(new Set([...eligible.map((a) => a.user_id), ...evaluatorIds]))),
    scores.list({ roundIds: allRounds.map((r) => r.id) }),
  ]);
  const userById = new Map(people.map((u) => [u.id, u]));
  const formById = new Map(allForms.map((f) => [f.id, f]));
  const roundById = new Map(allRounds.map((r) => [r.id, r]));
  const defaultTheoryPassing = theoryForms[0]?.passing_percentage ?? 0;

  const rows: CandidateResult[] = eligible.map((application) => {
    let theory: TheoryPart | null = null;
    if (theoryForms.length > 0) {
      const mine = allAttempts.filter((a) => a.user_id === application.user_id && a.training_id === trainingId);
      theory = theoryPart(mine, defaultTheoryPassing, theoryForms);
    }

    let practical: PracticalPart | null = null;
    if (practicalForms.length > 0) {
      const round = application.practical_round_id ? roundById.get(application.practical_round_id) || null : null;
      const form = round ? formById.get(round.test_form_id) || null : null;
      const mine = round ? allScores.filter((s) => s.round_id === round.id && s.application_id === application.id) : [];
      // Evaluators scored against the tree as it was then (max_total); later form edits must not skew it.
      const scoredMax = mine
        .filter((s) => s.status === 'submitted' && Number(s.max_total) > 0)
        .map((s) => Number(s.max_total));
      const max = scoredMax.length ? Math.max(...scoredMax) : form ? treeMax(form.practical_items) : 0;
      const evaluators: EvaluatorScore[] = (round?.evaluator_ids || []).map((id) => ({
        evaluator_id: id,
        evaluator: userById.get(id) || null,
        score: mine.find((s) => s.evaluator_id === id) || null,
      }));
      const average = round ? averagePractical(mine, round.evaluator_ids || [], max) : null;
      practical = {
        round,
        form,
        evaluators,
        average,
        score: average?.complete ? average.average : null,
        max,
        passingPercentage: form?.passing_percentage ?? practicalForms[0].passing_percentage,
        ready: Boolean(average?.complete),
      };
    }

    const final = computeFinal(
      theory ? { score: theory.score, max: theory.max, passingPercentage: theory.passingPercentage, ready: theory.ready } : null,
      practical
        ? { score: practical.score, max: practical.max, passingPercentage: practical.passingPercentage, ready: practical.ready }
        : null
    );

    return { application, user: userById.get(application.user_id) || null, theory, practical, final };
  });

  rows.sort((a, b) => (a.user?.first_name_th || '').localeCompare(b.user?.first_name_th || '', 'th'));

  return {
    course,
    theoryForms,
    practicalForms,
    rounds: allRounds,
    evaluators: evaluatorIds.map((id) => userById.get(id)).filter(Boolean) as User[],
    rows,
  };
}

/** Snapshot payload for applications.submitForApproval(). */
export function snapshotOf(r: CandidateResult) {
  return {
    application_id: r.application.id,
    theory_score: r.theory?.score ?? null,
    theory_max: r.theory ? r.theory.max : null,
    theory_passed: r.final.theoryPassed,
    practical_score: r.practical?.score ?? null,
    practical_max: r.practical ? r.practical.max : null,
    practical_passed: r.final.practicalPassed,
    result_status: r.final.status,
  };
}

export function canSubmit(r: CandidateResult) {
  return r.final.ready && ['none', 'rejected'].includes(r.application.approval_status || 'none');
}
