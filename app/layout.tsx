import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BracketUp – Run better tournaments',
  description: 'Create and manage tournaments with ease. Round robin seeding, elimination brackets, live standings, and prize payouts.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BracketUp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#030712',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-gray-950 antialiased`}>
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
