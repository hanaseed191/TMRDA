'use client';

import { RequireAuth } from '@/lib/auth';

/** Printable documents are always rendered in the light theme (`light-scope`). */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="light-scope min-h-dvh bg-zinc-200/70 text-zinc-900 print:bg-white">{children}</div>
    </RequireAuth>
  );
}
