'use client';

import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#0b1c30',
          border: '1px solid #e6bdb8',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          fontFamily: "'IBM Plex Sans Thai', sans-serif",
        },
        className: 'tmrda-toast',
      }}
      richColors
      closeButton
    />
  );
}
