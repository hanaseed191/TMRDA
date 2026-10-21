'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { applications, courses, labor, users } from '@/lib/api';
import { FullPageLoader, useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import { fullName } from '@/lib/format';
import ApplicationForm from '@/components/print/ApplicationForm';
import PrintToolbar, { PrintMessage } from '@/components/print/PrintToolbar';

function ApplicationPrintInner() {
  const me = useUser();
  const params = useSearchParams();
  const courseId = Number(params.get('course')) || null;
  const requestedUser = Number(params.get('user')) || null;
  const isStaff = me.role === 'admin' || me.role === 'director';
  const userId = requestedUser && isStaff ? requestedUser : me.id;

  const { data, loading, error } = useLoad(async () => {
    const [user, history, course, apps] = await Promise.all([
      users.get(userId),
      labor.get(userId),
      courseId ? courses.get(courseId) : Promise.resolve(null),
      courseId ? applications.list({ userId, trainingId: courseId }) : Promise.resolve([]),
    ]);
    return { user, history, course, application: apps[0] || null };
  }, [userId, courseId]);

  if (requestedUser && !isStaff && requestedUser !== me.id) {
    return <PrintMessage title="ไม่มีสิทธิ์เข้าถึงเอกสารนี้" description="คุณพิมพ์ได้เฉพาะใบสมัครของตัวเองเท่านั้น" />;
  }

  return (
    <>
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>
      <PrintToolbar
        title="ใบสมัครเข้ารับการฝึกอบรม / ทดสอบมาตรฐานฝีมือแรงงาน"
        hint={data ? [fullName(data.user), data.course?.course_name].filter(Boolean).join(' · ') : undefined}
        disabled={!data}
      />
      {loading ? (
        <FullPageLoader label="กำลังเตรียมเอกสาร…" />
      ) : error || !data ? (
        <PrintMessage title="โหลดเอกสารไม่สำเร็จ" description={error || undefined} />
      ) : (
        <div className="overflow-x-auto py-8 print:overflow-visible print:p-0">
          {!data.course && (
            <p className="no-print mx-auto mb-4 max-w-[210mm] px-4 text-center text-sm text-zinc-500">
              ยังไม่ได้ระบุหลักสูตร — ส่วนหลักสูตรในเอกสารจะเว้นว่างไว้ (เปิดจากหน้าหลักสูตรเพื่อเติมข้อมูลอัตโนมัติ)
            </p>
          )}
          <div className="mx-auto w-[210mm] print:w-auto">
            <ApplicationForm user={data.user} labor={data.history} course={data.course} application={data.application} />
          </div>
        </div>
      )}
    </>
  );
}

export default function ApplicationPrintPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <ApplicationPrintInner />
    </Suspense>
  );
}
