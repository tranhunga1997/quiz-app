import { notFound } from 'next/navigation';
import { getDeckWithQuestions } from '@/lib/decks';
import { DeckHeader } from './DeckHeader';
import { QuestionAccordion } from './QuestionAccordion';

export default async function DeckDetailPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckWithQuestions(params.deckId);
  if (!deck) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <DeckHeader deckId={deck.id} name={deck.name} questionCount={deck.questions.length} />
      <QuestionAccordion deckId={deck.id} initialQuestions={deck.questions} />
    </main>
  );
}
