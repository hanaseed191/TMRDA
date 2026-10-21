'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MockDataStore } from '@/lib/supabase/mockStore';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast.error('กรุณากรอกเลขบัตรประชาชน หรือ อีเมล');
      return;
    }

    setLoading(true);
    try {
      const users = await MockDataStore.getUsers();
      const user = users.find(
        (u) =>
          u.th_human_number === identifier ||
          u.email.toLowerCase() === identifier.toLowerCase()
      );

      if (user) {
        MockDataStore.setCurrentUser(user);
        toast.success(`ยินดีต้อนรับ ${user.title_th} ${user.first_name_th} ${user.last_name_th}`);
        router.push(user.is_admin === 1 ? '/admin' : '/dashboard');
      } else {
        const newUser = await MockDataStore.addUser({
          th_human_number: identifier.length === 13 ? identifier : '19999' + Math.floor(10000000 + Math.random() * 90000000),
          first_name_th: 'ผู้ใช้งาน',
          last_name_th: 'ทดสอบ',
          first_name_en: 'Test',
          last_name_en: 'User',
          title_th: 'นาย',
          title_en: 'Mr.',
          phone_number: '0810000000',
          email: identifier.includes('@') ? identifier : 'user@tmrda.com',
          house_number: '100/1',
          is_admin: 0,
        });
        MockDataStore.setCurrentUser(newUser);
        toast.success('เข้าสู่ระบบสำเร็จ (บัญชีผู้ใช้งานใหม่)');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'user') => {
    const targetId = role === 'admin' ? '1111111111111' : '1234567890123';
    setIdentifier(targetId);
    setPassword('password123');

    const users = await MockDataStore.getUsers();
    const user = users.find((u) => u.th_human_number === targetId);
    if (user) {
      MockDataStore.setCurrentUser(user);
      toast.success(`เข้าสู่ระบบสาธิต (${role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'})`);
      router.push(role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white font-prompt">
      {/* Left Panel: Full Dark Split Screen (Exact Shadcn Dashboard Auth Style) */}
      <div className="hidden lg:flex lg:col-span-5 bg-zinc-950 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-zinc-800">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TMRDA</span>
        </div>

        {/* Middle Hero Section (Matching Image: Icon + Hello again + Subtitle) */}
        <div className="relative z-10 my-auto text-center py-12 space-y-4 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner text-white">
            <i className="fa-solid fa-clover text-4xl text-red-500" />
          </div>

          <h1 className="text-4xl font-light tracking-tight text-white pt-2">
            Hello again
          </h1>

          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            Login to continue to TMRDA Training Management & Registration Data Administration System
          </p>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-zinc-500 font-light">
          © 2026 TMRDA System. All rights reserved.
        </div>
      </div>

      {/* Right Panel: White Clean Form Area */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 min-h-screen bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header text matching screenshot layout */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Login</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed font-normal">
              Welcome back. Enter your Citizen ID / Email and password to access your TMRDA account.
            </p>
          </div>

          {/* Quick Demo Login Buttons */}
          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-zinc-600 block text-center flex items-center justify-center gap-1.5">
              <i className="fa-solid fa-bolt text-red-600" />
              ทดสอบระบบด้วยบัญชีตัวอย่าง (Demo Quick Login)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm leading-none"
              >
                <i className="fa-solid fa-user-shield text-xs" />
                <span>ผู้ดูแลระบบ (Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="py-2 px-3 bg-zinc-900 text-white text-xs font-bold rounded-md hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 shadow-sm leading-none"
              >
                <i className="fa-solid fa-user text-xs" />
                <span>สมาชิก (User)</span>
              </button>
            </div>
          </div>

          {/* Main Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1.5">
                Email Address / Citizen ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="1111111111111 or admin@tmrda.com"
                className="w-full h-11 border border-zinc-200 rounded-md px-3.5 text-xs focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all bg-white font-medium placeholder:text-zinc-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 border border-zinc-200 rounded-md px-3.5 text-xs focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all bg-white font-medium placeholder:text-zinc-400"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600 font-normal">
                <input type="checkbox" className="checkbox checkbox-xs rounded border-zinc-300" defaultChecked />
                <span>Remember me for 30 days</span>
              </label>
              <a href="#" className="text-zinc-900 font-bold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-950 text-white rounded-md font-bold text-xs hover:bg-red-600 transition-all shadow-sm flex items-center justify-center gap-2 leading-none"
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Footer Registration Link */}
          <div className="text-center pt-2 text-xs text-zinc-500 font-normal">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-zinc-950 font-bold hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
