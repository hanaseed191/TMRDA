import type { ExamAttempt, PracticalRound, PracticalScore, TestForm, TrainingApplication, TrainingCourse, User } from '@/lib/types';

export interface HubData {
  course: TrainingCourse;
  apps: TrainingApplication[];
  userMap: Map<number, User>;
  forms: TestForm[];
  attempts: ExamAttempt[];
  rounds: PracticalRound[];
  scores: PracticalScore[];
  staff: User[];
}

/** Best finished theory attempt for an application (highest percent; graded beats awaiting review). */
export function bestAttempt(attempts: ExamAttempt[], appId: number): ExamAttempt | undefined {
  return attempts
    .filter((a) => a.application_id === appId && a.status !== 'in_progress')
    .sort((a, b) => Number(b.status === 'graded') - Number(a.status === 'graded') || b.percent - a.percent)[0];
}
