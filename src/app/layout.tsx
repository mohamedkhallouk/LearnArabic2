import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/providers';
import BottomNav from '@/components/nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learn Arabic',
  description: 'Learn 5000+ common Arabic words with spaced repetition',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <main className="max-w-lg mx-auto pb-20 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
