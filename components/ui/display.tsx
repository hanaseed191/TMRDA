'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 animate-fade-up space-y-3 sm:mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-zinc-500" aria-label="breadcrumb">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
              {b.href ? (
                <Link href={b.href} className="rounded transition hover:text-zinc-900">
                  {b.label}
                </Link>
              ) : (
                <span className="text-zinc-700">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold leading-tight sm:text-[1.75rem]">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-zinc-500 sm:text-[0.9375rem]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  className,
  children,
  as: As = 'div',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' | 'article' }) {
  return (
    <As className={cn('card', className)} {...props}>
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[0.8125rem] text-zinc-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 border-t border-zinc-100 py-6 first:border-t-0 first:pt-0 lg:grid-cols-[240px_1fr] lg:gap-10', className)}>
      <div>
        <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
        {description && <p className="mt-1 text-[0.8125rem] leading-relaxed text-zinc-500">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Badges / status
// ---------------------------------------------------------------------

export type Tone = 'neutral' | 'red' | 'green' | 'amber' | 'blue' | 'violet' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200/70',
  red: 'bg-brand-50 text-brand-700 ring-brand-200/70',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  dark: 'bg-zinc-900 text-zinc-50 ring-zinc-900',
};

const dots: Record<Tone, string> = {
  neutral: 'bg-zinc-400',
  red: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  dark: 'bg-surface',
};

export function Badge({
  tone = 'neutral',
  dot,
  children,
  className,
  icon,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {icon}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  href,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'red' | 'green' | 'amber' | 'blue';
  href?: string;
  className?: string;
}) {
  const iconTone = {
    neutral: 'bg-zinc-100 text-zinc-700',
    red: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-sky-600',
  }[tone];
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.8125rem] font-medium text-zinc-500">{label}</span>
        {icon && <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconTone)}>{icon}</span>}
      </div>
      <div className="mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-zinc-950 tabular">{value}</div>
      {hint && <div className="mt-2 text-[0.8125rem] text-zinc-500">{hint}</div>}
    </>
  );
  const cls = cn('card block p-5 transition', href && 'hover:-translate-y-0.5 hover:shadow-lift', className);
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-6 py-10' : 'px-6 py-16', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-zinc-100/70 blur-md" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-surface text-zinc-500 shadow-card">
          {icon || <Inbox className="h-5 w-5" />}
        </div>
      </div>
      <h3 className="text-[0.9375rem] font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-zinc-100', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-surface/70 to-transparent" />
    </div>
  );
}

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3 p-5', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }[size];
  const letters = name.trim().slice(0, 2);
  // deterministic warm tint per name
  const hues = ['bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-zinc-200 text-zinc-700'];
  const hue = hues[Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn('shrink-0 rounded-full object-cover ring-2 ring-surface', s, className)} />
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-surface', s, hue, className)}>
      {letters}
    </span>
  );
}

export function Progress({ value, max = 100, tone = 'red', className }: { value: number; max?: number; tone?: 'red' | 'green' | 'amber' | 'dark'; className?: string }) {
  const p = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const bar = { red: 'bg-brand-600', green: 'bg-emerald-500', amber: 'bg-amber-500', dark: 'bg-zinc-900' }[tone];
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-zinc-100', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', bar)} style={{ width: `${p}%` }} />
    </div>
  );
}

/** Circular score gauge. */
export function ScoreRing({
  value,
  max,
  size = 96,
  stroke = 8,
  passed,
  label,
}: {
  value: number | null;
  max: number;
  size?: number;
  stroke?: number;
  passed?: boolean | null;
  label?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = value !== null && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const color = passed === true ? '#059669' : passed === false ? '#dc2626' : 'rgb(var(--zinc-400))';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--zinc-100))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-lg font-semibold leading-none text-zinc-950 tabular">
          {value === null ? '—' : `${Math.round(p * 100)}%`}
        </span>
        {label && <span className="mt-1 text-[0.6875rem] text-zinc-500">{label}</span>}
      </div>
    </div>
  );
}

/** Key / value list used in detail panels. */
export function DescriptionList({ items, className }: { items: { label: React.ReactNode; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-zinc-100', className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="shrink-0 text-zinc-500">{it.label}</dt>
          <dd className="min-w-0 text-right font-medium text-zinc-900">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Callout({
  tone = 'neutral',
  icon,
  title,
  children,
  className,
  action,
}: {
  tone?: 'neutral' | 'red' | 'amber' | 'green' | 'blue';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const t = {
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    red: 'border-brand-200 bg-brand-50/70 text-brand-900',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    blue: 'border-sky-200 bg-sky-50/80 text-sky-900',
  }[tone];
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', t, className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-surface px-1 font-sans text-[0.6875rem] font-medium text-zinc-500 shadow-[0_1px_0_rgb(24_24_27/0.08)]">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------
// Table primitives
// ---------------------------------------------------------------------

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-zinc-200/80 bg-zinc-50/80 text-[0.75rem] font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </thead>
  );
}

export function TH({ className, children, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('whitespace-nowrap px-4 py-3 font-medium first:pl-5 last:pr-5', className)} {...p}>
      {children}
    </th>
  );
}

export function TR({ className, children, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/70', className)} {...p}>
      {children}
    </tr>
  );
}

export function TD({ className, children, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3.5 align-middle first:pl-5 last:pr-5', className)} {...p}>
      {children}
    </td>
  );
}
