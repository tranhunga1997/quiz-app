import { notFound } from 'next/navigation';
import { getDeckWithQuestions } from '@/lib/decks';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DeckHeader } from './DeckHeader';
import { QuestionAccordion } from './QuestionAccordion';

export default async function DeckDetailPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckWithQuestions(params.deckId);
  if (!deck) notFound();

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: deck.name }]} />
      <DeckHeader deckId={deck.id} name={deck.name} questionCount={deck.questions.length} />
      <QuestionAccordion deckId={deck.id} initialQuestions={deck.questions} />
    </main>
  );
}
