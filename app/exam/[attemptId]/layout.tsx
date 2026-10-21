'use client';

import { RequireAuth } from '@/lib/auth';

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['user']}>{children}</RequireAuth>;
}
