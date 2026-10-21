'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

/** Underline tabs; scrolls horizontally on small screens. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: TabItem<T>[];
  className?: string;
}) {
  return (
    <div className={cn('-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div className="flex min-w-max gap-1 border-b border-zinc-200" role="tablist">
        {items.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn(
                'relative -mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition',
                active ? 'border-brand-600 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              )}
            >
              {t.icon && <span className={cn(active ? 'text-brand-600' : 'text-zinc-400')}>{t.icon}</span>}
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[0.6875rem] font-semibold tabular',
                    active ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
