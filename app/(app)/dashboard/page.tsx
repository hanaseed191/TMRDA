'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, CalendarDays, Clock, FileCheck2, GraduationCap, MapPin, Sparkles, UserRound } from 'lucide-react';
import { homeFor, useUser } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { thaiDate, thaiDateRange } from '@/lib/format';
import { ApprovalBadge, EnrollmentBadge } from '@/components/status';
import { ButtonLink, Callout, Card, EmptyState, Progress, Skeleton } from '@/components/ui';
import { Journey } from '@/components/student/Journey';
import { buildJourney, DOC_FIELDS, useStudentData } from '@/components/student/data';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'สวัสดีตอนเช้า';
  if (h < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

function DashboardInner() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const welcome = params.get('welcome') === '1';

  useEffect(() => {
    if (user.role !== 'user') router.replace(homeFor(user.role));
  }, [user.role, router]);

  const { data, loading, error, reload } = useStudentData(user);

  const completeness = useMemo(() => {
    const items = [
      ...DOC_FIELDS.map((d) => ({ label: d.label, done: !!user[d.field] })),
      { label: 'ประวัติสถานภาพแรงงาน', done: !!data?.laborHistory },
    ];
    return { items, done: items.filter((i) => i.done).length, total: items.length };
  }, [user, data?.laborHistory]);

  const upcoming = useMemo(() => {
    if (!data) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.myApps
      .filter((a) => a.practical_round_id && data.myRounds.get(a.practical_round_id))
      .map((a) => ({ app: a, round: data.myRounds.get(a.practical_round_id!)!, course: data.courseById.get(a.training_id) }))
      .filter((x) => !x.round.exam_date || new Date(x.round.exam_date) >= today)
      .sort((a, b) => String(a.round.exam_date).localeCompare(String(b.round.exam_date)));
  }, [data]);

  if (user.role !== 'user') return null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative animate-fade-up overflow-hidden rounded-3xl bg-ink-950 dark:bg-ink-900 dark:ring-1 dark:ring-white/10 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="bg-dots-dark absolute inset-0" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-[90px]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-ink-400">{welcome ? 'ยินดีต้อนรับสมาชิกใหม่' : greeting()}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold !text-white sm:text-3xl">
              คุณ{user.first_name_th} {user.last_name_th}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-400">
              {data && data.myApps.length > 0
                ? `คุณสมัครไว้ ${data.myApps.length} หลักสูตร ติดตามความคืบหน้าและขั้นตอนถัดไปได้ที่นี่`
                : 'เริ่มต้นด้วยการเลือกหลักสูตรที่สนใจ แล้วระบบจะพาคุณไปทีละขั้นจนได้รับใบประกาศนียบัตร'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/courses?tab=open" icon={<GraduationCap className="h-4 w-4" />}>
              ค้นหาหลักสูตร
            </ButtonLink>
            <ButtonLink href="/results" variant="outline" className="border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10">
              ผลสอบของฉัน
            </ButtonLink>
          </div>
        </div>
      </section>

      {error && (
        <Callout tone="red" title="โหลดข้อมูลไม่สำเร็จ" action={<button onClick={reload} className="text-sm font-medium underline">ลองใหม่</button>}>
          {error}
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Courses + journey */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">หลักสูตรของฉัน</h2>
            {data && data.myApps.length > 0 && (
              <Link href="/courses" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
                ดูทั้งหมด
              </Link>
            )}
          </div>

          {loading ? (
            [0, 1].map((i) => (
              <Card key={i} className="space-y-5 p-6">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3.5 w-1/3" />
                <div className="grid grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="mx-auto h-7 w-7 rounded-full" />
                  ))}
                </div>
              </Card>
            ))
          ) : !data || data.myApps.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BookOpen className="h-5 w-5" />}
                title="ยังไม่ได้สมัครหลักสูตร"
                description="เลือกหลักสูตรฝึกอบรมหรือทดสอบมาตรฐานฝีมือแรงงานที่เปิดรับสมัคร"
                action={
                  <ButtonLink href="/courses?tab=open" iconRight={<ArrowRight className="h-4 w-4" />}>
                    ดูหลักสูตรที่เปิดรับสมัคร
                  </ButtonLink>
                }
              />
            </Card>
          ) : (
            data.myApps.map((app, i) => {
              const course = data.courseById.get(app.training_id);
              const { steps, next } = buildJourney(app, data);
              return (
                <Card key={app.id} className="animate-fade-up p-5 sm:p-6" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{course?.course_name || `หลักสูตร #${app.training_id}`}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-zinc-500">
                        {course && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {thaiDateRange(course.startswith_date, course.endswith_date)}
                          </span>
                        )}
                        {course?.level_name && <span>{course.level_name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <EnrollmentBadge status={app.status} />
                      {app.approval_status !== 'none' && <ApprovalBadge status={app.approval_status} />}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Journey steps={steps} />
                  </div>

                  {next && (
                    <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-zinc-600">
                        <span className="font-medium text-zinc-900">ขั้นตอนถัดไป · </span>
                        {next.note || next.label}
                      </span>
                      {next.href && (
                        <ButtonLink href={next.href} size="sm" variant={next.tone} iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                          {next.label}
                        </ButtonLink>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.9375rem] font-semibold">ความพร้อมของโปรไฟล์</h2>
              <span className="text-sm font-semibold tabular text-zinc-900">
                {completeness.done}/{completeness.total}
              </span>
            </div>
            <Progress className="mt-3" value={completeness.done} max={completeness.total} tone={completeness.done === completeness.total ? 'green' : 'red'} />
            <ul className="mt-4 space-y-2.5">
              {completeness.items.map((it) => (
                <li key={it.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full',
                      it.done ? 'bg-emerald-50 text-emerald-600' : 'border border-dashed border-zinc-300 text-zinc-300'
                    )}
                  >
                    {it.done ? <FileCheck2 className="h-3 w-3" /> : null}
                  </span>
                  <span className={it.done ? 'text-zinc-700' : 'text-zinc-500'}>{it.label}</span>
                </li>
              ))}
            </ul>
            {completeness.done < completeness.total && (
              <ButtonLink href="/profile?tab=documents" variant="outline" size="sm" className="mt-4 w-full" icon={<UserRound className="h-3.5 w-3.5" />}>
                เติมข้อมูลให้ครบ
              </ButtonLink>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[0.9375rem] font-semibold">นัดสอบภาคปฏิบัติ</h2>
            {loading ? (
              <Skeleton className="mt-4 h-16 w-full" />
            ) : upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">ยังไม่มีนัดหมาย เจ้าหน้าที่จะจัดรอบสอบให้หลังผ่านการตรวจสอบสิทธิ์</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.map(({ app, round, course }) => (
                  <li key={app.id} className="flex gap-3">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-zinc-200 py-1.5">
                      {round.exam_date ? (
                        <>
                          <span className="text-[0.625rem] font-medium uppercase text-brand-600">{thaiDate(round.exam_date).split(' ')[1]}</span>
                          <span className="font-display text-lg font-semibold leading-none">{new Date(round.exam_date).getDate()}</span>
                        </>
                      ) : (
                        <span className="py-1 text-xs text-zinc-400">TBA</span>
                      )}
                    </div>
                    <div className="min-w-0 text-sm">
                      <div className="truncate font-medium text-zinc-900">{course?.course_name}</div>
                      <div className="text-[0.8125rem] text-zinc-500">{round.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-[0.75rem] text-zinc-500">
                        {round.start_time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {round.start_time} น.
                          </span>
                        )}
                        {round.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {round.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex items-start gap-3 bg-gradient-to-br from-surface to-zinc-50 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="text-sm">
              <div className="font-medium text-zinc-900">เคล็ดลับการสอบออนไลน์</div>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-zinc-500">
                ระบบบันทึกคำตอบให้อัตโนมัติ หากอินเทอร์เน็ตหลุดสามารถกลับมาทำต่อได้ภายในเวลาที่กำหนด
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
