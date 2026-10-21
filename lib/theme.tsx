'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from './cn';
import { THEME_STORAGE_KEY as KEY } from './theme-script';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemePref;
  resolved: 'light' | 'dark';
  setTheme: (t: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', resolved: 'light', setTheme: () => undefined });

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  const apply = useCallback((t: ThemePref) => {
    const dark = t === 'dark' || (t === 'system' && systemDark());
    document.documentElement.classList.toggle('dark', dark);
    setResolved(dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    let saved: ThemePref = 'system';
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark' || v === 'system') saved = v;
    } catch {
      /* storage unavailable — follow the system */
    }
    setThemeState(saved);
    apply(saved);
  }, [apply]);

  // Follow OS changes while on "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const h = () => apply('system');
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [theme, apply]);

  const setTheme = useCallback(
    (t: ThemePref) => {
      setThemeState(t);
      try {
        localStorage.setItem(KEY, t);
      } catch {
        /* ignore */
      }
      apply(t);
    },
    [apply]
  );

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

const OPTIONS: { value: ThemePref; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
  { value: 'system', label: 'ตามระบบ', icon: Monitor },
];

/** Compact three-way switch: light / dark / system. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-xl bg-zinc-100 p-0.5', className)} role="radiogroup" aria-label="ธีมการแสดงผล">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          title={label}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-[10px] transition',
            theme === value ? 'bg-surface text-zinc-950 shadow-card' : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
