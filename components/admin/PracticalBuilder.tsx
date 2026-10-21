'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, CornerDownRight, Info, ListTree, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MAX_PRACTICAL_DEPTH, PRACTICAL_LEVELS } from '@/lib/constants';
import { num } from '@/lib/format';
import { isLeaf, itemMax, leafItems, REQUIRED_EVALUATORS, treeMax } from '@/lib/scoring';
import type { PracticalItem } from '@/lib/types';
import { Button, Callout, Card, Field, Input, Switch, Textarea, useConfirm } from '@/components/ui';
import { numericId } from './uid';
import type { FormDraft } from './TheoryBuilder';

const LEVEL_STYLE = [
  { bar: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700 ring-brand-200' },
  { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 ring-amber-200' },
];

const newItem = (): PracticalItem => ({ id: numericId(), item_name: '', criteria: '', max_score: 5, children: [] });

/** Validate a criteria tree; returns the first problem in Thai, or null. */
export function validateTree(items: PracticalItem[]): string | null {
  if (items.length === 0) return 'ยังไม่มีหัวข้อการประเมิน';
  const walk = (list: PracticalItem[], prefix: string): string | null => {
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const n = `${prefix}${i + 1}`;
      if (!it.item_name.trim()) return `หัวข้อ ${n}: ยังไม่ได้ตั้งชื่อ`;
      if (isLeaf(it) && !(Number(it.max_score) > 0)) return `หัวข้อ ${n}: คะแนนเต็มต้องมากกว่า 0`;
      if (!isLeaf(it)) {
        const e = walk(it.children!, `${n}.`);
        if (e) return e;
      }
    }
    return null;
  };
  return walk(items, '');
}

export default function PracticalBuilder({
  form,
  onChange,
  showErrors,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  showErrors: boolean;
}) {
  const items = form.practical_items || [];
  const total = treeMax(items);
  const leaves = leafItems(items).length;
  const setItems = (list: PracticalItem[]) => onChange({ practical_items: list });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-zinc-500">
          {PRACTICAL_LEVELS.map((l, i) => (
            <span key={l} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', LEVEL_STYLE[i].chip)}>
                ระดับ {i + 1} · {l}
              </span>
            </span>
          ))}
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
              <ListTree className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold">เริ่มจากหมวดหลักของการประเมิน</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              เช่น “การเตรียมเครื่องมือและความปลอดภัย” แล้วเพิ่มหัวข้อย่อยลงไปได้อีก 3 ระดับ
            </p>
            <Button className="mt-5" icon={<Plus className="h-4 w-4" />} onClick={() => setItems([newItem()])}>
              เพิ่มหมวดหลัก
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            <NodeList list={items} depth={0} prefix="" onChange={setItems} showErrors={showErrors} />
            <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => setItems([...items, newItem()])}>
              เพิ่มหมวดหลัก
            </Button>
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-[140px] lg:self-start">
        <Card className="p-5">
          <div className="eyebrow">คะแนนเต็มรวม</div>
          <div className="mt-1 font-display text-3xl font-semibold tabular">{num(total)}</div>
          <div className="mt-1 text-[0.8125rem] text-zinc-500">
            {leaves} รายการให้คะแนน · ผ่านที่ {num((total * (Number(form.passing_percentage) || 0)) / 100)} คะแนน
          </div>
        </Card>

        <Callout tone="blue" icon={<Info className="h-4 w-4" />} title="การคิดคะแนน">
          ผู้ประเมินให้คะแนนที่หัวข้อย่อยสุด คะแนนของหัวข้อแม่คือผลรวมอัตโนมัติ — คะแนนปฏิบัติของผู้สอบ = ผลรวมคะแนนจากผู้ประเมิน{' '}
          {REQUIRED_EVALUATORS} ท่าน ÷ {REQUIRED_EVALUATORS}
        </Callout>

        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">การตั้งค่า</h3>
          <Field label="คำชี้แจงสำหรับผู้ประเมิน">
            {(id) => (
              <Textarea
                id={id}
                rows={3}
                value={form.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="เช่น สังเกตการปฏิบัติงานจริง ให้คะแนนตามเกณฑ์แต่ละข้อ"
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="เกณฑ์ผ่าน (%)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  value={form.passing_percentage ?? ''}
                  onChange={(e) => onChange({ passing_percentage: Math.min(100, Math.max(0, Number(e.target.value))) })}
                />
              )}
            </Field>
            <Field label="เวลาสอบ (นาที)">
              {(id) => (
                <Input id={id} type="number" min={1} value={form.time_limit_minutes ?? ''} onChange={(e) => onChange({ time_limit_minutes: Number(e.target.value) })} />
              )}
            </Field>
          </div>
          <Switch checked={form.is_active ?? true} onChange={(v) => onChange({ is_active: v })} label="เปิดใช้งาน" description="ใช้กับรอบสอบได้" />
        </Card>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------

function NodeList({
  list,
  depth,
  prefix,
  onChange,
  showErrors,
}: {
  list: PracticalItem[];
  depth: number;
  prefix: string;
  onChange: (l: PracticalItem[]) => void;
  showErrors: boolean;
}) {
  const confirm = useConfirm();
  return (
    <>
      {list.map((it, i) => (
        <Node
          key={it.id}
          item={it}
          depth={depth}
          number={`${prefix}${i + 1}`}
          first={i === 0}
          last={i === list.length - 1}
          showErrors={showErrors}
          onChange={(n) => onChange(list.map((x, j) => (j === i ? n : x)))}
          onMove={(d) => {
            const j = i + d;
            if (j < 0 || j >= list.length) return;
            const l = [...list];
            [l[i], l[j]] = [l[j], l[i]];
            onChange(l);
          }}
          onAddSibling={() => {
            const l = [...list];
            l.splice(i + 1, 0, newItem());
            onChange(l);
          }}
          onDelete={async () => {
            if (!isLeaf(it)) {
              const ok = await confirm({
                title: `ลบ “${it.item_name || `หัวข้อ ${prefix}${i + 1}`}”?`,
                description: `หัวข้อย่อยทั้งหมด ${leafItems([it]).length} รายการภายใต้หัวข้อนี้จะถูกลบด้วย`,
                confirmLabel: 'ลบ',
                tone: 'danger',
              });
              if (!ok) return;
            }
            onChange(list.filter((_, j) => j !== i));
          }}
        />
      ))}
    </>
  );
}

function Node({
  item,
  depth,
  number,
  first,
  last,
  showErrors,
  onChange,
  onMove,
  onAddSibling,
  onDelete,
}: {
  item: PracticalItem;
  depth: number;
  number: string;
  first: boolean;
  last: boolean;
  showErrors: boolean;
  onChange: (n: PracticalItem) => void;
  onMove: (d: -1 | 1) => void;
  onAddSibling: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(true);
  const leaf = isLeaf(item);
  const children = item.children || [];
  const style = LEVEL_STYLE[Math.min(depth, LEVEL_STYLE.length - 1)];
  const canNest = depth + 1 < MAX_PRACTICAL_DEPTH;
  const nameError = showErrors && !item.item_name.trim();
  const scoreError = showErrors && leaf && !(Number(item.max_score) > 0);

  const addChild = () => {
    // When a leaf gets its first child, its own score moves down to the child.
    const child = { ...newItem(), max_score: leaf ? Number(item.max_score) || 5 : 5 };
    onChange({ ...item, children: [...children, child] });
    setOpen(true);
  };

  return (
    <div className={cn(depth > 0 && 'relative pl-5 sm:pl-7')}>
      {depth > 0 && <CornerDownRight className="absolute left-0 top-5 h-4 w-4 text-zinc-300 sm:left-1.5" />}
      <div className={cn('relative overflow-hidden rounded-xl border bg-surface shadow-card transition', nameError || scoreError ? 'border-brand-300' : 'border-zinc-200')}>
        <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
        <div className="flex flex-wrap items-start gap-2 py-3 pl-4 pr-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={leaf}
            className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 disabled:opacity-0"
            aria-label={open ? 'ย่อ' : 'ขยาย'}
          >
            <ChevronRight className={cn('h-4 w-4 transition', open && 'rotate-90')} />
          </button>
          <span className={cn('mt-1.5 shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset tabular', style.chip)}>{number}</span>

          <div className="min-w-0 flex-1 basis-56 space-y-1.5">
            <input
              value={item.item_name}
              onChange={(e) => onChange({ ...item, item_name: e.target.value })}
              placeholder={`ชื่อ${PRACTICAL_LEVELS[depth]}`}
              aria-invalid={nameError || undefined}
              className={cn(
                'h-9 w-full rounded-lg border border-transparent bg-transparent px-2 text-sm font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 hover:border-zinc-200 focus:border-brand-500 focus:bg-surface focus:outline-none focus:shadow-ring',
                nameError && 'border-brand-300 bg-brand-50/30'
              )}
            />
            <input
              value={item.criteria || ''}
              onChange={(e) => onChange({ ...item, criteria: e.target.value })}
              placeholder={leaf ? 'เกณฑ์การให้คะแนน เช่น ถูกต้องครบ 5 · ขาด 1 ขั้นตอน 3 · ไม่ทำ 0' : 'คำอธิบาย (ไม่บังคับ)'}
              className="h-8 w-full rounded-lg border border-transparent bg-transparent px-2 text-[0.8125rem] text-zinc-600 placeholder:text-zinc-400 hover:border-zinc-200 focus:border-brand-500 focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {leaf ? (
              <label className="flex items-center gap-1.5 text-[0.8125rem] text-zinc-500">
                เต็ม
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={item.max_score}
                  onChange={(e) => onChange({ ...item, max_score: Number(e.target.value) })}
                  aria-invalid={scoreError || undefined}
                  className="control h-9 w-16 rounded-lg px-2 text-center text-sm font-medium tabular"
                  aria-label="คะแนนเต็ม"
                />
              </label>
            ) : (
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[0.8125rem] text-zinc-600 tabular" title="รวมจากหัวข้อย่อย">
                รวม <span className="font-semibold text-zinc-900">{num(itemMax(item))}</span>
              </span>
            )}
            <NodeBtn label="เลื่อนขึ้น" disabled={first} onClick={() => onMove(-1)}>
              <ArrowUp className="h-4 w-4" />
            </NodeBtn>
            <NodeBtn label="เลื่อนลง" disabled={last} onClick={() => onMove(1)}>
              <ArrowDown className="h-4 w-4" />
            </NodeBtn>
            <NodeBtn label="ลบ" onClick={onDelete} danger>
              <Trash2 className="h-4 w-4" />
            </NodeBtn>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 pl-12">
          {canNest && (
            <button type="button" onClick={addChild} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-600 hover:bg-surface hover:text-zinc-900">
              <Plus className="h-3.5 w-3.5" /> เพิ่ม{PRACTICAL_LEVELS[depth + 1]}
            </button>
          )}
          <button type="button" onClick={onAddSibling} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-600 hover:bg-surface hover:text-zinc-900">
            <Plus className="h-3.5 w-3.5" /> เพิ่ม{PRACTICAL_LEVELS[depth]}ถัดไป
          </button>
          {!leaf && (
            <span className="ml-auto text-xs text-zinc-400">
              {children.length} หัวข้อย่อย{!open && ' (ย่ออยู่)'}
            </span>
          )}
        </div>
      </div>

      {!leaf && open && (
        <div className="mt-2 space-y-2">
          <NodeList
            list={children}
            depth={depth + 1}
            prefix={`${number}.`}
            showErrors={showErrors}
            onChange={(l) => onChange({ ...item, children: l })}
          />
        </div>
      )}
    </div>
  );
}

function NodeBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-30',
        danger && 'hover:bg-brand-50 hover:text-brand-700'
      )}
    >
      {children}
    </button>
  );
}
