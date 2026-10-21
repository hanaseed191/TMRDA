'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface SidebarProps {
  currentUser?: User | null;
  isOpen?: boolean;
}

export default function Sidebar({ currentUser, isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = currentUser?.is_admin === 1;

  const handleLogout = () => {
    toast.info('ออกจากระบบเรียบร้อยแล้ว');
    router.push('/login');
  };

  const navItems = isAdmin
    ? [
        { label: 'หน้าแรก', href: '/admin', icon: 'fa-solid fa-house' },
        { label: 'จัดการคอร์สเรียน', href: '/admin?view=courses', icon: 'fa-solid fa-book-open' },
        { label: 'จัดการชุดข้อสอบ', href: '/admin?view=exams', icon: 'fa-solid fa-file-pen' },
        { label: 'จัดการสมาชิก & เอกสาร', href: '/admin?view=users', icon: 'fa-solid fa-users-gear' },
        { label: 'การประเมินผลปฏิบัติ', href: '/admin?view=evaluations', icon: 'fa-solid fa-list-check' },
        { label: 'รายงานผลการทดสอบ', href: '/admin?view=reports', icon: 'fa-solid fa-chart-column' },
      ]
    : [
        { label: 'หน้าแรก', href: '/dashboard', icon: 'fa-solid fa-house' },
        { label: 'รายการคอร์สเรียน', href: '/courses', icon: 'fa-solid fa-graduation-cap' },
        { label: 'อัปเดตประวัติแรงงาน', href: '/dashboard/labor-status', icon: 'fa-solid fa-id-card-clip' },
      ];

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col py-4 px-3 bg-white border-r border-zinc-200 z-40 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="mb-6 px-1">
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="w-10 h-10 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-base shadow-sm shrink-0">
            <i className={`fa-solid ${isAdmin ? 'fa-user-shield text-red-500' : 'fa-user'}`} />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="font-bold text-xs text-zinc-950 truncate leading-snug">
              {isAdmin ? 'TMRDA Admin' : 'TMRDA Member'}
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium truncate leading-snug">
              {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานระบบ'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="w-full mt-3 py-2.5 px-4 bg-red-600 text-white rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-700 active:scale-98 transition-all shadow-sm leading-none"
          >
            <i className="fa-solid fa-circle-plus text-sm leading-none" />
            <span>จัดการคอร์สใหม่</span>
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-1">
        {navItems.map((item) => {
          const itemParam = item.href.includes('view=') ? item.href.split('view=')[1] : 'overview';
          const searchParamsView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') || 'overview' : 'overview';
          const isActive = isAdmin
            ? (pathname === '/admin' && (item.href === '/admin' ? searchParamsView === 'overview' : searchParamsView === itemParam))
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (isAdmin && pathname === '/admin') {
                  e.preventDefault();
                  router.push(item.href);
                }
              }}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-bold transition-all leading-none ${
                isActive
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-red-600'
              }`}
            >
              <i className={`${item.icon} text-base w-5 text-center ${isActive ? 'text-red-500' : ''}`} />
              <span className="translate-y-[1px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-auto border-t border-zinc-200 space-y-1 px-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md text-xs font-bold transition-all text-left leading-none"
        >
          <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center" />
          <span className="translate-y-[1px]">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
