'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  FileStack,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Stamp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { fullName, ROLE_LABEL } from '@/lib/format';
import { documentUrl } from '@/lib/api';
import type { Role } from '@/lib/types';
import { Avatar } from '@/components/ui';
import { Brand } from '@/components/Brand';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { ThemeToggle } from '@/lib/theme';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** extra path prefixes that should mark this item active */
  match?: string[];
  exact?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV: Record<Role, NavGroup[]> = {
  user: [
    {
      items: [
        { label: 'หน้าหลัก', href: '/dashboard', icon: LayoutDashboard, exact: true },
        { label: 'หลักสูตรและการสอบ', href: '/courses', icon: GraduationCap, match: ['/exam'] },
        { label: 'ผลสอบและใบประกาศ', href: '/results', icon: Award },
      ],
    },
    { title: 'บัญชี', items: [{ label: 'ข้อมูลส่วนตัว', href: '/profile', icon: UserRound }] },
  ],
  admin: [
    {
      items: [{ label: 'ภาพรวม', href: '/admin', icon: LayoutDashboard, exact: true }],
    },
    {
      title: 'การฝึกอบรมและการสอบ',
      items: [
        { label: 'หลักสูตร', href: '/admin/courses', icon: BookOpen, match: ['/admin/exams'] },
        { label: 'ผลคะแนนและส่งอนุมัติ', href: '/admin/results', icon: FileStack },
      ],
    },
    {
      title: 'ระบบ',
      items: [
        { label: 'สมาชิกและสิทธิ์', href: '/admin/users', icon: Users },
        { label: 'งานประเมินของฉัน', href: '/evaluate', icon: ClipboardCheck },
      ],
    },
  ],
  director: [
    {
      items: [
        { label: 'อนุมัติผลการสอบ', href: '/approvals', icon: Stamp, exact: true },
        { label: 'ใบประกาศที่ออกแล้ว', href: '/approvals/issued', icon: ScrollText },
        { label: 'งานประเมินของฉัน', href: '/evaluate', icon: ClipboardCheck },
      ],
    },
    { title: 'บัญชี', items: [{ label: 'ข้อมูลส่วนตัว', href: '/profile', icon: UserRound }] },
  ],
  evaluator: [
    {
      items: [{ label: 'งานประเมินภาคปฏิบัติ', href: '/evaluate', icon: ClipboardCheck }],
    },
    { title: 'บัญชี', items: [{ label: 'ข้อมูลส่วนตัว', href: '/profile', icon: UserRound }] },
  ],
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return [item.href, ...(item.match || [])].some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!user) return null;
  const groups = NAV[user.role] || NAV.user;
  const photo = documentUrl(user, 'id_photo_file_pathname');

  const handleLogout = async () => {
    await logout();
    toast.success('ออกจากระบบแล้ว');
    router.replace('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 dark:border-r dark:border-white/[0.06] text-ink-300">
      <div className="bg-dots-dark flex h-16 items-center justify-between px-5">
        <Link href="/" className="rounded-lg">
          <Brand dark />
        </Link>
        <button className="rounded-lg p-1.5 text-ink-400 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((g, gi) => (
          <div key={gi} className="space-y-1">
            {g.title && <div className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-500">{g.title}</div>}
            {g.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition',
                    active ? 'bg-surface/[0.08] text-white' : 'text-ink-400 hover:bg-surface/[0.04] hover:text-ink-100'
                  )}
                >
                  {active && <span className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-brand-500" />}
                  <Icon className={cn('h-[18px] w-[18px] shrink-0 transition', active ? 'text-brand-400' : 'text-ink-500 group-hover:text-ink-300')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.first_name_th} src={photo} size="sm" className="ring-ink-800" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink-100">{fullName(user)}</div>
            <div className="truncate text-xs text-ink-500">{ROLE_LABEL[user.role]}</div>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-ink-500 transition hover:bg-white/10 hover:text-white" title="ออกจากระบบ" aria-label="ออกจากระบบ">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-slide-in-left shadow-pop">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-zinc-200/70 bg-surface/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button className="-ml-1 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Brand subtitle={false} />
          </div>
          <div className="flex-1" />
          <ThemeToggle className="hidden sm:inline-flex" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-zinc-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={user.first_name_th} src={photo} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium text-zinc-900">{user.first_name_th}</span>
                <span className="block text-[0.6875rem] text-zinc-500">{ROLE_LABEL[user.role]}</span>
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 animate-scale-in rounded-2xl border border-zinc-200 bg-surface p-1.5 shadow-pop" role="menu">
                <div className="px-3 py-2.5">
                  <div className="truncate text-sm font-semibold text-zinc-900">{fullName(user)}</div>
                  <div className="truncate text-xs text-zinc-500">{user.email}</div>
                </div>
                <div className="my-1 h-px bg-zinc-100" />
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-zinc-700 hover:bg-zinc-100">
                  <UserRound className="h-4 w-4 text-zinc-400" />
                  ข้อมูลส่วนตัว
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPwOpen(true);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  <KeyRound className="h-4 w-4 text-zinc-400" />
                  เปลี่ยนรหัสผ่าน
                </button>
                <div className="my-1 h-px bg-zinc-100" />
                <button onClick={handleLogout} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-brand-700 hover:bg-brand-50">
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}
