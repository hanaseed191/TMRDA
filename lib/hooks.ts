'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './format';

/**
 * Load async data with loading / error state.
 * `reload()` refetches without flashing the skeleton (keeps previous data).
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback(async (silent: boolean) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const result = await fnRef.current();
      if (id === seq.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === seq.current) setError(errorMessage(e));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run(true), [run]);
  return { data, setData, error, loading, reload };
}

export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay = 600) {
  const t = useRef<ReturnType<typeof setTimeout>>();
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => () => clearTimeout(t.current), []);
  return useCallback(
    (...args: A) => {
      clearTimeout(t.current);
      t.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

/** Warn before closing the tab while there are unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

/** Ticking "now" for countdowns. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
