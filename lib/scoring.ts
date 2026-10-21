// =====================================================================
// Scoring engine — pure functions shared by the exam page, grading UI,
// evaluator sheets and the results / approval workflow.
// =====================================================================

import type {
  AnswerMap,
  AnswerValue,
  ExamQuestion,
  PracticalItem,
  PracticalScore,
  ResultStatus,
} from './types';

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export const pct = (score: number, max: number) => (max > 0 ? round2((score / max) * 100) : 0);

/** Normalise free text for short-answer comparison (case, spacing, zero-width chars). */
export function normalizeText(s: string): string {
  return String(s ?? '')
    .replace(/[​-‍﻿]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export const isManualQuestion = (q: ExamQuestion) => q.type === 'text_choices';

export function questionMax(q: ExamQuestion): number {
  return Math.max(0, Number(q.score) || 0);
}

export function isAnswered(q: ExamQuestion, a: AnswerValue | undefined): boolean {
  if (a === undefined || a === null) return false;
  switch (q.type) {
    case 'multiple_choices':
      return Array.isArray(a) && a.length > 0;
    case 'true_false':
      return typeof a === 'boolean';
    case 'matching': {
      const pairs = q.matching_pairs || [];
      if (typeof a !== 'object' || Array.isArray(a)) return false;
      return pairs.length > 0 && pairs.every((p) => Boolean((a as Record<string, string>)[p.id]));
    }
    default:
      return String(a).trim().length > 0;
  }
}

export interface QuestionGrade {
  earned: number;
  max: number;
  /** true / false once graded; null while a manual question awaits review. */
  correct: boolean | null;
  pending: boolean;
}

export function gradeQuestion(
  q: ExamQuestion,
  a: AnswerValue | undefined,
  manualScore?: number
): QuestionGrade {
  const max = questionMax(q);
  const result = (earned: number): QuestionGrade => ({
    earned: round2(Math.min(max, Math.max(0, earned))),
    max,
    correct: earned >= max && max > 0,
    pending: false,
  });

  switch (q.type) {
    case 'single_choices': {
      const correct = (q.choices || []).find((c) => c.is_correct);
      return result(correct && a === correct.id ? max : 0);
    }
    case 'multiple_choices': {
      const correctIds = new Set((q.choices || []).filter((c) => c.is_correct).map((c) => c.id));
      const picked = new Set(Array.isArray(a) ? a : []);
      if (correctIds.size === 0) return result(0);
      if (q.partial_credit) {
        let right = 0;
        let wrong = 0;
        picked.forEach((id) => (correctIds.has(id) ? right++ : wrong++));
        return result(((right - wrong) / correctIds.size) * max);
      }
      const exact = picked.size === correctIds.size && Array.from(picked).every((id) => correctIds.has(id));
      return result(exact ? max : 0);
    }
    case 'true_false':
      return result(typeof a === 'boolean' && a === Boolean(q.true_false_answer) ? max : 0);
    case 'matching': {
      const pairs = q.matching_pairs || [];
      if (pairs.length === 0) return result(0);
      const map = a && typeof a === 'object' && !Array.isArray(a) ? (a as Record<string, string>) : {};
      const right = pairs.filter((p) => map[p.id] === p.id).length;
      return result((right / pairs.length) * max);
    }
    case 'short_answer': {
      const given = normalizeText(String(a ?? ''));
      const accepted = (q.accepted_answers || []).map(normalizeText).filter(Boolean);
      return result(given && accepted.includes(given) ? max : 0);
    }
    case 'text_choices': {
      if (manualScore === undefined || manualScore === null || Number.isNaN(Number(manualScore))) {
        return { earned: 0, max, correct: null, pending: true };
      }
      const earned = round2(Math.min(max, Math.max(0, Number(manualScore))));
      return { earned, max, correct: earned >= max, pending: false };
    }
    default:
      return result(0);
  }
}

export interface AttemptGrade {
  autoScore: number;
  score: number;
  max: number;
  percent: number;
  passed: boolean | null;
  needsReview: boolean;
  perQuestion: Record<string, QuestionGrade>;
}

export function gradeAttempt(
  questions: ExamQuestion[],
  answers: AnswerMap,
  manualScores: Record<string, number>,
  passingPercentage: number
): AttemptGrade {
  let autoScore = 0;
  let score = 0;
  let max = 0;
  let needsReview = false;
  const perQuestion: Record<string, QuestionGrade> = {};

  for (const q of questions) {
    const key = String(q.id);
    const g = gradeQuestion(q, answers[key], manualScores[key]);
    perQuestion[key] = g;
    max += g.max;
    score += g.earned;
    if (!isManualQuestion(q)) autoScore += g.earned;
    // an unanswered essay gets 0 automatically — nothing to review
    if (g.pending && isAnswered(q, answers[key])) needsReview = true;
    if (g.pending && !isAnswered(q, answers[key])) perQuestion[key] = { earned: 0, max: g.max, correct: false, pending: false };
  }

  const percent = pct(score, max);
  return {
    autoScore: round2(autoScore),
    score: round2(score),
    max: round2(max),
    percent,
    passed: needsReview ? null : percent >= Number(passingPercentage || 0),
    needsReview,
    perQuestion,
  };
}

// ---------------------------------------------------------------------
// Practical criteria tree — scores are entered on leaves; a parent's
// maximum is always the sum of its children.
// ---------------------------------------------------------------------

export function isLeaf(item: PracticalItem) {
  return !item.children || item.children.length === 0;
}

export function itemMax(item: PracticalItem): number {
  if (isLeaf(item)) return Math.max(0, Number(item.max_score) || 0);
  return round2(item.children!.reduce((s, c) => s + itemMax(c), 0));
}

export function treeMax(items: PracticalItem[]): number {
  return round2(items.reduce((s, i) => s + itemMax(i), 0));
}

export function leafItems(items: PracticalItem[]): PracticalItem[] {
  return items.flatMap((i) => (isLeaf(i) ? [i] : leafItems(i.children!)));
}

export function itemEarned(item: PracticalItem, scores: Record<string, number>): number {
  if (isLeaf(item)) {
    const v = Number(scores[String(item.id)]);
    return Number.isFinite(v) ? Math.min(itemMax(item), Math.max(0, v)) : 0;
  }
  return round2(item.children!.reduce((s, c) => s + itemEarned(c, scores), 0));
}

export function treeEarned(items: PracticalItem[], scores: Record<string, number>): number {
  return round2(items.reduce((s, i) => s + itemEarned(i, scores), 0));
}

/** Leaves the evaluator has not scored yet. */
export function missingLeaves(items: PracticalItem[], scores: Record<string, number>): PracticalItem[] {
  return leafItems(items).filter((l) => !Number.isFinite(Number(scores[String(l.id)])) || scores[String(l.id)] === undefined);
}

/** Recompute parent max scores so the stored tree is always self-consistent. */
export function normalizeTree(items: PracticalItem[]): PracticalItem[] {
  return items.map((i) =>
    isLeaf(i)
      ? { ...i, children: [], max_score: Math.max(0, Number(i.max_score) || 0) }
      : { ...i, children: normalizeTree(i.children!), max_score: itemMax(i) }
  );
}

export const REQUIRED_EVALUATORS = 3;

export interface PracticalAverage {
  /** Average of submitted evaluator totals (null when nobody has submitted). */
  average: number | null;
  max: number;
  submitted: number;
  required: number;
  complete: boolean;
  totals: { evaluator_id: number; total: number }[];
}

/**
 * Practical score = sum of the evaluators' totals ÷ number of evaluators.
 * The result is only "complete" when every assigned evaluator (up to 3) has submitted.
 */
export function averagePractical(scores: PracticalScore[], evaluatorIds: number[], max: number): PracticalAverage {
  const assigned = evaluatorIds.length > 0 ? evaluatorIds : [];
  const submitted = scores.filter((s) => s.status === 'submitted' && assigned.includes(s.evaluator_id));
  const totals = submitted.map((s) => ({ evaluator_id: s.evaluator_id, total: round2(s.total) }));
  const average = totals.length ? round2(totals.reduce((a, t) => a + t.total, 0) / totals.length) : null;
  return {
    average,
    max,
    submitted: totals.length,
    required: assigned.length,
    complete: assigned.length > 0 && totals.length === assigned.length,
    totals,
  };
}

// ---------------------------------------------------------------------
// Final result for a candidate in a course
// ---------------------------------------------------------------------

export interface PartResult {
  score: number | null;
  max: number;
  passingPercentage: number;
  /** false when the part is still waiting for data (no attempt, essays to grade, evaluators missing) */
  ready: boolean;
}

export interface FinalResult {
  theoryPassed: boolean | null;
  practicalPassed: boolean | null;
  status: ResultStatus;
  ready: boolean;
}

export function partPassed(p: PartResult | null): boolean | null {
  if (!p) return null;
  if (!p.ready || p.score === null) return null;
  return pct(p.score, p.max) >= p.passingPercentage;
}

/** A course passes when every part it has (theory and/or practical) is passed. */
export function computeFinal(theory: PartResult | null, practical: PartResult | null): FinalResult {
  const t = partPassed(theory);
  const p = partPassed(practical);
  const parts = [theory ? t : undefined, practical ? p : undefined].filter((x) => x !== undefined) as (boolean | null)[];
  const ready = parts.length > 0 && parts.every((x) => x !== null);
  let status: ResultStatus = 'pending';
  if (parts.some((x) => x === false)) status = 'failed';
  else if (ready) status = 'passed';
  return { theoryPassed: t, practicalPassed: p, status, ready: ready || status === 'failed' };
}

// ---------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------

/** Deterministic shuffle (mulberry32) so a candidate always sees the same order. */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed >>> 0 || 1;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build the immutable question list a candidate will answer (applies randomisation once). */
export function buildQuestionSnapshot(
  questions: ExamQuestion[],
  opts: { randomizeQuestions?: boolean; randomizeChoices?: boolean; seed: number }
): ExamQuestion[] {
  let qs = questions.map((q) => ({ ...q, choices: [...(q.choices || [])], matching_pairs: [...(q.matching_pairs || [])] }));
  if (opts.randomizeQuestions) qs = seededShuffle(qs, opts.seed);
  if (opts.randomizeChoices) {
    qs = qs.map((q, i) =>
      q.type === 'single_choices' || q.type === 'multiple_choices'
        ? { ...q, choices: seededShuffle(q.choices, opts.seed + i + 1) }
        : q
    );
  }
  return qs;
}

/** Validate a question before saving; returns a Thai error message or null. */
export function validateQuestion(q: ExamQuestion, index: number): string | null {
  const n = `ข้อที่ ${index + 1}`;
  if (!q.question_text?.trim()) return `${n}: ยังไม่ได้พิมพ์โจทย์`;
  if (!(Number(q.score) > 0)) return `${n}: คะแนนต้องมากกว่า 0`;
  switch (q.type) {
    case 'single_choices':
    case 'multiple_choices': {
      const choices = q.choices || [];
      if (choices.length < 2) return `${n}: ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก`;
      if (choices.some((c) => !c.choice_text.trim())) return `${n}: มีตัวเลือกที่ยังว่างอยู่`;
      const correct = choices.filter((c) => c.is_correct).length;
      if (correct === 0) return `${n}: ยังไม่ได้เลือกเฉลย`;
      if (q.type === 'single_choices' && correct > 1) return `${n}: ข้อแบบตัวเลือกเดียวต้องมีเฉลยเพียง 1 ข้อ`;
      return null;
    }
    case 'true_false':
      return typeof q.true_false_answer === 'boolean' ? null : `${n}: ยังไม่ได้เลือกเฉลย ถูก/ผิด`;
    case 'matching': {
      const pairs = q.matching_pairs || [];
      if (pairs.length < 2) return `${n}: ต้องมีคู่อย่างน้อย 2 คู่`;
      if (pairs.some((p) => !p.left_text.trim() || !p.right_text.trim())) return `${n}: มีคู่ที่ยังกรอกไม่ครบ`;
      return null;
    }
    case 'short_answer':
      return (q.accepted_answers || []).some((a) => a.trim()) ? null : `${n}: ต้องระบุคำตอบที่ยอมรับอย่างน้อย 1 คำตอบ`;
    default:
      return null;
  }
}
