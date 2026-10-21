'use client';

import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { ConfirmProvider } from '@/components/ui/dialog';

function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={resolved}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'var(--font-body)',
          borderRadius: '14px',
          fontSize: '14px',
        },
      }}
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          {children}
          <ThemedToaster />
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
