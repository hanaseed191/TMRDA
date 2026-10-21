'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Eye, FileText, GraduationCap, ImageIcon, LoaderCircle, MapPin, RefreshCw, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useUser } from '@/lib/auth';
import { documentUrl, labor as laborApi, users } from '@/lib/api';
import { cn } from '@/lib/cn';
import { DISABILITY_TYPES, EDUCATION_LEVELS, LABOR, MAX_UPLOAD_BYTES, SEXES, TITLE_TH_TO_EN, TITLES_EN, TITLES_TH } from '@/lib/constants';
import { errorMessage, formatCitizenId, fullName, ROLE_LABEL, toDateInput } from '@/lib/format';
import { useLoad, useUnsavedWarning } from '@/lib/hooks';
import type { DocumentField, LaborHistory, User } from '@/lib/types';
import { Avatar, Badge, Button, Card, Checkbox, Dialog, Field, Input, Section, Segmented, Select, Skeleton, Tabs } from '@/components/ui';
import { AddressFields, type AddressValue } from '@/components/student/AddressFields';
import { DOC_FIELDS } from '@/components/student/data';

type Tab = 'personal' | 'address' | 'education' | 'documents' | 'labor';

interface ProfileForm extends AddressValue {
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
  education_level: string;
  branch_name: string;
}

function fromUser(u: User): ProfileForm {
  return {
    title_th: u.title_th || 'นาย',
    first_name_th: u.first_name_th || '',
    last_name_th: u.last_name_th || '',
    title_en: u.title_en || 'Mr.',
    first_name_en: u.first_name_en || '',
    last_name_en: u.last_name_en || '',
    sex_name: u.sex_name || 'ชาย',
    birth_day: toDateInput(u.birth_day),
    nationality_name: u.nationality_name || 'ไทย',
    physical: u.physical_id === 2 ? 'พิการ' : 'ปกติ',
    disabilities: (u.disability_types || '').split(',').map((s) => s.trim()).filter(Boolean),
    phone_number: u.phone_number || '',
    email: u.email || '',
    house_number: u.house_number && u.house_number !== '-' ? u.house_number : '',
    house_group: u.house_group ? String(u.house_group) : '',
    road_name: u.road_name || '',
    alley_name: u.alley_name || '',
    province_name: u.province_name || '',
    district_name: u.district_name || '',
    subdistrict_name: u.subdistrict_name || '',
    zip_code: u.zip_code || '',
    education_level: u.education_level || '',
    branch_name: u.branch_name || '',
  };
}

function toPatch(f: ProfileForm): Partial<User> {
  return {
    title_th: f.title_th,
    first_name_th: f.first_name_th.trim(),
    last_name_th: f.last_name_th.trim(),
    title_en: f.title_en,
    first_name_en: f.first_name_en.trim(),
    last_name_en: f.last_name_en.trim(),
    sex_name: f.sex_name,
    birth_day: f.birth_day || undefined,
    nationality_name: f.nationality_name.trim(),
    physical_id: f.physical === 'พิการ' ? 2 : 1,
    disability_types: f.physical === 'พิการ' ? f.disabilities.join(',') : '',
    phone_number: f.phone_number,
    email: f.email.trim().toLowerCase(),
    house_number: f.house_number.trim() || '-',
    house_group: f.house_group ? Number(f.house_group) : null,
    road_name: f.road_name.trim(),
    alley_name: f.alley_name.trim(),
    province_name: f.province_name,
    district_name: f.district_name,
    subdistrict_name: f.subdistrict_name,
    zip_code: f.zip_code,
    education_level: f.education_level,
    branch_name: f.branch_name.trim(),
  };
}

function defaultLabor(u: User): LaborHistory {
  return {
    user_id: u.id,
    is_have_job: LABOR.haveJob[0],
    labor_status: LABOR.status[0],
    labor_salary: LABOR.salary[0],
    occupation: '',
    position: '',
    year_of_service: '',
    agency_name: '',
    province_id: 1,
    phone_number: '',
    industrial_groups_working: LABOR.industry[0],
    not_have_job_status: LABOR.notHaveJob[0],
    known_source_of_training: LABOR.source[0],
    is_accept_publish: LABOR.publish[0],
    is_want_job: LABOR.wantJob[0],
    is_want_job_inside: LABOR.wantJob[0],
    accept_job_position: '',
    accept_job_industry: '',
    accept_job_in_country_name: '',
  };
}

