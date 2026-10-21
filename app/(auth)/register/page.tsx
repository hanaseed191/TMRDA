'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, GraduationCap, MapPin, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { FullPageLoader, homeFor, useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { DISABILITY_TYPES, EDUCATION_LEVELS, SEXES, TITLE_TH_TO_EN, TITLE_TO_SEX, TITLES_EN, TITLES_TH } from '@/lib/constants';
import { errorMessage, formatCitizenId, formatPhone, isValidCitizenId, thaiDate } from '@/lib/format';
import { Button, Card, Checkbox, Field, Input, Segmented, Select } from '@/components/ui';
import { Brand } from '@/components/Brand';
import { ThemeToggle } from '@/lib/theme';
import { AddressFields, emptyAddress, type AddressValue } from '@/components/student/AddressFields';

const STEPS = [
  { title: 'ข้อมูลบุคคล', icon: UserRound },
  { title: 'บัญชีและการติดต่อ', icon: ShieldCheck },
  { title: 'ที่อยู่', icon: MapPin },
  { title: 'การศึกษาและตรวจทาน', icon: GraduationCap },
] as const;

interface RegForm extends AddressValue {
  th_human_number: string;
  title_th: string;
  first_name_th: string;
  last_name_th: string;
  title_en: string;
  first_name_en: string;
  last_name_en: string;
  sex_name: string;
  birth_day: string;
  nationality_name: string;
  physical: 'ปกติ' | 'พิการ';
  disabilities: string[];
  phone_number: string;
  email: string;
  password: string;
  confirm: string;
  education_level: string;
  branch_name: string;
  consent: boolean;
}

type Errors = Partial<Record<keyof RegForm, string>>;

