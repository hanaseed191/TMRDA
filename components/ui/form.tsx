'use client';

import React, { useId } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------
// Field wrapper: label + control + hint / error
// ---------------------------------------------------------------------

interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (id: string) => React.ReactNode;
  aside?: React.ReactNode;
}

export function Field({ label, hint, error, required, className, children, aside }: FieldProps) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-[0.8125rem] font-medium text-zinc-800">
              {label}
              {required && <span className="ml-0.5 text-brand-600">*</span>}
            </label>
          )}
          {aside}
        </div>
      )}
      {children(id)}
      {error ? (
        <p className="animate-fade-in text-[0.8125rem] text-brand-600">{error}</p>
      ) : hint ? (
        <p className="text-[0.8125rem] text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...props },
  ref
) {
  if (!leading && !trailing) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn('control h-11', className)} {...props} />;
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-zinc-400">{leading}</span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn('control h-11', leading && 'pl-10', trailing && 'pr-11', className)}
        {...props}
      />
      {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
    </div>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn('control resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; placeholder?: string }
>(function Select({ className, invalid, children, placeholder, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn('control h-11 cursor-pointer appearance-none pr-10', className)}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
});

export function SearchInput({
  value,
  onChange,
  placeholder = 'ค้นหา…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="control h-10 pl-10 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="ล้างคำค้นหา"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  indeterminate,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  indeterminate?: boolean;
}) {
  return (
    <label
      className={cn(
        'group inline-flex cursor-pointer select-none items-start gap-2.5',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40',
          checked || indeterminate
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-zinc-300 bg-surface group-hover:border-zinc-400'
        )}
      >
        {indeterminate && !checked ? (
          <span className="h-0.5 w-2 rounded bg-surface" />
        ) : (
          <Check className={cn('h-3 w-3 transition', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
        )}
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm text-zinc-800">{label}</span>}
          {description && <span className="block text-[0.8125rem] text-zinc-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'opacity-60')}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-zinc-800">{label}</span>}
          {description && <span className="block text-[0.8125rem] text-zinc-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-zinc-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}

/** Pill-style single choice (e.g. ทำงาน / ไม่ทำงาน). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1', className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg font-medium transition',
            size === 'sm' ? 'h-7 px-2.5 text-[0.8125rem]' : 'h-9 px-3.5 text-sm',
            value === o.value ? 'bg-surface text-zinc-950 shadow-card' : 'text-zinc-600 hover:text-zinc-900'
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Large selectable card used for single-choice questions in forms. */
export function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-surface p-3.5 text-left transition',
        selected ? 'border-brand-500 shadow-ring' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60',
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-600'
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-900">{title}</span>
        {description && <span className="mt-0.5 block text-[0.8125rem] text-zinc-500">{description}</span>}
      </span>
      <span
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition',
          selected ? 'border-brand-600 bg-brand-600' : 'border-zinc-300'
        )}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-surface" />}
      </span>
    </button>
  );
}
