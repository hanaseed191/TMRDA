'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = MockDataStore.getCurrentUser();
    setCurrentUser(user);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    toast.info('ออกจากระบบเรียบร้อยแล้ว');
    router.push('/login');
  };

  return (
    <header className="flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 bg-white border-b border-zinc-200 shadow-sm font-prompt">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-zinc-100 md:hidden text-zinc-700 transition-colors flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <i className="fa-solid fa-bars text-lg leading-none" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2 leading-none">
            <span className="bg-red-600 text-white w-9 h-9 rounded-lg flex items-center justify-center text-base shadow-sm leading-none">
              <i className="fa-solid fa-shield-halved" />
            </span>
            TMRDA
          </span>
        </Link>
        <div className="hidden md:flex items-center text-sm font-semibold text-zinc-700 border-l border-zinc-200 pl-4 h-6 leading-none">
          ระบบบริหารจัดการการฝึกอบรม (Training Management System)
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="hidden sm:inline-flex bg-zinc-950 text-white hover:bg-red-600 px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm flex items-center gap-2 leading-none"
        >
          <i className="fa-solid fa-house text-xs" />
          <span>หน้าแรก</span>
        </Link>

        {currentUser && (
          <div className="relative flex items-center" ref={dropdownRef}>
            {/* Avatar Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-sm hover:ring-2 hover:ring-red-600 transition-all cursor-pointer focus:outline-none select-none"
              aria-label="User Menu"
            >
              <span className="flex items-center justify-center w-full h-full text-center leading-none">
                {currentUser.first_name_th.charAt(0)}
              </span>
            </button>

            {/* Custom Shadcn Style Profile Dropdown Card */}
            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-zinc-200 shadow-2xl rounded-xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
                {/* Header User Info */}
                <div className="px-3 py-3 border-b border-zinc-100 bg-zinc-50/50 rounded-t-lg mb-1">
                  <p className="text-zinc-950 font-bold text-sm leading-snug">
                    {currentUser.title_th} {currentUser.first_name_th} {currentUser.last_name_th}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium leading-tight mt-1">
                    เลขบัตร: {currentUser.th_human_number}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3 py-2.5 hover:bg-zinc-100 rounded-md font-medium text-xs text-zinc-800 flex items-center gap-3 transition-colors leading-none"
                  >
                    <i className="fa-solid fa-user text-zinc-600 text-sm w-4 text-center" />
                    <span>ข้อมูลส่วนตัว / สิทธิ</span>
                  </Link>

                  <Link
                    href="/dashboard/labor-status"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3 py-2.5 hover:bg-zinc-100 rounded-md font-medium text-xs text-zinc-800 flex items-center gap-3 transition-colors leading-none"
                  >
                    <i className="fa-solid fa-id-card-clip text-zinc-600 text-sm w-4 text-center" />
                    <span>อัปเดตประวัติแรงงาน</span>
                  </Link>

                  {currentUser.is_admin === 1 && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full px-3 py-2.5 hover:bg-red-50 text-red-600 font-bold rounded-md text-xs flex items-center gap-3 transition-colors leading-none"
                    >
                      <i className="fa-solid fa-user-shield text-sm w-4 text-center" />
                      <span>จัดการระบบ Admin</span>
                    </Link>
                  )}
                </div>

                <div className="border-t border-zinc-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md font-bold text-xs flex items-center gap-3 transition-colors text-left leading-none"
                  >
                    <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
