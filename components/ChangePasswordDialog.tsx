'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { auth } from '@/lib/api';
import { errorMessage } from '@/lib/format';
import { Button, Dialog, Field, Input } from '@/components/ui';

export default function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== newPw;

  const reset = () => {
    setOldPw('');
    setNewPw('');
    setConfirm('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
    if (mismatch) return toast.error('ยืนยันรหัสผ่านไม่ตรงกัน');
    setSaving(true);
    try {
      await auth.changePassword(oldPw, newPw);
      toast.success('เปลี่ยนรหัสผ่านเรียบร้อย อุปกรณ์อื่นจะถูกออกจากระบบ');
      reset();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="sm"
      title="เปลี่ยนรหัสผ่าน"
      description="ใช้อย่างน้อย 8 ตัวอักษร ผสมตัวเลขและตัวอักษรเพื่อความปลอดภัย"
    >
      <form id="change-pw" onSubmit={submit} className="space-y-4 pb-2">
        <Field label="รหัสผ่านปัจจุบัน" required>
          {(id) => <Input id={id} type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />}
        </Field>
        <Field label="รหัสผ่านใหม่" required>
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />}
        </Field>
        <Field label="ยืนยันรหัสผ่านใหม่" required error={mismatch ? 'รหัสผ่านไม่ตรงกัน' : null}>
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={confirm} invalid={mismatch} onChange={(e) => setConfirm(e.target.value)} required />}
        </Field>
        <Button type="submit" variant="dark" className="w-full" loading={saving}>
          บันทึกรหัสผ่านใหม่
        </Button>
      </form>
    </Dialog>
  );
}
