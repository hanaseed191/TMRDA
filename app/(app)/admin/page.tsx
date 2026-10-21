'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  FileText,
  MapPin,
  PenLine,
  Plus,
  Stamp,
  UserCheck,
  Users,
} from 'lucide-react';
import { applications, attempts, courses, rounds, scores, users } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { useUser } from '@/lib/auth';
import { fullName, relativeTime, thaiDate, thaiDateRange } from '@/lib/format';
import type { TrainingApplication } from '@/lib/types';
import { Avatar, Badge, ButtonLink, Callout, Card, CardHeader, EmptyState, PageHeader, Skeleton, SkeletonRows, Stat } from '@/components/ui';
import { EnrollmentBadge } from '@/components/status';
import { coursePhase, PHASE_META } from '@/components/admin/courseState';

interface Todo {
  key: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  href: string;
  tone: string;
}

export default function AdminOverviewPage() {
  const me = useUser();
  const { data, loading, error } = useLoad(async () => {
    const [cs, apps, us, att, rs] = await Promise.all([
      courses.list(),
      applications.list(),
      users.list(),
      attempts.list(),
      rounds.list(),
    ]);
    const sc = await scores.list({ roundIds: rs.map((r) => r.id) });
    return { cs, apps, us, att, rs, sc };
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  if (error) {
    return (
      <>
        <PageHeader title="ภาพรวมระบบ" />
        <Callout tone="red" title="โหลดข้อมูลไม่สำเร็จ">
          {error}
        </Callout>
      </>
    );
  }

  const courseName = new Map((data?.cs || []).map((c) => [c.id, c.course_name]));
  const userMap = new Map((data?.us || []).map((u) => [u.id, u]));

  // ----- counters -----
  const pendingApps = (data?.apps || []).filter((a) => a.status === 'รอพิจารณา');
  const needsReview = (data?.att || []).filter((a) => a.needs_review && a.status === 'submitted');
  const submitted = (data?.apps || []).filter((a) => a.approval_status === 'submitted');
  const members = (data?.us || []).filter((u) => u.role === 'user');

  const incompleteRounds = (data?.rs || []).filter((r) => {
    if (r.status === 'closed') return false;
    const cands = (data?.apps || []).filter((a) => a.practical_round_id === r.id && a.approval_status !== 'approved');
    if (cands.length === 0 || r.evaluator_ids.length === 0) return false;
    const done = (data?.sc || []).filter(
      (s) => s.round_id === r.id && s.status === 'submitted' && cands.some((c) => c.id === s.application_id)
    ).length;
    return done < cands.length * r.evaluator_ids.length;
  });

  // ----- to-do list -----
  const todos: Todo[] = [];
  const groupBy = (list: TrainingApplication[]) =>
    list.reduce<Record<number, number>>((acc, a) => ((acc[a.training_id] = (acc[a.training_id] || 0) + 1), acc), {});
  Object.entries(groupBy(pendingApps)).forEach(([cid, n]) =>
    todos.push({
      key: `apps-${cid}`,
      icon: <UserCheck className="h-4 w-4" />,
      title: `ตรวจใบสมัคร ${n} รายการ`,
      detail: courseName.get(Number(cid)) || '',
      href: `/admin/courses/${cid}?tab=applicants`,
      tone: 'bg-amber-50 text-amber-600',
    })
  );
  Object.entries(
    needsReview.reduce<Record<number, number>>((acc, a) => ((acc[a.training_id] = (acc[a.training_id] || 0) + 1), acc), {})
  ).forEach(([cid, n]) =>
    todos.push({
      key: `review-${cid}`,
      icon: <PenLine className="h-4 w-4" />,
      title: `ตรวจข้อเขียน ${n} ชุด`,
      detail: courseName.get(Number(cid)) || '',
      href: `/admin/results?course=${cid}`,
      tone: 'bg-violet-50 text-violet-600',
    })
  );
  incompleteRounds.forEach((r) =>
    todos.push({
      key: `round-${r.id}`,
      icon: <ClipboardCheck className="h-4 w-4" />,
      title: `ติดตามคะแนนปฏิบัติ — ${r.name}`,
      detail: courseName.get(r.training_id) || '',
      href: `/admin/courses/${r.training_id}?tab=practical`,
      tone: 'bg-sky-50 text-sky-600',
    })
  );
  const roundsWithoutEvaluators = (data?.rs || []).filter((r) => r.status === 'open' && r.evaluator_ids.length < 3);
  roundsWithoutEvaluators.forEach((r) =>
    todos.push({
      key: `eval-${r.id}`,
      icon: <Users className="h-4 w-4" />,
      title: `กำหนดผู้ประเมินให้ครบ 3 ท่าน — ${r.name}`,
      detail: `${courseName.get(r.training_id) || ''} · มี ${r.evaluator_ids.length}/3 ท่าน`,
      href: `/admin/courses/${r.training_id}?tab=practical`,
      tone: 'bg-brand-50 text-brand-600',
    })
  );

  const recentApps = [...(data?.apps || [])]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingRounds = (data?.rs || [])
    .filter((r) => r.exam_date && r.exam_date >= today)
    .slice(0, 4);
  const activeCourses = (data?.cs || []).filter((c) => ['upcoming', 'running'].includes(coursePhase(c))).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow={thaiDate(new Date(), { full: true })}
        title={`${greet}, คุณ${me.first_name_th}`}
        description="ภาพรวมการฝึกอบรม การสอบ และงานที่รอดำเนินการ"
        actions={
          <>
            <ButtonLink href="/admin/results" variant="outline" icon={<FileText className="h-4 w-4" />}>
              ผลคะแนน
            </ButtonLink>
            <ButtonLink href="/admin/courses?new=1" icon={<Plus className="h-4 w-4" />}>
              สร้างหลักสูตร
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[118px] rounded-2xl" />)
        ) : (
          <>
            <Stat label="หลักสูตรทั้งหมด" value={data!.cs.length} icon={<BookOpen className="h-4 w-4" />} href="/admin/courses" />
            <Stat label="สมาชิกผู้สมัคร" value={members.length} icon={<Users className="h-4 w-4" />} href="/admin/users" />
            <Stat
              label="ใบสมัครรอตรวจ"
              value={pendingApps.length}
              tone={pendingApps.length ? 'amber' : 'neutral'}
              icon={<UserCheck className="h-4 w-4" />}
            />
            <Stat
              label="ข้อเขียนรอตรวจ"
              value={needsReview.length}
              tone={needsReview.length ? 'red' : 'neutral'}
              icon={<PenLine className="h-4 w-4" />}
              href="/admin/results"
            />
            <Stat
              label="รอบปฏิบัติคะแนนยังไม่ครบ"
              value={incompleteRounds.length}
              tone={incompleteRounds.length ? 'blue' : 'neutral'}
              icon={<ClipboardCheck className="h-4 w-4" />}
            />
            <Stat
              label="รอผอ.อนุมัติ"
              value={submitted.length}
              tone={submitted.length ? 'green' : 'neutral'}
              icon={<Stamp className="h-4 w-4" />}
              href="/admin/results"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader title="สิ่งที่ต้องทำ" description="งานค้างที่ต้องดำเนินการเพื่อให้ผู้สมัครได้รับผล" />
          {loading ? (
            <SkeletonRows rows={4} />
          ) : todos.length === 0 ? (
            <EmptyState
              compact
              icon={<CircleCheck className="h-5 w-5 text-emerald-600" />}
              title="ไม่มีงานค้าง"
              description="ใบสมัคร ข้อเขียน และคะแนนปฏิบัติเรียบร้อยทั้งหมด"
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {todos.slice(0, 8).map((t) => (
                <li key={t.key}>
                  <Link href={t.href} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50 sm:px-6">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.tone}`}>{t.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">{t.title}</span>
                      <span className="block truncate text-[0.8125rem] text-zinc-500">{t.detail}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="ใบสมัครล่าสุด" />
          {loading ? (
            <SkeletonRows rows={5} />
          ) : recentApps.length === 0 ? (
            <EmptyState compact icon={<Users className="h-5 w-5" />} title="ยังไม่มีผู้สมัคร" description="เมื่อมีผู้สมัครหลักสูตร รายการจะแสดงที่นี่" />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentApps.map((a) => {
                const u = userMap.get(a.user_id);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/admin/courses/${a.training_id}?tab=applicants`}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-zinc-50 sm:px-6"
                    >
                      <Avatar name={u?.first_name_th || '?'} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">{u ? fullName(u) : `ผู้ใช้ #${a.user_id}`}</span>
                        <span className="block truncate text-[0.8125rem] text-zinc-500">
                          {courseName.get(a.training_id)} · {relativeTime(a.created_at)}
                        </span>
                      </span>
                      <EnrollmentBadge status={a.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="หลักสูตรที่กำลังดำเนินการ" actions={<ButtonLink href="/admin/courses" variant="ghost" size="sm">ทั้งหมด</ButtonLink>} />
          {loading ? (
            <SkeletonRows rows={3} />
          ) : activeCourses.length === 0 ? (
            <EmptyState compact icon={<BookOpen className="h-5 w-5" />} title="ไม่มีหลักสูตรที่กำลังเปิด" />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {activeCourses.map((c) => {
                const phase = PHASE_META[coursePhase(c)];
                const n = (data?.apps || []).filter((a) => a.training_id === c.id).length;
                return (
                  <li key={c.id}>
                    <Link href={`/admin/courses/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-zinc-50 sm:px-6">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">{c.course_name}</span>
                        <span className="block truncate text-[0.8125rem] text-zinc-500">
                          {thaiDateRange(c.startswith_date, c.endswith_date)} · ผู้สมัคร {n}/{c.limit_course}
                        </span>
                      </span>
                      <Badge tone={phase.tone} dot>
                        {phase.label}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="รอบสอบปฏิบัติที่กำลังจะถึง" />
          {loading ? (
            <SkeletonRows rows={3} />
          ) : upcomingRounds.length === 0 ? (
            <EmptyState compact icon={<CalendarDays className="h-5 w-5" />} title="ยังไม่มีรอบสอบที่กำหนดวัน" />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcomingRounds.map((r) => {
                const d = r.exam_date ? new Date(r.exam_date + 'T00:00:00') : null;
                return (
                  <li key={r.id}>
                    <Link href={`/admin/courses/${r.training_id}?tab=practical`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50 sm:px-6">
                      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-surface leading-none">
                        <span className="font-display text-lg font-semibold text-zinc-950">{d?.getDate()}</span>
                        <span className="mt-0.5 text-[0.625rem] text-brand-600">{thaiDate(r.exam_date).split(' ')[1]}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">{r.name}</span>
                        <span className="flex items-center gap-1 truncate text-[0.8125rem] text-zinc-500">
                          {courseName.get(r.training_id)}
                          {r.location && (
                            <>
                              <MapPin className="ml-1 h-3 w-3" />
                              {r.location}
                            </>
                          )}
                        </span>
                      </span>
                      <Badge tone={r.evaluator_ids.length === 3 ? 'green' : 'amber'}>ผู้ประเมิน {r.evaluator_ids.length}/3</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
