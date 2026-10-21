import { Check, Minus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { JourneyStep } from './data';

/** Horizontal progress stepper; wraps into two rows on small screens. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="grid grid-cols-3 gap-y-5 sm:grid-cols-6">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 top-[13px] hidden h-0.5 w-full sm:block',
                  s.state === 'done' || s.state === 'skipped' ? 'bg-emerald-200' : 'bg-zinc-200'
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-surface transition',
                s.state === 'done' && 'bg-emerald-500 text-white',
                s.state === 'current' && 'animate-pulse-ring bg-brand-600 text-white',
                s.state === 'upcoming' && 'border border-zinc-200 bg-surface text-zinc-400',
                s.state === 'error' && 'bg-brand-100 text-brand-700',
                s.state === 'skipped' && 'bg-zinc-100 text-zinc-400'
              )}
            >
              {s.state === 'done' ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : s.state === 'error' ? (
                <X className="h-3.5 w-3.5" strokeWidth={3} />
              ) : s.state === 'skipped' ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                'mt-2 text-[0.75rem] font-medium leading-tight',
                s.state === 'current' ? 'text-zinc-950' : s.state === 'upcoming' || s.state === 'skipped' ? 'text-zinc-400' : 'text-zinc-700'
              )}
            >
              {s.label}
            </span>
            {s.note && <span className="mt-0.5 text-[0.6875rem] leading-tight text-zinc-500">{s.note}</span>}
          </li>
        );
      })}
    </ol>
  );
}
