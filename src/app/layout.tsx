import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Personal quiz & flashcard app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
