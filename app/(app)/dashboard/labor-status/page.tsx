'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/lib/auth';

/** Legacy URL — labor history now lives in the profile page. */
export default function LaborStatusRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile?tab=labor');
  }, [router]);
  return <FullPageLoader />;
}
