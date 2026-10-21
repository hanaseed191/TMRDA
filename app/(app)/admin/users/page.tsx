'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, FileText, Pencil, UserPlus, Users } from 'lucide-react';
import { documentUrl, users } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useLoad } from '@/lib/hooks';
import {
  errorMessage,
  formatCitizenId,
  formatPhone,
  fullName,
  fullNameEn,
  isValidCitizenId,
  ROLE_LABEL,
  thaiDate,
} from '@/lib/format';
import { TITLES_TH } from '@/lib/constants';
import type { DocumentField, Role, User } from '@/lib/types';
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  DescriptionList,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  SkeletonRows,
  Switch,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { RoleBadge } from '@/components/status';

type RoleFilter = 'all' | Role;
const ROLES: Role[] = ['admin', 'director', 'evaluator', 'user'];

const emptyForm = {
  title_th: 'นาย',
  first_name_th: '',
  last_name_th: '',
  th_human_number: '',
  email: '',
  phone_number: '',
  position_title: '',
  role: 'evaluator' as Role,
  is_allowed: true,
  password: '',
};

export default function AdminUsersPage() {
  const me = useUser();
  const { data, loading, error, reload } = useLoad(() => users.list(), []);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [viewing, setViewing] = useState<User | null>(null);

  const list = useMemo(() => data || [], [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const r of ROLES) c[r] = list.filter((u) => u.role === r).length;
    return c;
  }, [list]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((u) => role === 'all' || u.role === role)
      .filter((u) => !q || `${fullName(u)} ${u.th_human_number} ${u.email} ${u.phone_number}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  }, [list, query, role]);

  return (
    <>
      <PageHeader
        eyebrow="ระบบ"
        title="สมาชิกและสิทธิ์"
        description="จัดการบัญชีผู้สมัคร เจ้าหน้าที่ ผู้ประเมิน และผู้อำนวยการ กำหนดสิทธิ์ ระงับการใช้งาน หรือรีเซ็ตรหัสผ่าน"
        actions={
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setEditing('new')}>
            เพิ่มเจ้าหน้าที่
          </Button>
        }
      />

      {error && <Callout tone="red" className="mb-6">{error}</Callout>}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<RoleFilter>
            size="sm"
            value={role}
            onChange={setRole}
            options={[
              { value: 'all', label: `ทั้งหมด ${counts.all}` },
              { value: 'user', label: `ผู้สมัคร ${counts.user}` },
              { value: 'evaluator', label: `ผู้ประเมิน ${counts.evaluator}` },
              { value: 'director', label: `ผู้อำนวยการ ${counts.director}` },
              { value: 'admin', label: `เจ้าหน้าที่ ${counts.admin}` },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาชื่อ เลขบัตร อีเมล หรือโทรศัพท์" className="lg:w-80" />
        </div>
        {loading ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" />} title={list.length === 0 ? 'ยังไม่มีสมาชิก' : 'ไม่พบสมาชิกตามเงื่อนไข'} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>ชื่อ-นามสกุล</TH>
                <TH>เลขบัตรประชาชน</TH>
                <TH>ติดต่อ</TH>
                <TH>สิทธิ์</TH>
                <TH>สถานะ</TH>
                <TH>สมัครเมื่อ</TH>
                <TH className="text-right" />
              </tr>
            </THead>
            <tbody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <button className="flex items-center gap-3 text-left" onClick={() => setViewing(u)}>
                      <Avatar name={u.first_name_th} src={documentUrl(u, 'id_photo_file_pathname')} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-zinc-900 hover:underline">
                          {fullName(u)} {u.id === me.id && <span className="text-xs font-normal text-zinc-400">(คุณ)</span>}
                        </div>
                        {u.position_title && <div className="truncate text-xs text-zinc-500">{u.position_title}</div>}
                      </div>
                    </button>
                  </TD>
                  <TD className="whitespace-nowrap tabular text-zinc-600">{formatCitizenId(u.th_human_number)}</TD>
                  <TD>
                    <div className="max-w-[220px] truncate text-zinc-700">{u.email}</div>
                    <div className="text-xs tabular text-zinc-500">{formatPhone(u.phone_number)}</div>
                  </TD>
                  <TD>
                    <RoleBadge role={u.role} />
                  </TD>
                  <TD>
                    {u.is_allowed === 0 ? (
                      <Badge tone="red" dot>ระงับ</Badge>
                    ) : (
                      <Badge tone="green" dot>ใช้งาน</Badge>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-zinc-500">{thaiDate(u.created_at)}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => setViewing(u)} aria-label="ดูรายละเอียด">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing(u)} aria-label="แก้ไขสิทธิ์">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <UserDialog
        target={editing}
        me={me}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      <UserDrawer user={viewing} onClose={() => setViewing(null)} onEdit={(u) => { setViewing(null); setEditing(u); }} />
    </>
  );
}

// ---------------------------------------------------------------------

function UserDialog({ target, me, onClose, onSaved }: { target: User | 'new' | null; me: User; onClose: () => void; onSaved: () => void }) {
  const isNew = target === 'new';
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastTarget, setLastTarget] = useState<User | 'new' | null>(null);

  if (target !== lastTarget) {
    setLastTarget(target);
    setErrors({});
    if (target === 'new') setForm(emptyForm);
    else if (target)
      setForm({
        title_th: target.title_th || 'นาย',
        first_name_th: target.first_name_th,
        last_name_th: target.last_name_th,
        th_human_number: target.th_human_number,
        email: target.email,
        phone_number: target.phone_number,
        position_title: target.position_title || '',
        role: target.role,
        is_allowed: target.is_allowed !== 0,
        password: '',
      });
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const isSelf = target !== 'new' && target?.id === me.id;

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.first_name_th.trim()) e.first_name_th = 'กรุณากรอกชื่อ';
    if (!form.last_name_th.trim()) e.last_name_th = 'กรุณากรอกนามสกุล';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'อีเมลไม่ถูกต้อง';
    if (isNew) {
      if (!isValidCitizenId(form.th_human_number)) e.th_human_number = 'เลขบัตรประชาชนไม่ถูกต้อง';
      if (form.password.length < 8) e.password = 'อย่างน้อย 8 ตัวอักษร';
    } else if (form.password && form.password.length < 8) e.password = 'อย่างน้อย 8 ตัวอักษร';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const payload = {
        title_th: form.title_th,
        first_name_th: form.first_name_th.trim(),
        last_name_th: form.last_name_th.trim(),
        th_human_number: form.th_human_number.replace(/\D/g, ''),
        email: form.email.trim(),
        phone_number: form.phone_number.replace(/\D/g, '') || '-',
        position_title: form.position_title.trim(),
        role: form.role,
        is_allowed: form.is_allowed ? 1 : 0,
      };
      const saved = await users.adminSave(isNew ? null : (target as User).id, payload, form.password || undefined);
      toast.success(isNew ? `เพิ่มบัญชี ${fullName(saved)} แล้ว` : 'บันทึกการเปลี่ยนแปลงแล้ว');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!target}
      onClose={onClose}
      size="lg"
      title={isNew ? 'เพิ่มเจ้าหน้าที่ / ผู้ประเมิน' : 'แก้ไขบัญชีและสิทธิ์'}
      description={isNew ? 'บัญชีที่สร้างที่นี่เข้าสู่ระบบได้ทันทีด้วยเลขบัตรประชาชนหรืออีเมล และรหัสผ่านที่กำหนด' : target ? fullName(target) : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="dark" loading={saving} onClick={save}>
            {isNew ? 'สร้างบัญชี' : 'บันทึก'}
          </Button>
        </>
      }
    >
      <div className="space-y-5 pb-1">
        <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
          <Field label="คำนำหน้า">
            {(id) => (
              <Select id={id} value={form.title_th} onChange={(e) => set('title_th', e.target.value)}>
                {TITLES_TH.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="ชื่อ" required error={errors.first_name_th}>
            {(id) => <Input id={id} value={form.first_name_th} invalid={!!errors.first_name_th} onChange={(e) => set('first_name_th', e.target.value)} />}
          </Field>
          <Field label="นามสกุล" required error={errors.last_name_th}>
            {(id) => <Input id={id} value={form.last_name_th} invalid={!!errors.last_name_th} onChange={(e) => set('last_name_th', e.target.value)} />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="เลขบัตรประชาชน" required={isNew} error={errors.th_human_number} hint={!isNew ? 'แก้ไขเลขบัตรไม่ได้' : undefined}>
            {(id) => (
              <Input
                id={id}
                inputMode="numeric"
                maxLength={13}
                value={form.th_human_number}
                disabled={!isNew}
                invalid={!!errors.th_human_number}
                onChange={(e) => set('th_human_number', e.target.value.replace(/\D/g, ''))}
                className="tabular"
              />
            )}
          </Field>
          <Field label="อีเมล" required error={errors.email}>
            {(id) => <Input id={id} type="email" value={form.email} invalid={!!errors.email} onChange={(e) => set('email', e.target.value)} />}
          </Field>
          <Field label="โทรศัพท์">
            {(id) => <Input id={id} inputMode="tel" value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} />}
          </Field>
          <Field label="ตำแหน่ง" hint="แสดงในใบประกาศ (สำหรับผู้อำนวยการ)">
            {(id) => <Input id={id} value={form.position_title} onChange={(e) => set('position_title', e.target.value)} placeholder="เช่น ผู้อำนวยการสถาบัน" />}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="สิทธิ์การใช้งาน" required hint={isSelf ? 'ไม่สามารถลดสิทธิ์ของตัวเองได้' : undefined}>
            {(id) => (
              <Select id={id} value={form.role} disabled={isSelf} onChange={(e) => set('role', e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={isNew ? 'รหัสผ่านเริ่มต้น' : 'รีเซ็ตรหัสผ่าน'} required={isNew} error={errors.password} hint={!isNew ? 'เว้นว่างไว้หากไม่ต้องการเปลี่ยน' : 'อย่างน้อย 8 ตัวอักษร'}>
            {(id) => (
              <Input id={id} type="password" autoComplete="new-password" value={form.password} invalid={!!errors.password} onChange={(e) => set('password', e.target.value)} />
            )}
          </Field>
        </div>

        {!isNew && (
          <div className="rounded-xl border border-zinc-200 p-4">
            <Switch
              checked={form.is_allowed}
              disabled={isSelf}
              onChange={(v) => set('is_allowed', v)}
              label="อนุญาตให้เข้าสู่ระบบ"
              description="ปิดเพื่อระงับบัญชี ผู้ใช้จะถูกออกจากระบบทุกอุปกรณ์ทันที"
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------

const DOCS: { field: DocumentField; label: string }[] = [
  { field: 'id_photo_file_pathname', label: 'รูปถ่าย' },
  { field: 'identification_file_pathname', label: 'สำเนาบัตรประชาชน' },
  { field: 'eq_file_pathname', label: 'สำเนาวุฒิการศึกษา' },
];

function UserDrawer({ user, onClose, onEdit }: { user: User | null; onClose: () => void; onEdit: (u: User) => void }) {
  const address = user
    ? [
        user.house_number && user.house_number !== '-' ? `เลขที่ ${user.house_number}` : '',
        user.house_group ? `หมู่ ${user.house_group}` : '',
        user.alley_name ? `ซ.${user.alley_name}` : '',
        user.road_name ? `ถ.${user.road_name}` : '',
        user.subdistrict_name,
        user.district_name,
        user.province_name,
        user.zip_code,
      ]
        .filter(Boolean)
        .join(' ')
    : '';
  return (
    <Drawer
      open={!!user}
      onClose={onClose}
      title="ข้อมูลสมาชิก"
      footer={
        user && (
          <Button variant="dark" icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(user)}>
            แก้ไขสิทธิ์
          </Button>
        )
      }
    >
      {user && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.first_name_th} src={documentUrl(user, 'id_photo_file_pathname')} size="lg" />
            <div className="min-w-0">
              <div className="text-lg font-semibold text-zinc-950">{fullName(user)}</div>
              {fullNameEn(user) && <div className="text-sm text-zinc-500">{fullNameEn(user)}</div>}
              <div className="mt-1.5">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <DescriptionList
            items={[
              { label: 'เลขบัตรประชาชน', value: <span className="tabular">{formatCitizenId(user.th_human_number)}</span> },
              { label: 'อีเมล', value: user.email },
              { label: 'โทรศัพท์', value: formatPhone(user.phone_number) },
              { label: 'วันเกิด', value: thaiDate(user.birth_day) },
              { label: 'เพศ / สัญชาติ', value: `${user.sex_name || '—'} / ${user.nationality_name || '—'}` },
              { label: 'การศึกษา', value: [user.education_level, user.branch_name].filter(Boolean).join(' · ') || '—' },
              { label: 'ที่อยู่', value: address || '—' },
              ...(user.position_title ? [{ label: 'ตำแหน่ง', value: user.position_title }] : []),
            ]}
          />
          <div>
            <h3 className="mb-2 text-sm font-semibold">เอกสารแนบ</h3>
            <div className="grid gap-2">
              {DOCS.map((d) => {
                const url = documentUrl(user, d.field);
                return (
                  <div key={d.field} className="flex items-center justify-between rounded-xl border border-zinc-200 px-3.5 py-2.5">
                    <span className="flex items-center gap-2.5 text-sm text-zinc-800">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      {d.label}
                    </span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
                        เปิดดู
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-400">ยังไม่แนบ</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
