// Run with: npm test   (Node 22.6+ strips TypeScript types natively)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  averagePractical,
  buildQuestionSnapshot,
  computeFinal,
  gradeAttempt,
  gradeQuestion,
  itemMax,
  missingLeaves,
  normalizeTree,
  treeEarned,
  treeMax,
  validateQuestion,
} from '../lib/scoring.ts';

const single = {
  id: 1, type: 'single_choices', question_text: 'q', score: 2,
  choices: [{ id: 'a', choice_text: 'A', is_correct: false }, { id: 'b', choice_text: 'B', is_correct: true }],
};
const multi = {
  id: 2, type: 'multiple_choices', question_text: 'q', score: 4,
  choices: [
    { id: 'a', choice_text: 'A', is_correct: true },
    { id: 'b', choice_text: 'B', is_correct: true },
    { id: 'c', choice_text: 'C', is_correct: false },
  ],
};
const tf = { id: 3, type: 'true_false', question_text: 'q', score: 1, choices: [], true_false_answer: false };
const match = {
  id: 4, type: 'matching', question_text: 'q', score: 3, choices: [],
  // duplicate right-hand text must not break grading (pairs are matched by id)
  matching_pairs: [
    { id: 'p1', left_text: 'L1', right_text: 'same' },
    { id: 'p2', left_text: 'L2', right_text: 'same' },
    { id: 'p3', left_text: 'L3', right_text: 'R3' },
  ],
};
const short = { id: 5, type: 'short_answer', question_text: 'q', score: 2, choices: [], accepted_answers: ['HTML', 'ภาษา html'] };
const essay = { id: 6, type: 'text_choices', question_text: 'q', score: 5, choices: [] };

test('single choice', () => {
  assert.equal(gradeQuestion(single, 'b').earned, 2);
  assert.equal(gradeQuestion(single, 'a').earned, 0);
  assert.equal(gradeQuestion(single, undefined).earned, 0);
});

test('multiple choice: exact match by default, order independent', () => {
  assert.equal(gradeQuestion(multi, ['b', 'a']).earned, 4);
  assert.equal(gradeQuestion(multi, ['a']).earned, 0);
  assert.equal(gradeQuestion(multi, ['a', 'b', 'c']).earned, 0);
});

test('multiple choice: partial credit subtracts wrong picks and never goes negative', () => {
  const q = { ...multi, partial_credit: true };
  assert.equal(gradeQuestion(q, ['a']).earned, 2);
  assert.equal(gradeQuestion(q, ['a', 'c']).earned, 0);
  assert.equal(gradeQuestion(q, ['c']).earned, 0);
});

test('true/false distinguishes false from unanswered', () => {
  assert.equal(gradeQuestion(tf, false).earned, 1);
  assert.equal(gradeQuestion(tf, true).earned, 0);
  assert.equal(gradeQuestion(tf, undefined).earned, 0);
});

test('matching is proportional and keyed by pair id', () => {
  assert.equal(gradeQuestion(match, { p1: 'p1', p2: 'p2', p3: 'p3' }).earned, 3);
  assert.equal(gradeQuestion(match, { p1: 'p2', p2: 'p1', p3: 'p3' }).earned, 1);
});

test('short answer ignores case and extra spaces', () => {
  assert.equal(gradeQuestion(short, '  html ').earned, 2);
  assert.equal(gradeQuestion(short, 'ภาษา   HTML').earned, 2);
  assert.equal(gradeQuestion(short, 'css').earned, 0);
});

test('essay stays pending until graded, then is clamped', () => {
  assert.equal(gradeQuestion(essay, 'answer').pending, true);
  assert.equal(gradeQuestion(essay, 'answer', 9).earned, 5);
});

