import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getDeckWithQuestions } from '@/lib/decks';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DeckHeader } from './DeckHeader';
import { QuestionAccordion } from './QuestionAccordion';

export default async function DeckDetailPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckWithQuestions(prisma, params.deckId);
  if (!deck) notFound();

  const flaggedCount = deck.questions.filter((q) => q.flagged).length;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: deck.name }]} />
      <DeckHeader deckId={deck.id} name={deck.name} questionCount={deck.questions.length} />
      {flaggedCount > 0 && (
        <Link
          href={`/quiz/${deck.id}?mode=flagged`}
          className="mb-4 flex items-center justify-between rounded-card bg-warning-bg p-4 shadow-card transition hover:brightness-95 active:scale-[0.97]"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-warning-text">
            <Flag size={16} fill="currentColor" />
            {flaggedCount} câu đã đánh dấu
          </span>
          <span className="rounded-control bg-surface px-3 py-1.5 text-sm font-bold text-warning-text">Ôn ngay</span>
        </Link>
      )}
      <QuestionAccordion deckId={deck.id} initialQuestions={deck.questions} />
    </main>
  );
}
