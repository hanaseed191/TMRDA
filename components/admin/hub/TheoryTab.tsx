'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Copy, FileText, Info, Pencil, Plus, Shuffle, Target, Timer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { forms } from '@/lib/api';
import { errorMessage, num, thaiDateTime } from '@/lib/format';
import type { TestForm } from '@/lib/types';
import { Badge, Button, ButtonLink, Callout, Card, EmptyState, Switch, useConfirm } from '@/components/ui';
import type { HubData } from './types';

function windowLabel(f: TestForm) {
  if (!f.exam_start_date && !f.exam_end_date) return 'เปิดตลอดช่วงหลักสูตร';
  if (f.exam_start_date && f.exam_end_date) return `${thaiDateTime(f.exam_start_date)} – ${thaiDateTime(f.exam_end_date)}`;
  if (f.exam_start_date) return `ตั้งแต่ ${thaiDateTime(f.exam_start_date)}`;
  return `ถึง ${thaiDateTime(f.exam_end_date)}`;
}

export default function TheoryTab({ data, reload }: { data: HubData; reload: () => void }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState<number | null>(null);
  const theory = data.forms.filter((f) => f.exam_type === 'theory');
  const active = theory.filter((f) => f.is_active);
  const newHref = `/admin/exams/new?course=${data.course.id}&type=theory`;

  const toggle = async (f: TestForm, v: boolean) => {
    setBusy(f.id);
    try {
      await forms.save({ ...f, is_active: v });
      toast.success(v ? 'เปิดใช้งานชุดข้อสอบแล้ว' : 'ปิดใช้งานชุดข้อสอบแล้ว');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (f: TestForm) => {
    setBusy(f.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...rest } = f;
      await forms.save({ ...rest, title: `${f.title} (สำเนา)`, is_active: false });
      toast.success('สร้างสำเนาแล้ว (ปิดใช้งานไว้ก่อน)');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (f: TestForm) => {
    const used = data.attempts.filter((a) => a.test_form_id === f.id).length;
    if (used > 0) {
      await confirm({
        title: 'ลบชุดข้อสอบนี้ไม่ได้',
        description: `มีผู้เข้าสอบด้วยชุดนี้แล้ว ${used} ครั้ง การลบจะทำให้ประวัติการสอบอ้างอิงไม่ได้ — ให้ “ปิดใช้งาน” แทน`,
        confirmLabel: 'เข้าใจแล้ว',
      });
      return;
    }
    const ok = await confirm({
      title: `ลบ “${f.title}”?`,
      description: 'คำถามทั้งหมดในชุดนี้จะถูกลบถาวร',
      confirmLabel: 'ลบชุดข้อสอบ',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await forms.remove(f.id);
      toast.success('ลบชุดข้อสอบแล้ว');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">ชุดข้อสอบภาคทฤษฎี</h2>
          <p className="text-[0.8125rem] text-zinc-500">ผู้สอบทำผ่านระบบ ตรวจอัตโนมัติ (ยกเว้นข้อเขียน) พร้อมจับเวลาจากเซิร์ฟเวอร์</p>
        </div>
        <ButtonLink href={newHref} icon={<Plus className="h-4 w-4" />}>
          สร้างชุดข้อสอบทฤษฎี
        </ButtonLink>
      </div>

      {active.length > 1 && (
        <Callout tone="blue" icon={<Shuffle className="h-4 w-4" />} title={`เปิดใช้งานอยู่ ${active.length} ชุด`}>
          ผู้สอบแต่ละคนจะได้รับชุดข้อสอบแบบสุ่ม 1 ชุดเมื่อเริ่มสอบ — ควรให้ทุกชุดมีระดับความยากและคะแนนเต็มใกล้เคียงกัน
        </Callout>
      )}

      {theory.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="ยังไม่มีชุดข้อสอบทฤษฎี"
            description="สร้างชุดข้อสอบได้ 6 รูปแบบ: ตัวเลือกเดียว หลายคำตอบ ถูก/ผิด จับคู่ เติมคำ และข้อเขียน"
            action={
              <ButtonLink href={newHref} icon={<Plus className="h-4 w-4" />}>
                สร้างชุดแรก
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {theory.map((f) => {
            const used = data.attempts.filter((a) => a.test_form_id === f.id);
            const done = used.filter((a) => a.status !== 'in_progress').length;
            return (
              <Card key={f.id} className="flex flex-col">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/exams/${f.id}`} className="min-w-0 group">
                      <h3 className="truncate text-[0.9375rem] font-semibold group-hover:text-brand-700">{f.title}</h3>
                      <p className="mt-0.5 text-[0.8125rem] text-zinc-500">
                        {f.questions.length} ข้อ · คะแนนเต็ม {num(f.total_score)}
                      </p>
                    </Link>
                    <Switch checked={f.is_active} disabled={busy === f.id} onChange={(v) => toggle(f, v)} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[0.8125rem] text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-zinc-400" /> {f.time_limit_minutes} นาที
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-zinc-400" /> ผ่าน {f.passing_percentage}%
                    </span>
                    <span className="col-span-2 flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{windowLabel(f)}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone={f.is_active ? 'green' : 'neutral'} dot>
                      {f.is_active ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                    </Badge>
                    <Badge>สอบได้ {f.max_attempts} ครั้ง</Badge>
                    {(f.randomize_questions || f.randomize_choices) && <Badge tone="blue">สุ่มลำดับ</Badge>}
                    {f.questions.length === 0 && <Badge tone="amber">ยังไม่มีคำถาม</Badge>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3">
                  <span className="text-[0.8125rem] text-zinc-500 tabular">
                    เข้าสอบแล้ว {done} คน{used.length - done > 0 && ` · กำลังสอบ ${used.length - done}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <ButtonLink href={`/admin/exams/${f.id}`} variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />}>
                      แก้ไข
                    </ButtonLink>
                    <Button variant="ghost" size="icon-sm" title="ทำสำเนา" aria-label="ทำสำเนา" disabled={busy === f.id} onClick={() => duplicate(f)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="ลบ" aria-label="ลบ" className="hover:text-brand-700" onClick={() => remove(f)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {theory.length > 0 && active.length === 0 && (
        <Callout tone="amber" icon={<Info className="h-4 w-4" />}>
          ไม่มีชุดข้อสอบที่เปิดใช้งาน ผู้สอบจะยังเริ่มสอบภาคทฤษฎีไม่ได้
        </Callout>
      )}
    </div>
  );
}
