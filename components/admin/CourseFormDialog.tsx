'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { courses } from '@/lib/api';
import { errorMessage, toDateInput } from '@/lib/format';
import type { TrainingCourse } from '@/lib/types';
import { Button, Dialog, Field, Input, Switch, Textarea } from '@/components/ui';

type Draft = Partial<TrainingCourse>;

const EMPTY: Draft = {
  course_name: '',
  course_name_en: '',
  agency_name: '',
  branch_name: '',
  level_name: '',
  traning_hours: 30,
  limit_course: 30,
  startswith_date: '',
  endswith_date: '',
  location: '',
  executive_name: '',
  description: '',
  is_published: true,
};

export default function CourseFormDialog({
  open,
  onClose,
  course,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  course?: TrainingCourse | null;
  onSaved: (c: TrainingCourse) => void;
}) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setD(
      course
        ? {
            ...course,
            startswith_date: toDateInput(course.startswith_date),
            endswith_date: toDateInput(course.endswith_date),
            is_published: course.is_published ?? true,
          }
        : EMPTY
    );
  }, [open, course]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!d.course_name?.trim()) errors.course_name = 'กรุณาระบุชื่อหลักสูตร';
  if (!d.agency_name?.trim()) errors.agency_name = 'กรุณาระบุหน่วยงานที่จัด';
  if (!(Number(d.traning_hours) > 0)) errors.traning_hours = 'ต้องมากกว่า 0';
  if (!(Number(d.limit_course) > 0)) errors.limit_course = 'ต้องมากกว่า 0';
  if (d.startswith_date && d.endswith_date && d.endswith_date < d.startswith_date)
    errors.endswith_date = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม';
  const hasErrors = Object.keys(errors).length > 0;
  const err = (k: keyof Draft) => (touched ? errors[k] : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error(Object.values(errors)[0]!);
      return;
    }
    setSaving(true);
    try {
      const saved = await courses.save({ ...d, id: course?.id });
      toast.success(course ? 'บันทึกการแก้ไขหลักสูตรแล้ว' : 'สร้างหลักสูตรใหม่แล้ว');
      onSaved(saved);
      onClose();
    } catch (e2) {
      toast.error(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={course ? 'แก้ไขหลักสูตร' : 'สร้างหลักสูตรใหม่'}
      description="ข้อมูลนี้แสดงให้ผู้สมัครเห็นในหน้าหลักสูตร และใช้พิมพ์บนใบสมัครและใบประกาศนียบัตร"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="course-form" loading={saving}>
            {course ? 'บันทึกการแก้ไข' : 'สร้างหลักสูตร'}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field label="ชื่อหลักสูตร (ไทย)" required error={err('course_name')} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              value={d.course_name || ''}
              invalid={!!err('course_name')}
              onChange={(e) => set('course_name', e.target.value)}
              placeholder="เช่น ช่างเชื่อมไฟฟ้า ระดับ 1"
            />
          )}
        </Field>
        <Field label="ชื่อหลักสูตร (อังกฤษ)" hint="ใช้บนใบประกาศนียบัตรฉบับภาษาอังกฤษ" className="sm:col-span-2">
          {(id) => (
            <Input id={id} value={d.course_name_en || ''} onChange={(e) => set('course_name_en', e.target.value)} placeholder="e.g. Arc Welder, Level 1" />
          )}
        </Field>
        <Field label="หน่วยงานที่จัด" required error={err('agency_name')}>
          {(id) => (
            <Input id={id} value={d.agency_name || ''} invalid={!!err('agency_name')} onChange={(e) => set('agency_name', e.target.value)} />
          )}
        </Field>
        <Field label="สาขา">
          {(id) => <Input id={id} value={d.branch_name || ''} onChange={(e) => set('branch_name', e.target.value)} placeholder="เช่น ช่างอุตสาหกรรม" />}
        </Field>
        <Field label="ระดับ">
          {(id) => <Input id={id} value={d.level_name || ''} onChange={(e) => set('level_name', e.target.value)} placeholder="เช่น ระดับ 1" />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ชั่วโมงอบรม" required error={err('traning_hours')}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                inputMode="numeric"
                value={d.traning_hours ?? ''}
                invalid={!!err('traning_hours')}
                onChange={(e) => set('traning_hours', Number(e.target.value))}
              />
            )}
          </Field>
          <Field label="รับสูงสุด (คน)" required error={err('limit_course')}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                inputMode="numeric"
                value={d.limit_course ?? ''}
                invalid={!!err('limit_course')}
                onChange={(e) => set('limit_course', Number(e.target.value))}
              />
            )}
          </Field>
        </div>
        <Field label="วันเริ่มอบรม">
          {(id) => <Input id={id} type="date" value={d.startswith_date || ''} onChange={(e) => set('startswith_date', e.target.value)} />}
        </Field>
        <Field label="วันสิ้นสุด" error={err('endswith_date') || (d.endswith_date && d.startswith_date && d.endswith_date < d.startswith_date ? errors.endswith_date : undefined)}>
          {(id) => (
            <Input
              id={id}
              type="date"
              min={d.startswith_date || undefined}
              value={d.endswith_date || ''}
              invalid={!!errors.endswith_date}
              onChange={(e) => set('endswith_date', e.target.value)}
            />
          )}
        </Field>
        <Field label="สถานที่อบรม / สอบ">
          {(id) => <Input id={id} value={d.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="อาคาร / ห้อง / ศูนย์ทดสอบ" />}
        </Field>
        <Field label="ผู้รับผิดชอบหลักสูตร">
          {(id) => <Input id={id} value={d.executive_name || ''} onChange={(e) => set('executive_name', e.target.value)} />}
        </Field>
        <Field label="รายละเอียดหลักสูตร" className="sm:col-span-2">
          {(id) => (
            <Textarea
              id={id}
              rows={3}
              value={d.description || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="วัตถุประสงค์ คุณสมบัติผู้สมัคร สิ่งที่ต้องเตรียม"
            />
          )}
        </Field>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:col-span-2">
          <Switch
            checked={d.is_published ?? true}
            onChange={(v) => set('is_published', v)}
            label="เปิดให้ผู้สมัครเห็นหลักสูตรนี้"
            description="ปิดไว้ระหว่างเตรียมข้อมูล ผู้สมัครเดิมยังเข้าถึงหลักสูตรได้ตามปกติ"
          />
        </div>
      </form>
    </Dialog>
  );
}
