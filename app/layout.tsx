import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: 'TMRDA - ระบบบริหารจัดการการฝึกอบรม (Training Management System)',
  description: 'ระบบลงทะเบียน อัปเดตประวัติแรงงาน และบริหารจัดการหลักสูตรการฝึกอบรม TMRDA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" data-theme="tmrda">
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
