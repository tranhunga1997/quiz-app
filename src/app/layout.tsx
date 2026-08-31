import type { Metadata } from 'next';
import Link from 'next/link';
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
      <body className="min-h-screen bg-bg font-sans text-ink">
        <header className="sticky top-0 z-10 border-b border-bg bg-white/90 px-6 py-3 backdrop-blur">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
            📚 Quiz App
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