function validate(f: ProfileForm): Partial<Record<keyof ProfileForm, string>> {
  const e: Partial<Record<keyof ProfileForm, string>> = {};
  if (!f.first_name_th.trim()) e.first_name_th = 'กรอกชื่อ';
  if (!f.last_name_th.trim()) e.last_name_th = 'กรอกนามสกุล';
  if (!/^0\d{8,9}$/.test(f.phone_number)) e.phone_number = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'อีเมลไม่ถูกต้อง';
  return e;
}

function ProfileInner() {
  const user = useUser();
  const { setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const isCandidate = user.role === 'user';

  const tabs = useMemo(
    () =>
      [
        { value: 'personal' as Tab, label: 'ข้อมูลส่วนตัว', icon: <UserRound className="h-4 w-4" /> },
        { value: 'address' as Tab, label: 'ที่อยู่', icon: <MapPin className="h-4 w-4" /> },
        { value: 'education' as Tab, label: 'การศึกษา', icon: <GraduationCap className="h-4 w-4" /> },
        { value: 'documents' as Tab, label: 'เอกสารแนบ', icon: <FileText className="h-4 w-4" /> },
        ...(isCandidate ? [{ value: 'labor' as Tab, label: 'ประวัติแรงงาน', icon: <Briefcase className="h-4 w-4" /> }] : []),
      ],
    [isCandidate]
  );
  const requested = params.get('tab') as Tab | null;
  const tab: Tab = requested && tabs.some((t) => t.value === requested) ? requested : 'personal';
  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  // Profile form
  const [base, setBase] = useState<ProfileForm>(() => fromUser(user));
  const [form, setForm] = useState<ProfileForm>(base);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const profileDirty = JSON.stringify(form) !== JSON.stringify(base);

  // Labor form
  const laborLoad = useLoad(() => (isCandidate ? laborApi.get(user.id) : Promise.resolve(null)), [user.id, isCandidate]);
  const [laborBase, setLaborBase] = useState<LaborHistory>(() => defaultLabor(user));
  const [laborForm, setLaborForm] = useState<LaborHistory>(laborBase);
  const [hasLabor, setHasLabor] = useState(false);
  useEffect(() => {
    if (laborLoad.data) {
      const merged = { ...defaultLabor(user), ...laborLoad.data };
      setLaborBase(merged);
      setLaborForm(merged);
      setHasLabor(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laborLoad.data]);
  // A candidate without a saved labor history can save the defaults straight away from the labor tab.
  const laborDirty =
    isCandidate &&
    !laborLoad.loading &&
    (JSON.stringify(laborForm) !== JSON.stringify(laborBase) || (!hasLabor && tab === 'labor'));

  const dirty = profileDirty || laborDirty;
  useUnsavedWarning(dirty);
  const [saving, setSaving] = useState(false);

  const set = (p: Partial<ProfileForm>) => {
    setForm((f) => {
      const next = { ...f, ...p };
      if (Object.keys(errors).length) setErrors(validate(next));
      return next;
    });
  };
  const setL = (p: Partial<LaborHistory>) => setLaborForm((f) => ({ ...f, ...p }));

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (profileDirty && Object.keys(e).length) {
      setTab(e.phone_number || e.email || e.first_name_th || e.last_name_th ? 'personal' : tab);
      toast.error('กรุณาตรวจสอบข้อมูลที่ไฮไลต์');
      return;
    }
    setSaving(true);
    try {
      if (profileDirty) {
        const updated = await users.updateProfile(user.id, toPatch(form));
        setUser(updated);
        const nb = fromUser(updated);
        setBase(nb);
        setForm(nb);
      }
      if (laborDirty) {
        const saved = await laborApi.save({ ...laborForm, user_id: user.id, is_want_job_inside: laborForm.is_want_job });
        const merged = { ...defaultLabor(user), ...saved };
        setLaborBase(merged);
        setLaborForm(merged);
        setHasLabor(true);
      }
      toast.success('บันทึกข้อมูลเรียบร้อย');
    } catch (err) {
      const msg = errorMessage(err);
      toast.error(/duplicate key|unique/i.test(msg) ? 'อีเมลนี้ถูกใช้โดยบัญชีอื่นแล้ว' : msg);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setForm(base);
    setLaborForm(laborBase);
    setErrors({});
  };

  const photo = documentUrl(user, 'id_photo_file_pathname');

  return (
    <div className="pb-24">
      {/* Identity header */}
      <Card className="mb-6 flex animate-fade-up flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={user.first_name_th} src={photo} size="xl" className="ring-4 ring-zinc-100" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold sm:text-2xl">{fullName(user)}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-zinc-500">
            <span className="tabular">{formatCitizenId(user.th_human_number)}</span>
            <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block" />
            <span>{user.email}</span>
            <Badge tone={user.role === 'user' ? 'neutral' : 'red'}>{ROLE_LABEL[user.role]}</Badge>
          </div>
        </div>
      </Card>

      <Tabs className="mb-6" value={tab} onChange={setTab} items={tabs} />

      <Card className="animate-fade-up p-5 sm:p-8" key={tab}>
        {tab === 'personal' && (
          <>
            <Section title="ชื่อ–นามสกุล" description="ใช้แสดงบนใบสมัครและใบประกาศนียบัตร ภาษาอังกฤษใช้สำหรับใบประกาศฉบับภาษาอังกฤษ">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[130px_1fr_1fr]">
                  <Field label="คำนำหน้า">
                    {(id) => (
                      <Select id={id} value={form.title_th} onChange={(e) => set({ title_th: e.target.value, title_en: TITLE_TH_TO_EN[e.target.value] || form.title_en })}>
                        {TITLES_TH.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="ชื่อ" required error={errors.first_name_th}>
                    {(id) => <Input id={id} value={form.first_name_th} invalid={!!errors.first_name_th} onChange={(e) => set({ first_name_th: e.target.value })} />}
                  </Field>
                  <Field label="นามสกุล" required error={errors.last_name_th}>
                    {(id) => <Input id={id} value={form.last_name_th} invalid={!!errors.last_name_th} onChange={(e) => set({ last_name_th: e.target.value })} />}
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-[130px_1fr_1fr]">
                  <Field label="Title">
                    {(id) => (
                      <Select id={id} value={form.title_en} onChange={(e) => set({ title_en: e.target.value })}>
                        {TITLES_EN.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="First name">{(id) => <Input id={id} value={form.first_name_en} onChange={(e) => set({ first_name_en: e.target.value })} />}</Field>
                  <Field label="Last name">{(id) => <Input id={id} value={form.last_name_en} onChange={(e) => set({ last_name_en: e.target.value })} />}</Field>
                </div>
              </div>
            </Section>

            <Section title="ข้อมูลบุคคล">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="เลขบัตรประชาชน" hint="แก้ไขไม่ได้ หากไม่ถูกต้องกรุณาติดต่อเจ้าหน้าที่">
                  {(id) => <Input id={id} value={formatCitizenId(user.th_human_number)} readOnly disabled className="tabular" />}
                </Field>
                <Field label="วันเกิด">{(id) => <Input id={id} type="date" value={form.birth_day} onChange={(e) => set({ birth_day: e.target.value })} />}</Field>
                <Field label="เพศ">
                  {(id) => (
                    <Select id={id} value={form.sex_name} onChange={(e) => set({ sex_name: e.target.value })}>
                      {SEXES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="สัญชาติ">{(id) => <Input id={id} value={form.nationality_name} onChange={(e) => set({ nationality_name: e.target.value })} />}</Field>
              </div>
            </Section>

            <Section title="การติดต่อ" description="อีเมลใช้เข้าสู่ระบบได้แทนเลขบัตรประชาชน">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="เบอร์โทรศัพท์" required error={errors.phone_number}>
                  {(id) => (
                    <Input id={id} type="tel" inputMode="numeric" value={form.phone_number} invalid={!!errors.phone_number} className="tabular" onChange={(e) => set({ phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                  )}
                </Field>
                <Field label="อีเมล" required error={errors.email}>
                  {(id) => <Input id={id} type="email" value={form.email} invalid={!!errors.email} onChange={(e) => set({ email: e.target.value })} />}
                </Field>
              </div>
            </Section>
          </>
        )}

        {tab === 'address' && (
          <Section title="ที่อยู่ตามทะเบียนบ้าน" description="ใช้กรอกในใบสมัครเข้ารับการฝึกอบรม/ทดสอบ">
            <AddressFields value={form} onChange={(p) => set(p)} />
          </Section>
        )}

        {tab === 'education' && (
          <>
            <Section title="วุฒิการศึกษา">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="วุฒิการศึกษาสูงสุด">
                  {(id) => (
                    <Select id={id} value={form.education_level} placeholder="เลือกวุฒิการศึกษา" onChange={(e) => set({ education_level: e.target.value })}>
                      {EDUCATION_LEVELS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="สาขาวิชา">{(id) => <Input id={id} value={form.branch_name} onChange={(e) => set({ branch_name: e.target.value })} />}</Field>
              </div>
            </Section>
            <Section title="สภาพร่างกาย" description="ข้อมูลนี้ช่วยให้เจ้าหน้าที่จัดสิ่งอำนวยความสะดวกในการสอบได้เหมาะสม">
              <div className="space-y-3">
                <Segmented
                  value={form.physical}
                  onChange={(v) => set({ physical: v, disabilities: v === 'ปกติ' ? [] : form.disabilities })}
                  options={[
                    { value: 'ปกติ', label: 'ปกติ' },
                    { value: 'พิการ', label: 'ผู้พิการ' },
                  ]}
                />
                {form.physical === 'พิการ' && (
                  <div className="grid animate-fade-in gap-2 sm:grid-cols-2">
                    {DISABILITY_TYPES.map((d) => (
                      <Checkbox
                        key={d}
                        label={`ความพิการ${d.startsWith('ทาง') ? '' : 'ทาง'}${d}`}
                        checked={form.disabilities.includes(d)}
                        onChange={(c) => set({ disabilities: c ? [...form.disabilities, d] : form.disabilities.filter((x) => x !== d) })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {tab === 'documents' && <DocumentsTab />}

        {tab === 'labor' && isCandidate && (
          laborLoad.loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : (
            <LaborForm value={laborForm} onChange={setL} />
          )
        )}
      </Card>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 animate-fade-up px-4 pb-4 lg:left-[264px]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-ink-950 dark:bg-ink-800 dark:ring-1 dark:ring-white/10 px-4 py-3 text-white shadow-pop sm:px-5">
            <span className="text-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400" />
              มีการแก้ไขที่ยังไม่บันทึก
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-zinc-300 hover:bg-white/10 hover:text-white" onClick={discard} disabled={saving}>
                ยกเลิก
              </Button>
              <Button size="sm" onClick={save} loading={saving}>
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------

function DocumentsTab() {
  const user = useUser();
  const { setUser } = useAuth();
  const [uploading, setUploading] = useState<DocumentField | null>(null);
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);
  const inputs = useRef<Partial<Record<DocumentField, HTMLInputElement | null>>>({});

  const upload = async (field: DocumentField, file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return toast.error('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (field === 'id_photo_file_pathname' ? !isImage : !isImage && !isPdf) {
      return toast.error(field === 'id_photo_file_pathname' ? 'รูปถ่ายต้องเป็นไฟล์รูปภาพ' : 'รองรับไฟล์รูปภาพหรือ PDF เท่านั้น');
    }
    setUploading(field);
    try {
      const updated = await users.uploadDocument(user.id, field, file);
      setUser(updated);
      toast.success('อัปโหลดเอกสารเรียบร้อย');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(null);
      const el = inputs.current[field];
      if (el) el.value = '';
    }
  };

  return (
    <Section title="เอกสารประกอบการสมัคร" description="ไฟล์รูปภาพหรือ PDF ขนาดไม่เกิน 5 MB ต่อไฟล์ รูปถ่ายจะใช้ในใบสมัครและเป็นรูปโปรไฟล์">
      <div className="grid gap-3 sm:grid-cols-3">
        {DOC_FIELDS.map(({ field, label }) => {
          const url = documentUrl(user, field);
          const busy = uploading === field;
          const isPhoto = field === 'id_photo_file_pathname';
          const isPdf = url?.toLowerCase().includes('.pdf');
          return (
            <div key={field} className={cn('flex flex-col overflow-hidden rounded-2xl border transition', url ? 'border-zinc-200' : 'border-dashed border-zinc-300')}>
              <button
                type="button"
                onClick={() => (url ? setPreview({ url, label }) : inputs.current[field]?.click())}
                className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-zinc-50 transition hover:bg-zinc-100"
              >
                {busy ? (
                  <LoaderCircle className="h-6 w-6 animate-spin text-brand-600" />
                ) : url && !isPdf ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={label} className="h-full w-full object-cover" />
                ) : url ? (
                  <FileText className="h-10 w-10 text-brand-600" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-zinc-400">
                    {isPhoto ? <ImageIcon className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
                    <span className="text-[0.8125rem]">คลิกเพื่ออัปโหลด</span>
                  </span>
                )}
                {url && !busy && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/40 hover:opacity-100">
                    <Eye className="h-5 w-5" />
                  </span>
                )}
              </button>
              <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-surface px-3.5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">{label}</div>
                  <div className={cn('text-[0.75rem]', url ? 'text-emerald-600' : 'text-amber-600')}>{url ? 'แนบแล้ว' : 'ยังไม่ได้แนบ'}</div>
                </div>
                <Button
                  size="sm"
                  variant={url ? 'outline' : 'dark'}
                  disabled={!!uploading}
                  onClick={() => inputs.current[field]?.click()}
                  icon={url ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                >
                  {url ? 'เปลี่ยน' : 'อัปโหลด'}
                </Button>
              </div>
              <input
                ref={(el) => {
                  inputs.current[field] = el;
                }}
                type="file"
                className="hidden"
                accept={isPhoto ? 'image/*' : 'image/*,application/pdf'}
                onChange={(e) => upload(field, e.target.files?.[0])}
              />
            </div>
          );
        })}
      </div>

      <Dialog open={!!preview} onClose={() => setPreview(null)} size="xl" title={preview?.label}>
        {preview && (
          <div className="flex min-h-[50vh] items-center justify-center rounded-xl bg-zinc-50 pb-2">
            {preview.url.toLowerCase().includes('.pdf') ? (
              <iframe src={preview.url} title={preview.label} className="h-[70vh] w-full rounded-xl border-0" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.label} className="max-h-[70vh] max-w-full rounded-xl object-contain" />
            )}
          </div>
        )}
      </Dialog>
    </Section>
  );
}

function LaborForm({ value: v, onChange }: { value: LaborHistory; onChange: (p: Partial<LaborHistory>) => void }) {
  const working = v.is_have_job === 'ทำงาน';
  const opt = (list: string[]) => list.map((o) => <option key={o}>{o}</option>);
  // keep previously-saved free values selectable even if not in the option list
  const withCurrent = (list: string[], cur?: string) => (cur && !list.includes(cur) ? [cur, ...list] : list);

  return (
    <>
      <Section title="สถานภาพการทำงาน" description="ข้อมูลนี้ใช้กรอกใบสมัครตามแบบฟอร์มของกรมพัฒนาฝีมือแรงงาน">
        <div className="space-y-4">
          <Segmented
            value={v.is_have_job}
            onChange={(x) => onChange({ is_have_job: x })}
            options={LABOR.haveJob.map((x) => ({ value: x, label: x }))}
          />
          {working ? (
            <div className="grid animate-fade-in gap-4 sm:grid-cols-2">
              <Field label="ประเภทงาน">
                {(id) => (
                  <Select id={id} value={v.labor_status} onChange={(e) => onChange({ labor_status: e.target.value })}>
                    {opt(withCurrent(LABOR.status, v.labor_status))}
                  </Select>
                )}
              </Field>
              <Field label="รายได้เฉลี่ยต่อเดือน">
                {(id) => (
                  <Select id={id} value={v.labor_salary} onChange={(e) => onChange({ labor_salary: e.target.value })}>
                    {opt(withCurrent(LABOR.salary, v.labor_salary))}
                  </Select>
                )}
              </Field>
              <Field label="อาชีพ">{(id) => <Input id={id} value={v.occupation} onChange={(e) => onChange({ occupation: e.target.value })} />}</Field>
              <Field label="ตำแหน่ง">{(id) => <Input id={id} value={v.position} onChange={(e) => onChange({ position: e.target.value })} />}</Field>
              <Field label="อายุงาน (ปี)">
                {(id) => <Input id={id} inputMode="numeric" value={v.year_of_service} onChange={(e) => onChange({ year_of_service: e.target.value })} />}
              </Field>
              <Field label="ชื่อหน่วยงาน / สถานที่ทำงาน">{(id) => <Input id={id} value={v.agency_name} onChange={(e) => onChange({ agency_name: e.target.value })} />}</Field>
              <Field label="โทรศัพท์ที่ทำงาน">
                {(id) => <Input id={id} type="tel" value={v.phone_number} onChange={(e) => onChange({ phone_number: e.target.value.replace(/[^\d-]/g, '').slice(0, 15) })} />}
              </Field>
              <Field label="กลุ่มอุตสาหกรรม">
                {(id) => (
                  <Select id={id} value={v.industrial_groups_working} onChange={(e) => onChange({ industrial_groups_working: e.target.value })}>
                    {opt(withCurrent(LABOR.industry, v.industrial_groups_working))}
                  </Select>
                )}
              </Field>
            </div>
          ) : (
            <div className="animate-fade-in sm:max-w-sm">
              <Field label="สถานะผู้ไม่มีงานทำ">
                {(id) => (
                  <Select id={id} value={v.not_have_job_status || ''} onChange={(e) => onChange({ not_have_job_status: e.target.value })}>
                    {opt(withCurrent(LABOR.notHaveJob, v.not_have_job_status))}
                  </Select>
                )}
              </Field>
            </div>
          )}
        </div>
      </Section>

      <Section title="แหล่งข่าวและความยินยอม">
        <div className="space-y-4">
          <Field label="ทราบข่าวการฝึกอบรมจาก">
            {(id) => (
              <Select id={id} value={v.known_source_of_training} onChange={(e) => onChange({ known_source_of_training: e.target.value })}>
                {opt(withCurrent(LABOR.source, v.known_source_of_training))}
              </Select>
            )}
          </Field>
          <div>
            <div className="mb-2 text-[0.8125rem] font-medium text-zinc-800">ยินยอมเปิดเผยข้อมูลส่วนบุคคลแก่หน่วยงานรัฐและเอกชน เพื่อการจัดหางาน</div>
            <Segmented value={v.is_accept_publish} onChange={(x) => onChange({ is_accept_publish: x })} options={LABOR.publish.map((x) => ({ value: x, label: x }))} />
          </div>
        </div>
      </Section>

      <Section title="ความประสงค์ให้จัดหางาน" description="กรมการจัดหางานจะติดต่อเมื่อผ่านการฝึกอบรม/ทดสอบ">
        <div className="space-y-4">
          <Field label="ความประสงค์">
            {(id) => (
              <Select id={id} value={v.is_want_job} onChange={(e) => onChange({ is_want_job: e.target.value })}>
                {opt(withCurrent(LABOR.wantJob, v.is_want_job))}
              </Select>
            )}
          </Field>
          {v.is_want_job.includes('ในประเทศ') && !v.is_want_job.includes('ต่าง') && (
            <Field label="ตำแหน่งงานที่ต้องการ" className="animate-fade-in">
              {(id) => <Input id={id} value={v.accept_job_position || ''} onChange={(e) => onChange({ accept_job_position: e.target.value })} />}
            </Field>
          )}
          {v.is_want_job.includes('ต่างประเทศ') && (
            <Field label="ประเทศที่ต้องการ" className="animate-fade-in">
              {(id) => <Input id={id} value={v.accept_job_in_country_name || ''} onChange={(e) => onChange({ accept_job_in_country_name: e.target.value })} />}
            </Field>
          )}
        </div>
      </Section>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileInner />
    </Suspense>
  );
}
