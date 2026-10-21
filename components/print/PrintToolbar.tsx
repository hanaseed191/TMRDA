'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui';
import { Brand } from '@/components/Brand';

export default function PrintToolbar({ title, hint, disabled }: { title: string; hint?: string; disabled?: boolean }) {
  const router = useRouter();
  return (
    <div className="no-print sticky top-0 z-20 border-b border-zinc-200 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          aria-label="ย้อนกลับ"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="hidden sm:block">
          <Brand subtitle={false} />
        </div>
        <div className="min-w-0 flex-1 sm:border-l sm:border-zinc-200 sm:pl-4">
          <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
          {hint && <div className="truncate text-xs text-zinc-500">{hint}</div>}
        </div>
        <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()} disabled={disabled}>
          พิมพ์ / บันทึก PDF
        </Button>
      </div>
    </div>
  );
}

export function PrintMessage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-zinc-200 bg-surface p-8 text-center shadow-card">
      <h1 className="text-lg font-semibold">{title}</h1>
      {description && <p className="mt-2 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
