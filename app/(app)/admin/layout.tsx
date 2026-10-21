'use client';

import { RequireAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['admin']}>{children}</RequireAuth>;
}
