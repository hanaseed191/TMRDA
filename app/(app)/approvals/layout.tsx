'use client';

import { RequireAuth } from '@/lib/auth';

export default function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['director']}>{children}</RequireAuth>;
}