const initial: RegForm = {
  ...emptyAddress,
  th_human_number: '',
  title_th: 'นาย',
  first_name_th: '',
  last_name_th: '',
  title_en: 'Mr.',
  first_name_en: '',
  last_name_en: '',
  sex_name: 'ชาย',
  birth_day: '',
  nationality_name: 'ไทย',
  physical: 'ปกติ',
  disabilities: [],
  phone_number: '',
  email: '',
  password: '',
  confirm: '',
  education_level: '',
  branch_name: '',
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const THAI_RE = /^[฀-๿\s.]+$/;

function validate(step: number, f: RegForm): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!/^\d{13}$/.test(f.th_human_number)) e.th_human_number = 'กรอกเลขบัตรประชาชนให้ครบ 13 หลัก';
    else if (!isValidCitizenId(f.th_human_number)) e.th_human_number = 'เลขบัตรประชาชนไม่ถูกต้อง (ตรวจสอบหลักสุดท้าย)';
    if (!f.first_name_th.trim()) e.first_name_th = 'กรอกชื่อ';
    else if (!THAI_RE.test(f.first_name_th.trim())) e.first_name_th = 'ใช้ตัวอักษรภาษาไทย';
    if (!f.last_name_th.trim()) e.last_name_th = 'กรอกนามสกุล';
    else if (!THAI_RE.test(f.last_name_th.trim())) e.last_name_th = 'ใช้ตัวอักษรภาษาไทย';
    if (f.first_name_en && !/^[A-Za-z\s.'-]+$/.test(f.first_name_en)) e.first_name_en = 'ใช้ตัวอักษรภาษาอังกฤษ';
    if (f.last_name_en && !/^[A-Za-z\s.'-]+$/.test(f.last_name_en)) e.last_name_en = 'ใช้ตัวอักษรภาษาอังกฤษ';
    if (!f.birth_day) e.birth_day = 'เลือกวันเกิด';
    else {
      const age = (Date.now() - new Date(f.birth_day).getTime()) / (365.25 * 86400000);
      if (age < 15 || age > 100) e.birth_day = 'อายุต้องอยู่ระหว่าง 15–100 ปี';
    }
    if (!f.nationality_name.trim()) e.nationality_name = 'กรอกสัญชาติ';
    if (f.physical === 'พิการ' && f.disabilities.length === 0) e.disabilities = 'เลือกประเภทความพิการอย่างน้อย 1 ข้อ';
  }
  if (step === 1) {
    if (!/^0\d{9}$/.test(f.phone_number)) e.phone_number = 'เบอร์โทรศัพท์มือถือ 10 หลัก ขึ้นต้นด้วย 0';
    if (!EMAIL_RE.test(f.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (f.password.length < 8) e.password = 'รหัสผ่านอย่างน้อย 8 ตัวอักษร';
    if (f.confirm !== f.password) e.confirm = 'รหัสผ่านไม่ตรงกัน';
  }
  if (step === 2) {
    if (!f.house_number.trim()) e.house_number = 'กรอกบ้านเลขที่';
    if (!f.province_name) e.province_name = 'เลือกจังหวัด';
    if (!f.district_name) e.district_name = 'เลือกเขต/อำเภอ';
    if (!f.subdistrict_name) e.subdistrict_name = 'เลือกแขวง/ตำบล';
  }
  if (step === 3) {
    if (!f.education_level) e.education_level = 'เลือกวุฒิการศึกษา';
    if (!f.consent) e.consent = 'กรุณายอมรับเงื่อนไขก่อนสมัคร';
  }
  return e;
}

function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, Math.max(1, s));
  return { score, label: ['', 'อ่อน', 'พอใช้', 'ดี', 'แข็งแรงมาก'][score] };
}

export default function RegisterPage() {
  const { user, ready, register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegForm>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user && !submitting) router.replace(homeFor(user.role));
  }, [ready, user, router, submitting]);

  const set = (patch: Partial<RegForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (attempted.has(step)) setErrors(validate(step, next));
      return next;
    });
  };

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const goNext = () => {
    const e = validate(step, form);
    setAttempted((s) => new Set(s).add(step));
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error('กรุณาตรวจสอบข้อมูลที่ไฮไลต์');
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      submit();
    }
  };

  const goTo = (s: number) => {
    setStep(s);
    setErrors(attempted.has(s) ? validate(s, form) : {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const sexId = form.sex_name === 'ชาย' ? 1 : form.sex_name === 'หญิง' ? 2 : 3;
      await register(
        {
          th_human_number: form.th_human_number,
          title_th: form.title_th,
          first_name_th: form.first_name_th.trim(),
          last_name_th: form.last_name_th.trim(),
          title_en: form.title_en,
          first_name_en: form.first_name_en.trim(),
          last_name_en: form.last_name_en.trim(),
          sex_name: form.sex_name,
          gender_id: sexId,
          birth_day: form.birth_day,
          nationality_name: form.nationality_name.trim(),
          physical_id: form.physical === 'ปกติ' ? 1 : 2,
          disability_types: form.physical === 'พิการ' ? form.disabilities.join(',') : '',
          phone_number: form.phone_number,
          email: form.email.trim().toLowerCase(),
          house_number: form.house_number.trim(),
          house_group: form.house_group ? Number(form.house_group) : null,
          road_name: form.road_name.trim(),
          alley_name: form.alley_name.trim(),
          province_name: form.province_name,
          district_name: form.district_name,
          subdistrict_name: form.subdistrict_name,
          zip_code: form.zip_code,
          education_level: form.education_level,
          branch_name: form.branch_name.trim(),
        },
        form.password
      );
      toast.success('สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ TMRDA');
      router.replace('/dashboard?welcome=1');
    } catch (err) {
      setSubmitting(false);
      const raw = err instanceof Error ? err.message : String(err);
      const msg = errorMessage(err);
      if (raw.includes('DUPLICATE_ID') || raw.includes('INVALID_ID')) {
        setStep(0);
        setAttempted((s) => new Set(s).add(0));
        setErrors({ th_human_number: msg });
      } else if (raw.includes('DUPLICATE_EMAIL')) {
        setStep(1);
        setAttempted((s) => new Set(s).add(1));
        setErrors({ email: msg });
      } else if (raw.includes('WEAK_PASSWORD')) {
        setStep(1);
        setErrors({ password: msg });
      }
      toast.error(msg);
    }
  };

  if (ready && user && !submitting) return <FullPageLoader />;

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/login">
            <Brand subtitle={false} />
          </Link>
          <div className="flex items-center gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          <span className="text-sm text-zinc-500">
            มีบัญชีแล้ว?{' '}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </span>
          </div>
        </div>
        <div className="h-0.5 bg-zinc-100">
          <div className="h-full bg-brand-600 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 animate-fade-up text-center">
          <div className="eyebrow">สมัครสมาชิก · ขั้นตอน {step + 1} จาก {STEPS.length}</div>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{STEPS[step].title}</h1>
        </div>

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => goTo(i)}
                  className={cn(
                    'flex w-full flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition sm:flex-row sm:px-3 sm:text-left',
                    i < step && 'hover:bg-surface'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                      done && 'bg-emerald-500 text-white',
                      current && 'bg-brand-600 text-white shadow-ring',
                      !done && !current && 'border border-zinc-200 bg-surface text-zinc-400'
                    )}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <s.icon className="h-4 w-4" />}
                  </span>
                  <span className={cn('text-[0.75rem] font-medium leading-tight sm:text-[0.8125rem]', current ? 'text-zinc-950' : 'text-zinc-500')}>
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <Card className="animate-fade-up p-5 sm:p-8" key={step}>
          {step === 0 && (
            <div className="space-y-5">
              <Field
                label="เลขบัตรประจำตัวประชาชน"
                required
                error={errors.th_human_number}
                hint={form.th_human_number.length === 13 && !errors.th_human_number ? formatCitizenId(form.th_human_number) : 'ตัวเลข 13 หลัก ไม่ต้องใส่ขีด'}
              >
                {(id) => (
                  <Input
                    id={id}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={13}
                    value={form.th_human_number}
                    invalid={!!errors.th_human_number}
                    className="font-medium tracking-[0.12em] tabular"
                    placeholder="1234567890123"
                    onChange={(e) => set({ th_human_number: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                    trailing={
                      form.th_human_number.length === 13 && isValidCitizenId(form.th_human_number) ? (
                        <span className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : undefined
                    }
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr_1fr]">
                <Field label="คำนำหน้า" required>
                  {(id) => (
                    <Select
                      id={id}
                      value={form.title_th}
                      onChange={(e) =>
                        set({ title_th: e.target.value, title_en: TITLE_TH_TO_EN[e.target.value] || form.title_en, sex_name: TITLE_TO_SEX[e.target.value] || form.sex_name })
                      }
                    >
                      {TITLES_TH.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="ชื่อ (ภาษาไทย)" required error={errors.first_name_th}>
                  {(id) => <Input id={id} value={form.first_name_th} invalid={!!errors.first_name_th} placeholder="สมชาย" onChange={(e) => set({ first_name_th: e.target.value })} />}
                </Field>
                <Field label="นามสกุล (ภาษาไทย)" required error={errors.last_name_th}>
                  {(id) => <Input id={id} value={form.last_name_th} invalid={!!errors.last_name_th} placeholder="ใจดี" onChange={(e) => set({ last_name_th: e.target.value })} />}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr_1fr]">
                <Field label="Title">
                  {(id) => (
                    <Select id={id} value={form.title_en} onChange={(e) => set({ title_en: e.target.value })}>
                      {TITLES_EN.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="First name" error={errors.first_name_en} hint="ใช้พิมพ์ในใบประกาศภาษาอังกฤษ">
                  {(id) => <Input id={id} value={form.first_name_en} invalid={!!errors.first_name_en} placeholder="Somchai" onChange={(e) => set({ first_name_en: e.target.value })} />}
                </Field>
                <Field label="Last name" error={errors.last_name_en}>
                  {(id) => <Input id={id} value={form.last_name_en} invalid={!!errors.last_name_en} placeholder="Jaidee" onChange={(e) => set({ last_name_en: e.target.value })} />}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="วันเกิด" required error={errors.birth_day}>
                  {(id) => <Input id={id} type="date" value={form.birth_day} invalid={!!errors.birth_day} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ birth_day: e.target.value })} />}
                </Field>
                <Field label="เพศ" required>
                  {(id) => (
                    <Select id={id} value={form.sex_name} onChange={(e) => set({ sex_name: e.target.value })}>
                      {SEXES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="สัญชาติ" required error={errors.nationality_name}>
                  {(id) => <Input id={id} value={form.nationality_name} invalid={!!errors.nationality_name} onChange={(e) => set({ nationality_name: e.target.value })} />}
                </Field>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[0.8125rem] font-medium text-zinc-800">สภาพร่างกาย</span>
                  <Segmented
                    value={form.physical}
                    onChange={(v) => set({ physical: v, disabilities: v === 'ปกติ' ? [] : form.disabilities })}
                    options={[
                      { value: 'ปกติ', label: 'ปกติ' },
                      { value: 'พิการ', label: 'ผู้พิการ' },
                    ]}
                  />
                </div>
                {form.physical === 'พิการ' && (
                  <div className="animate-fade-in space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {DISABILITY_TYPES.map((d) => (
                        <Checkbox
                          key={d}
                          label={`ความพิการ${d.startsWith('ทาง') ? '' : 'ทาง'}${d}`}
                          checked={form.disabilities.includes(d)}
                          onChange={(c) => set({ disabilities: c ? [...form.disabilities, d] : form.disabilities.filter((x) => x !== d) })}
                        />
                      ))}
                    </div>
                    {errors.disabilities && <p className="text-[0.8125rem] text-brand-600">{errors.disabilities}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="เบอร์โทรศัพท์มือถือ" required error={errors.phone_number}>
                  {(id) => (
                    <Input
                      id={id}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phone_number}
                      invalid={!!errors.phone_number}
                      placeholder="0812345678"
                      className="tabular"
                      onChange={(e) => set({ phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    />
                  )}
                </Field>
                <Field label="อีเมล" required error={errors.email} hint="ใช้เข้าสู่ระบบได้แทนเลขบัตรประชาชน">
                  {(id) => (
                    <Input id={id} type="email" autoComplete="email" value={form.email} invalid={!!errors.email} placeholder="name@email.com" onChange={(e) => set({ email: e.target.value })} />
                  )}
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="รหัสผ่าน" required error={errors.password}>
                  {(id) => (
                    <div className="space-y-2">
                      <Input
                        id={id}
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.password}
                        invalid={!!errors.password}
                        placeholder="อย่างน้อย 8 ตัวอักษร"
                        onChange={(e) => set({ password: e.target.value })}
                        trailing={
                          <button type="button" onClick={() => setShowPw((v) => !v)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="แสดง/ซ่อนรหัสผ่าน">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                      {form.password && (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-1 gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <span
                                key={i}
                                className={cn(
                                  'h-1 flex-1 rounded-full transition-colors',
                                  i <= strength.score ? ['bg-brand-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-600'][strength.score - 1] : 'bg-zinc-200'
                                )}
                              />
                            ))}
                          </div>
                          <span className="w-16 text-right text-xs text-zinc-500">{strength.label}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Field>
                <Field label="ยืนยันรหัสผ่าน" required error={errors.confirm}>
                  {(id) => (
                    <Input id={id} type={showPw ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} invalid={!!errors.confirm} placeholder="พิมพ์รหัสผ่านอีกครั้ง" onChange={(e) => set({ confirm: e.target.value })} />
                  )}
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p className="mb-4 text-sm text-zinc-500">ที่อยู่ตามทะเบียนบ้าน หรือตามบัตรประจำตัวประชาชน</p>
              <AddressFields value={form} onChange={(p) => set(p)} errors={errors} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="วุฒิการศึกษาสูงสุด" required error={errors.education_level}>
                  {(id) => (
                    <Select id={id} value={form.education_level} placeholder="เลือกวุฒิการศึกษา" invalid={!!errors.education_level} onChange={(e) => set({ education_level: e.target.value })}>
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="สาขาวิชา" hint="เว้นว่างได้หากไม่มี">
                  {(id) => <Input id={id} value={form.branch_name} placeholder="เช่น ช่างยนต์ / บัญชี" onChange={(e) => set({ branch_name: e.target.value })} />}
                </Field>
              </div>

              <div>
                <div className="eyebrow mb-3">ตรวจทานข้อมูล</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ReviewCard
                    title="ข้อมูลบุคคล"
                    onEdit={() => goTo(0)}
                    lines={[
                      `${form.title_th}${form.first_name_th} ${form.last_name_th}`,
                      formatCitizenId(form.th_human_number),
                      `เกิด ${thaiDate(form.birth_day)}`,
                      form.physical === 'พิการ' ? `ผู้พิการ (${form.disabilities.join(', ')})` : 'สภาพร่างกายปกติ',
                    ]}
                  />
                  <ReviewCard title="การติดต่อ" onEdit={() => goTo(1)} lines={[formatPhone(form.phone_number), form.email]} />
                  <ReviewCard
                    title="ที่อยู่"
                    onEdit={() => goTo(2)}
                    lines={[
                      [form.house_number, form.house_group && `ม.${form.house_group}`, form.alley_name && `ซ.${form.alley_name}`, form.road_name && `ถ.${form.road_name}`]
                        .filter(Boolean)
                        .join(' '),
                      `${form.subdistrict_name} ${form.district_name}`,
                      `${form.province_name} ${form.zip_code}`,
                    ]}
                  />
                </div>
              </div>

              <div className={cn('rounded-2xl border p-4 transition', errors.consent ? 'border-brand-300 bg-brand-50/40' : 'border-zinc-200 bg-zinc-50/50')}>
                <Checkbox
                  checked={form.consent}
                  onChange={(v) => set({ consent: v })}
                  label="ข้าพเจ้าขอรับรองว่าข้อมูลข้างต้นเป็นความจริง และยินยอมให้เก็บรวบรวมข้อมูลส่วนบุคคล"
                  description="เพื่อใช้ในการรับสมัคร จัดสอบ ออกใบประกาศนียบัตร และรายงานต่อหน่วยงานที่เกี่ยวข้อง ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562"
                />
                {errors.consent && <p className="mt-2 pl-7 text-[0.8125rem] text-brand-600">{errors.consent}</p>}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-zinc-100 pt-6">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)} icon={<ArrowLeft className="h-4 w-4" />}>
                ย้อนกลับ
              </Button>
            ) : (
              <span />
            )}
            <Button
              size="lg"
              variant={step === STEPS.length - 1 ? 'primary' : 'dark'}
              onClick={goNext}
              loading={submitting}
              iconRight={step < STEPS.length - 1 ? <ArrowRight className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            >
              {step < STEPS.length - 1 ? 'ถัดไป' : 'ยืนยันสมัครสมาชิก'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

function ReviewCard({ title, lines, onEdit }: { title: string; lines: string[]; onEdit: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] font-semibold text-zinc-900">{title}</span>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
          <Pencil className="h-3 w-3" />
          แก้ไข
        </button>
      </div>
      <div className="mt-2 space-y-0.5">
        {lines.filter((l) => l.trim()).map((l, i) => (
          <p key={i} className={cn('break-words text-[0.8125rem]', i === 0 ? 'font-medium text-zinc-800' : 'text-zinc-500')}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
