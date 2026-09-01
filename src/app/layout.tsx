import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Personal quiz & flashcard app',
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Bỏ qua điều hướng
        </a>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-bg bg-surface/90 px-6 py-3 backdrop-blur print:hidden">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            <BookOpen size={20} className="text-accent" />
            Quiz App
          </Link>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
