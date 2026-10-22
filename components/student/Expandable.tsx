'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

/**
 * A card whose summary row is always visible and whose details expand on click.
 * Keeps long lists (many applications / certificates) short and scannable.
 */
export function ExpandableCard({
  open,
  onToggle,
  summary,
  actions,
  children,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  /** left part of the summary row (title, meta, badges) */
  summary: React.ReactNode;
  /** right part of the summary row — buttons here don't toggle the card */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card overflow-hidden transition-shadow', open && 'shadow-lift', className)}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition group-hover:bg-zinc-100 group-hover:text-zinc-700',
              open && 'bg-zinc-100 text-zinc-700'
            )}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
          </span>
          <span className="min-w-0 flex-1">{summary}</span>
        </button>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pl-10 sm:pl-0">{actions}</div>}
      </div>
      {open && <div className="animate-fade-in border-t border-zinc-100">{children}</div>}
    </div>
  );
}

/** Track which rows are expanded. */
export function useExpanded(initial: number[] = []) {
  const [set, setSet] = useState<Set<number>>(() => new Set(initial));
  return {
    isOpen: (id: number) => set.has(id),
    toggle: (id: number) =>
      setSet((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setAll: (ids: number[]) => setSet(new Set(ids)),
    count: set.size,
  };
}

/** Render a list progressively: `step` rows at a time with a "show more" button. */
export function useShowMore<T>(items: T[], step = 10) {
  const [limit, setLimit] = useState(step);
  const visible = items.slice(0, limit);
  const remaining = Math.max(0, items.length - limit);
  const footer =
    remaining > 0 ? (
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={() => setLimit((l) => l + step)}>
          แสดงเพิ่มอีก {Math.min(step, remaining)} รายการ
          <span className="text-zinc-400">(เหลือ {remaining})</span>
        </Button>
      </div>
    ) : null;
  return { visible, footer, reset: () => setLimit(step) };
}
