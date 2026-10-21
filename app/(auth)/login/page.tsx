'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Award, ClipboardCheck, Eye, EyeOff, GraduationCap, KeyRound, Stamp, TriangleAlert, UserRound, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { FullPageLoader, homeFor, useAuth } from '@/lib/auth';
import { schemaReady } from '@/lib/api';
import { errorMessage, fullName } from '@/lib/format';
import { Button, Callout, Field, Input } from '@/components/ui';
import { Brand } from '@/components/Brand';
import { ThemeToggle } from '@/lib/theme';

const STEPS = [
  { icon: UserPlus, title: 'สมัครสมาชิกและหลักสูตร', text: 'กรอกข้อมูลครั้งเดียว ใช้ได้ทุกหลักสูตร' },
  { icon: GraduationCap, title: 'สอบภาคทฤษฎีออนไลน์', text: 'จับเวลา บันทึกคำตอบอัตโนมัติ รู้ผลทันที' },
  { icon: ClipboardCheck, title: 'ประเมินภาคปฏิบัติ', text: 'ผู้ประเมิน 3 ท่าน คะแนนเฉลี่ยโปร่งใส' },
  { icon: Stamp, title: 'ผู้อำนวยการอนุมัติผล', text: 'ตรวจสอบและรับรองผลอย่างเป็นทางการ' },
  { icon: Award, title: 'พิมพ์ใบประกาศนียบัตร', text: 'มีเลขที่ใบประกาศสำหรับตรวจสอบ' },
];

const DEMO_ACCOUNTS = [
  { role: 'ผู้ดูแลระบบ', id: '1111111111111', pw: 'admin123' },
  { role: 'ผู้อำนวยการ', id: '3333333333333', pw: 'director123' },
  { role: 'ผู้ประเมิน', id: '4444444444441', pw: 'evaluator123' },
  { role: 'ผู้สมัคร', id: '1234567890123', pw: 'user123' },
];

function LoginForm() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') && next !== '/login' ? next : null;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true';

  useEffect(() => {
    if (ready && user) router.replace(safeNext || homeFor(user.role));
  }, [ready, user, router, safeNext]);

  useEffect(() => {
    schemaReady()
      .then(setDbReady)
      .catch(() => setDbReady(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('กรุณากรอกเลขบัตรประชาชน/อีเมล และรหัสผ่าน');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const u = await login(identifier.trim(), password);
      toast.success(`ยินดีต้อนรับ ${fullName(u)}`);
      router.replace(safeNext || homeFor(u.role));
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  if (ready && user) return <FullPageLoader label="กำลังเข้าสู่ระบบ…" />;

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink-950 text-white lg:flex lg:flex-col">
        <div className="bg-dots-dark absolute inset-0" />
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="absolute -bottom-48 right-0 h-[420px] w-[420px] rounded-full bg-brand-500/10 blur-[120px]" />

        <div className="relative flex flex-1 flex-col px-12 py-10 xl:px-16">
          <Brand dark />
          <div className="my-auto max-w-lg py-12">
            <div className="eyebrow !text-brand-400">ศูนย์ฝึกอบรมและทดสอบมาตรฐานฝีมือแรงงาน</div>
            <h1 className="mt-4 font-display text-[2.5rem] font-semibold leading-[1.15] tracking-tight !text-white">
              ทุกขั้นตอนของการสอบ
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-rose-300 bg-clip-text text-transparent">จบในที่เดียว</span>
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-400">
              ตั้งแต่สมัครหลักสูตร สอบทฤษฎี ประเมินปฏิบัติ จนถึงอนุมัติผลและพิมพ์ใบประกาศนียบัตร
            </p>

            <ol className="mt-10 space-y-1">
              {STEPS.map((s, i) => (
                <li key={s.title} className="group flex items-start gap-4 rounded-2xl px-3 py-3 transition hover:bg-surface/[0.04]">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface/[0.04] text-brand-400">
                    <s.icon className="h-[18px] w-[18px]" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-800 text-[0.625rem] font-semibold text-ink-300 ring-2 ring-ink-950">
                      {i + 1}
                    </span>
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-sm font-medium text-ink-100">{s.title}</span>
                    <span className="block text-[0.8125rem] text-ink-500">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-ink-600">© {new Date().getFullYear() + 543} TMRDA · Training Management & Registration Data Administration</p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <div className="lg:hidden">
            <Brand />
          </div>
          <ThemeToggle className="ml-auto" />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <div className="animate-fade-up">
            <h2 className="text-[1.75rem] font-semibold">เข้าสู่ระบบ</h2>
            <p className="mt-1.5 text-sm text-zinc-500">ใช้เลขบัตรประชาชน 13 หลัก หรืออีเมลที่ลงทะเบียนไว้</p>
          </div>

          {dbReady === false && (
            <Callout tone="amber" icon={<TriangleAlert className="h-4 w-4" />} title="ฐานข้อมูลยังไม่พร้อมใช้งาน" className="mt-6">
              ผู้ดูแลระบบต้องรันไฟล์ <code className="rounded bg-amber-100 px-1 text-[0.8125rem]">supabase/migrations/001_tmrda_v2.sql</code> ใน
              Supabase SQL Editor ก่อนเริ่มใช้งาน
            </Callout>
          )}

          <form onSubmit={submit} className="mt-8 space-y-4 animate-fade-up [animation-delay:60ms]" noValidate>
            <Field label="เลขบัตรประชาชน หรือ อีเมล">
              {(id) => (
                <Input
                  id={id}
                  autoComplete="username"
                  autoFocus
                  value={identifier}
                  invalid={!!error}
                  leading={<UserRound className="h-4 w-4" />}
                  placeholder="1234567890123 หรือ name@email.com"
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                />
              )}
            </Field>
            <Field label="รหัสผ่าน">
              {(id) => (
                <Input
                  id={id}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  invalid={!!error}
                  leading={<KeyRound className="h-4 w-4" />}
                  placeholder="••••••••"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              )}
            </Field>

            {error && (
              <div role="alert" className="animate-fade-in rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={<ArrowRight className="h-4 w-4" />}>
              เข้าสู่ระบบ
            </Button>
            <p className="text-center text-[0.8125rem] text-zinc-500">ลืมรหัสผ่าน? ติดต่อเจ้าหน้าที่เพื่อตั้งรหัสผ่านใหม่</p>
          </form>

          {showDemo && (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-4">
              <div className="eyebrow">บัญชีทดสอบ (เฉพาะสภาพแวดล้อมทดสอบ)</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setIdentifier(a.id);
                      setPassword(a.pw);
                      setError(null);
                    }}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <span className="block text-[0.8125rem] font-medium text-zinc-800">{a.role}</span>
                    <span className="block font-mono text-[0.6875rem] text-zinc-500">{a.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex items-center gap-3 text-sm">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-zinc-400">ยังไม่มีบัญชี?</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <Link
            href="/register"
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 text-[0.9375rem] font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <UserPlus className="h-4 w-4 text-brand-600" />
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
