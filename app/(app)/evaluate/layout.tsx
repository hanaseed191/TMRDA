'use client';

import { RequireAuth } from '@/lib/auth';

export default function EvaluateLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['evaluator', 'admin', 'director']}>{children}</RequireAuth>;
}
