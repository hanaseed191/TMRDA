import type { Tone } from '@/components/ui';
import type { TrainingCourse } from '@/lib/types';

export type CoursePhase = 'upcoming' | 'running' | 'ended' | 'undated';

function day(v?: string | null): number | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

export function coursePhase(c: TrainingCourse, now = Date.now()): CoursePhase {
  const s = day(c.startswith_date);
  const e = day(c.endswith_date);
  if (s === null && e === null) return 'undated';
  const today = new Date(now);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (s !== null && t < s) return 'upcoming';
  if (e !== null && t > e) return 'ended';
  return 'running';
}

export const PHASE_META: Record<CoursePhase, { label: string; tone: Tone }> = {
  upcoming: { label: 'ยังไม่เริ่ม', tone: 'blue' },
  running: { label: 'กำลังอบรม', tone: 'green' },
  ended: { label: 'สิ้นสุดแล้ว', tone: 'neutral' },
  undated: { label: 'ยังไม่กำหนดวัน', tone: 'amber' },
};
