'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader, homeFor, useAuth } from '@/lib/auth';

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(user ? homeFor(user.role) : '/login');
  }, [ready, user, router]);
  return <FullPageLoader />;
}
