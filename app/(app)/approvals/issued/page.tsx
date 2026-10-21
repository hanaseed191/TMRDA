'use client';

import { useMemo, useState } from 'react';
import { Printer, ScrollText } from 'lucide-react';
import { applications, courses, users } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { formatCitizenId, fullName, thaiDate } from '@/lib/format';
import {
  Avatar,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  SkeletonRows,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { ResultBadge } from '@/components/status';

async function load() {
  const approved = await applications.list({ approval: ['approved'] });
  const [allCourses, people] = await Promise.all([
    courses.list(),
    users.byIds(Array.from(new Set(approved.map((a) => a.user_id)))),
  ]);
  approved.sort((a, b) => String(b.approved_at || '').localeCompare(String(a.approved_at || '')));
  return { approved, courses: allCourses, people };
}

export default function IssuedCertificatesPage() {
  const { data, loading, error } = useLoad(load, []);
  const [query, setQuery] = useState('');
  const [courseId, setCourseId] = useState('');

  const userById = useMemo(() => new Map((data?.people || []).map((u) => [u.id, u])), [data]);
  const courseById = useMemo(() => new Map((data?.courses || []).map((c) => [c.id, c])), [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.approved || []).filter((a) => {
      if (courseId && String(a.training_id) !== courseId) return false;
      if (!q) return true;
      const u = userById.get(a.user_id);
      return `${fullName(u)} ${u?.th_human_number || ''} ${a.certificate_no || ''}`.toLowerCase().includes(q);
    });
  }, [data, query, courseId, userById]);

  const courseOptions = useMemo(
    () => Array.from(new Set((data?.approved || []).map((a) => a.training_id))).map((id) => courseById.get(id)).filter(Boolean),
    [data, courseById]
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'อนุมัติผลการสอบ', href: '/approvals' }, { label: 'ใบประกาศที่ออกแล้ว' }]}
        title="ใบประกาศที่ออกแล้ว"
        description="ผลการสอบที่ผ่านการอนุมัติ พร้อมเลขที่ใบประกาศนียบัตร"
      />

      {error && <Callout tone="red" className="mb-6">{error}</Callout>}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาชื่อ เลขบัตร หรือเลขที่ใบประกาศ" className="flex-1" />
          <div className="sm:w-72">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="กรองตามหลักสูตร">
              <option value="">ทุกหลักสูตร</option>
              {courseOptions.map((c) => (
                <option key={c!.id} value={c!.id}>
                  {c!.course_name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {loading ? (
          <SkeletonRows rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-5 w-5" />} title={(data?.approved.length ?? 0) === 0 ? 'ยังไม่มีผลที่อนุมัติ' : 'ไม่พบรายการ'} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>ผู้สอบ</TH>
                <TH>หลักสูตร</TH>
                <TH>ผล</TH>
                <TH>เลขที่ใบประกาศ</TH>
                <TH>อนุมัติเมื่อ</TH>
                <TH className="text-right" />
              </tr>
            </THead>
            <tbody>
              {rows.map((a) => {
                const u = userById.get(a.user_id);
                return (
                  <TR key={a.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={u?.first_name_th || '?'} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-zinc-900">{fullName(u)}</div>
                          <div className="text-xs tabular text-zinc-500">{formatCitizenId(u?.th_human_number)}</div>
                        </div>
                      </div>
                    </TD>
                    <TD className="max-w-[260px] truncate text-zinc-700">{courseById.get(a.training_id)?.course_name || '—'}</TD>
                    <TD>
                      <ResultBadge status={a.result_status} />
                    </TD>
                    <TD className="font-medium tabular text-zinc-900">{a.certificate_no || <span className="text-zinc-300">—</span>}</TD>
                    <TD className="whitespace-nowrap text-zinc-500">{thaiDate(a.approved_at)}</TD>
                    <TD className="text-right">
                      {a.certificate_no && (
                        <ButtonLink size="sm" variant="outline" href={`/print/certificate/${a.id}`} target="_blank" icon={<Printer className="h-3.5 w-3.5" />}>
                          พิมพ์
                        </ButtonLink>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
