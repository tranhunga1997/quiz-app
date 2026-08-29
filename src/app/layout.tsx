import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Personal quiz & flashcard app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
