'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth, session } from './api';
import type { Role, User } from './types';
import { errorMessage } from './format';

interface AuthContextValue {
  user: User | null;
  /** false until the stored session has been read on the client */
  ready: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: Partial<User>, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeFor(role: Role | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'director':
      return '/approvals';
    case 'evaluator':
      return '/evaluate';
    default:
      return '/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const setUser = useCallback((u: User) => {
    const s = session.read();
    if (s) session.write({ ...s, user: u });
    setUserState(u);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setUserState(await auth.refresh());
    } catch (e) {
      const msg = errorMessage(e);
      // Only drop the session when the server says so; keep it on network hiccups.
      if (/เซสชันหมดอายุ|ถูกระงับ|ฐานข้อมูลยังไม่ได้อัปเดต/.test(msg)) {
        session.write(null);
        setUserState(null);
      }
    }
  }, []);

  useEffect(() => {
    const s = session.read();
    if (s) {
      setUserState(s.user);
      refresh();
    }
    setReady(true);
    // keep tabs in sync (logout in one tab logs out all)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tmrda_session_v2') setUserState(session.read()?.user ?? null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      setUser,
      refresh,
      async login(identifier, password) {
        const s = await auth.login(identifier, password);
        setUserState(s.user);
        return s.user;
      },
      async register(data, password) {
        const s = await auth.register(data, password);
        setUserState(s.user);
        return s.user;
      },
      async logout() {
        await auth.logout().catch(() => undefined);
        setUserState(null);
      },
    }),
    [user, ready, setUser, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** The signed-in user; only use inside a <RequireAuth> tree. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser used outside <RequireAuth>');
  return user;
}

export function FullPageLoader({ label = 'กำลังโหลด…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 text-zinc-500">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Redirects to /login when signed out, or home when the role is not allowed. */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    else if (!allowed) router.replace(homeFor(user.role));
  }, [ready, user, allowed, router, pathname]);

  if (!ready || !allowed) return <FullPageLoader />;
  return <>{children}</>;
}
