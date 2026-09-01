import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getDeckWithQuestions } from '@/lib/decks';
import { PrintButton } from './PrintButton';

export default async function DeckPrintPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckWithQuestions(prisma, params.deckId);
  if (!deck) notFound();

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl p-6 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/decks/${deck.id}`}
          className="flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft size={16} />
          Quay lại bộ đề
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-ink-soft/20 pb-4 print:mb-4 print:border-black/20 print:pb-2">
        <h1 className="text-2xl font-bold text-ink">{deck.name}</h1>
        <p className="text-sm text-ink-muted">Tài liệu ôn tập · {deck.questions.length} câu hỏi</p>
      </header>

      {deck.questions.length === 0 ? (
        <p className="text-ink-muted">Bộ đề chưa có câu hỏi nào.</p>
      ) : (
        <ol className="space-y-6 print:space-y-4">
          {deck.questions.map((q, i) => (
            <li key={q.id} className="break-inside-avoid">
              <p className="mb-2 font-semibold text-ink">
                {i + 1}. {q.text}
              </p>
              <ul className="ml-4 space-y-1">
                {q.options.map((opt, oi) => (
                  <li
                    key={opt.id}
                    className={`text-sm ${opt.isCorrect ? 'font-semibold text-success-text' : 'text-ink'}`}
                  >
                    {String.fromCharCode(65 + oi)}. {opt.text}
                    {opt.isCorrect && ' ✓'}
                  </li>
                ))}
              </ul>
              {q.explanation && (
                <p className="ml-4 mt-1.5 text-xs italic text-ink-muted">Giải thích: {q.explanation}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
