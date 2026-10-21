import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-6px_rgb(220_38_38/0.7)]',
        className
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_60%)]" />
      <ShieldCheck className="relative h-[18px] w-[18px]" strokeWidth={2.2} />
    </span>
  );
}

export function Brand({ dark, subtitle = true, className }: { dark?: boolean; subtitle?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="leading-none">
        <span className={cn('block font-display text-[1.0625rem] font-semibold tracking-tight', dark ? 'text-white' : 'text-zinc-950')}>
          TMRDA
        </span>
        {subtitle && (
          <span className={cn('mt-1 block text-[0.6875rem]', dark ? 'text-zinc-400' : 'text-zinc-500')}>
            Training & Skill Standard Platform
          </span>
        )}
      </span>
    </span>
  );
}
