import { prisma } from './db';
import { getReviewCandidates } from './review';

export type DeckListItem = {
  id: string;
  name: string;
  questionCount: number;
  reviewDueCount: number;
};

export type QuestionWithOptions = {
  id: string;
  text: string;
  type: 'SINGLE' | 'MULTI';
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
};

export type DeckWithQuestions = {
  id: string;
  name: string;
  questions: QuestionWithOptions[];
};

export async function listDecksWithStats(): Promise<DeckListItem[]> {
  const decks = await prisma.deck.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  });

  return Promise.all(
    decks.map(async (deck) => {
      const reviewCandidates = await getReviewCandidates(prisma, deck.id);
      return {
        id: deck.id,
        name: deck.name,
        questionCount: deck._count.questions,
        reviewDueCount: reviewCandidates.length,
      };
    })
  );
}

export async function getDeckWithQuestions(deckId: string): Promise<DeckWithQuestions | null> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { questions: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { createdAt: 'asc' } } },
  });
  if (!deck) return null;

  return {
    id: deck.id,
    name: deck.name,
    questions: deck.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type as 'SINGLE' | 'MULTI',
      explanation: q.explanation,
      options: q.options,
    })),
  };
}
