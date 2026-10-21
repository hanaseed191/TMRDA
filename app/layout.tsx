import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Thai, Prompt } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { themeInitScript } from '@/lib/theme-script';

const display = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TMRDA — ระบบบริหารการฝึกอบรมและทดสอบมาตรฐานฝีมือแรงงาน',
    template: '%s · TMRDA',
  },
  description:
    'สมัครสมาชิก สมัครหลักสูตร สอบภาคทฤษฎีออนไลน์ ประเมินภาคปฏิบัติโดยผู้ประเมิน 3 ท่าน อนุมัติผลโดยผู้อำนวยการ และพิมพ์ใบประกาศนียบัตร',
  icons: { icon: '/logo.jpeg' },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
