'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'soft' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_1px_2px_rgb(220_38_38/0.35)] hover:bg-brand-700 focus-visible:ring-brand-600/40',
  dark: 'bg-zinc-950 text-zinc-50 shadow-[0_1px_0_rgb(255_255_255/0.12)_inset] hover:bg-zinc-800 focus-visible:ring-zinc-900/30',
  outline:
    'border border-zinc-200 bg-surface text-zinc-800 shadow-[0_1px_0_rgb(24_24_27/0.04)] hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-zinc-900/15',
  ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:ring-zinc-900/15',
  soft: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200/80 focus-visible:ring-zinc-900/15',
  danger:
    'border border-brand-200 bg-surface text-brand-700 hover:border-brand-300 hover:bg-brand-50 focus-visible:ring-brand-600/30',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/30',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[0.9375rem]',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'className'> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
