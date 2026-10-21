'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, ClipboardCheck, Clock, MapPin } from 'lucide-react';
import { applications, courses, forms, rounds, scores, users } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import { fullName, thaiDate } from '@/lib/format';
import type { PracticalRound, TestForm, TrainingCourse, User } from '@/lib/types';
import { Avatar, Badge, Callout, Card, EmptyState, PageHeader, Progress, Skeleton } from '@/components/ui';

interface RoundCard {
  round: PracticalRound;
  course: TrainingCourse | undefined;
  form: TestForm | undefined;
  coEvaluators: User[];
  candidates: number;
  mineSubmitted: number;
  mineDraft: number;
}

async function load(userId: number): Promise<RoundCard[]> {
  const mine = await rounds.list({ evaluatorId: userId });
  if (mine.length === 0) return [];
  const trainingIds = Array.from(new Set(mine.map((r) => r.training_id)));
  const [allCourses, allForms, apps, myScores, people] = await Promise.all([
    courses.list(),
    Promise.all(trainingIds.map((id) => forms.list({ trainingId: id, type: 'practical' }))).then((x) => x.flat()),
    Promise.all(trainingIds.map((id) => applications.list({ trainingId: id }))).then((x) => x.flat()),
    scores.list({ roundIds: mine.map((r) => r.id), evaluatorId: userId }),
    users.byIds(Array.from(new Set(mine.flatMap((r) => r.evaluator_ids)))),
  ]);
  return mine.map((round) => {
    const roundApps = apps.filter((a) => a.practical_round_id === round.id && a.status === 'อนุมัติ');
    const appIds = new Set(roundApps.map((a) => a.id));
    const s = myScores.filter((x) => x.round_id === round.id && appIds.has(x.application_id));
    return {
      round,
      course: allCourses.find((c) => c.id === round.training_id),
      form: allForms.find((f) => f.id === round.test_form_id),
      coEvaluators: round.evaluator_ids.map((id) => people.find((p) => p.id === id)).filter(Boolean) as User[],
      candidates: roundApps.length,
      mineSubmitted: s.filter((x) => x.status === 'submitted').length,
      mineDraft: s.filter((x) => x.status === 'draft').length,
    };
  });
}

function isPast(r: PracticalRound) {
  if (r.status === 'closed') return true;
  if (!r.exam_date) return false;
  const d = new Date(r.exam_date + 'T23:59:59');
  return d.getTime() < Date.now();
}

export default function EvaluatePage() {
  const me = useUser();
  const { data, loading, error } = useLoad(() => load(me.id), [me.id]);

  const upcoming = (data || []).filter((c) => !isPast(c.round) || c.mineSubmitted < c.candidates);
  const past = (data || []).filter((c) => isPast(c.round) && c.mineSubmitted >= c.candidates);
  const todo = (data || []).reduce((s, c) => s + Math.max(0, c.candidates - c.mineSubmitted), 0);

  return (
    <>
      <PageHeader
        eyebrow="ผู้ประเมิน"
        title="งานประเมินภาคปฏิบัติ"
        description="รอบสอบที่คุณได้รับมอบหมาย คะแนนภาคปฏิบัติของผู้สอบคือค่าเฉลี่ยจากผู้ประเมินทุกท่านในรอบ (สูงสุด 3 ท่าน)"
        actions={todo > 0 ? <Badge tone="amber" dot>รอประเมิน {todo} คน</Badge> : undefined}
      />

      {error && <Callout tone="red" className="mb-6">{error}</Callout>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="space-y-4 p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </Card>
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="ยังไม่มีรอบสอบที่มอบหมายให้คุณ"
            description="เมื่อเจ้าหน้าที่กำหนดให้คุณเป็นผู้ประเมินในรอบสอบปฏิบัติ รายการจะปรากฏที่นี่"
          />
        </Card>
      ) : (
        <div className="space-y-10">
          {[
            { title: 'กำลังดำเนินการ', items: upcoming },
            { title: 'เสร็จสิ้นแล้ว', items: past },
          ]
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <section key={g.title}>
                <h2 className="mb-3 text-sm font-semibold text-zinc-500">{g.title}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {g.items.map((c) => (
                    <RoundTile key={c.round.id} c={c} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </>
  );
}

function RoundTile({ c }: { c: RoundCard }) {
  const done = c.candidates > 0 && c.mineSubmitted >= c.candidates;
  return (
    <Link
      href={`/evaluate/${c.round.id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow truncate">{c.course?.course_name || 'หลักสูตร'}</div>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{c.round.name}</h3>
          <p className="mt-0.5 truncate text-sm text-zinc-500">{c.form?.title || '—'}</p>
        </div>
        {done ? (
          <Badge tone="green" dot>ครบแล้ว</Badge>
        ) : c.round.status === 'closed' ? (
          <Badge>ปิดรอบ</Badge>
        ) : (
          <Badge tone="amber" dot>
            เหลือ {Math.max(0, c.candidates - c.mineSubmitted)}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          {thaiDate(c.round.exam_date)}
        </span>
        {c.round.start_time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-zinc-400" />
            {c.round.start_time} น.
          </span>
        )}
        {c.round.location && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="truncate">{c.round.location}</span>
          </span>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-[0.8125rem]">
          <span className="text-zinc-500">ความคืบหน้าของคุณ</span>
          <span className="font-medium tabular text-zinc-900">
            {c.mineSubmitted}/{c.candidates} คน{c.mineDraft > 0 && <span className="font-normal text-zinc-400"> · ร่าง {c.mineDraft}</span>}
          </span>
        </div>
        <Progress value={c.mineSubmitted} max={Math.max(1, c.candidates)} tone={done ? 'green' : 'red'} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <div className="flex -space-x-2">
          {c.coEvaluators.map((u) => (
            <span key={u.id} title={fullName(u)}>
              <Avatar name={u.first_name_th} size="sm" />
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900">
          เปิดใบให้คะแนน
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