test('attempt with an answered essay needs review and has no pass/fail yet', () => {
  const g = gradeAttempt([single, essay], { 1: 'b', 6: 'my essay' }, {}, 50);
  assert.equal(g.needsReview, true);
  assert.equal(g.passed, null);
  assert.equal(g.score, 2);
  assert.equal(g.max, 7);
  const graded = gradeAttempt([single, essay], { 1: 'b', 6: 'my essay' }, { 6: 3 }, 50);
  assert.equal(graded.needsReview, false);
  assert.equal(graded.score, 5);
  assert.equal(graded.passed, true);
});

test('unanswered essay scores 0 without blocking the result', () => {
  const g = gradeAttempt([single, essay], { 1: 'b' }, {}, 20);
  assert.equal(g.needsReview, false);
  assert.equal(g.passed, true);
});

test('passing threshold is inclusive', () => {
  const g = gradeAttempt([single, tf], { 1: 'b' }, {}, 66.66);
  assert.equal(g.percent, 66.67);
  assert.equal(g.passed, true);
});

test('snapshot shuffling is deterministic per seed and keeps every question', () => {
  const qs = [single, multi, tf, match, short, essay];
  const a = buildQuestionSnapshot(qs, { randomizeQuestions: true, randomizeChoices: true, seed: 42 });
  const b = buildQuestionSnapshot(qs, { randomizeQuestions: true, randomizeChoices: true, seed: 42 });
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id));
  assert.deepEqual([...a.map((q) => q.id)].sort(), [1, 2, 3, 4, 5, 6]);
});

const tree = [
  { id: 1, item_name: 'หมวด 1', max_score: 999, children: [
    { id: 11, item_name: '1.1', max_score: 10 },
    { id: 12, item_name: '1.2', max_score: 999, children: [{ id: 121, item_name: '1.2.1', max_score: 5 }, { id: 122, item_name: '1.2.2', max_score: 5 }] },
  ] },
  { id: 2, item_name: 'หมวด 2', max_score: 20 },
];

test('practical tree: parent max is the sum of leaves', () => {
  assert.equal(itemMax(tree[0]), 20);
  assert.equal(treeMax(tree), 40);
  assert.equal(normalizeTree(tree)[0].max_score, 20);
});

test('practical tree: earned score is clamped per leaf', () => {
  assert.equal(treeEarned(tree, { 11: 8, 121: 99, 122: 2, 2: 15 }), 30);
  assert.deepEqual(missingLeaves(tree, { 11: 8 }).map((l) => l.id), [121, 122, 2]);
});

test('practical average divides by the evaluators who submitted; complete only when all 3 did', () => {
  const s = (evaluator_id, total, status = 'submitted') => ({ evaluator_id, total, status });
  const partial = averagePractical([s(7, 30), s(8, 33)], [7, 8, 9], 40);
  assert.equal(partial.complete, false);
  assert.equal(partial.average, 31.5);
  const full = averagePractical([s(7, 30), s(8, 33), s(9, 36), s(99, 0)], [7, 8, 9], 40);
  assert.equal(full.complete, true);
  assert.equal(full.average, 33);
  const withDraft = averagePractical([s(7, 30), s(8, 33), s(9, 36, 'draft')], [7, 8, 9], 40);
  assert.equal(withDraft.complete, false);
});

test('final result: every existing part must pass; any failure fails immediately', () => {
  const part = (score, max, ready = true) => ({ score, max, passingPercentage: 60, ready });
  assert.equal(computeFinal(part(70, 100), part(30, 40)).status, 'passed');
  assert.equal(computeFinal(part(50, 100), part(null, 40, false)).status, 'failed');
  assert.equal(computeFinal(part(70, 100), part(null, 40, false)).status, 'pending');
  assert.equal(computeFinal(part(70, 100), null).status, 'passed');
  assert.equal(computeFinal(null, null).status, 'pending');
});

test('question validation catches missing answer keys', () => {
  assert.match(validateQuestion({ ...single, choices: single.choices.map((c) => ({ ...c, is_correct: false })) }, 0), /เฉลย/);
  assert.match(validateQuestion({ ...short, accepted_answers: [' '] }, 0), /คำตอบที่ยอมรับ/);
  assert.equal(validateQuestion(single, 0), null);
});
