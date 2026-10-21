'use client';

import { RequireAuth } from '@/lib/auth';

/** Candidate-only area: staff are redirected to their own home page. */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth roles={['user']}>{children}</RequireAuth>;
}
