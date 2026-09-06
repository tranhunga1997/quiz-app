import type { PrismaClient } from '@prisma/client';
import { getReviewDueCountsByDeck } from './review';
import type { QuestionType } from './questionType';

export type DeckListItem = {
  id: string;
  name: string;
  questionCount: number;
  reviewDueCount: number;
};

export type QuestionWithOptions = {
  id: string;
  text: string;
  type: QuestionType;
  explanation: string | null;
  flagged: boolean;
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
};

export type DeckWithQuestions = {
  id: string;
  name: string;
  questions: QuestionWithOptions[];
};

/** One query for every deck passed in (via getReviewDueCountsByDeck), not one query
 * per deck — this used to call getReviewCandidates once per deck, an N+1 that scaled
 * with the whole deck library on every home-page load (listDecksDue scans all decks
 * unconditionally). */
async function attachStats(
  client: PrismaClient,
  decks: { id: string; name: string; _count: { questions: number } }[]
): Promise<DeckListItem[]> {
  const dueCounts = await getReviewDueCountsByDeck(
    client,
    decks.map((d) => d.id)
  );
  return decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    questionCount: deck._count.questions,
    reviewDueCount: dueCounts.get(deck.id) ?? 0,
  }));
}

/** Every deck with at least one question currently due for review — unpaginated,
 * unfiltered by design: the "🔥 Ôn câu hay sai" banner must reflect the whole
 * library regardless of what page/search the main deck grid is showing. */
export async function listDecksDue(client: PrismaClient): Promise<DeckListItem[]> {
  const decks = await client.deck.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } },
  });
  const withStats = await attachStats(client, decks);
  return withStats.filter((d) => d.reviewDueCount > 0);
}

export async function listDecksWithStats(
  client: PrismaClient,
  options?: { query?: string; page?: number; pageSize?: number }
): Promise<{ decks: DeckListItem[]; totalCount: number }> {
  const { query, page = 1, pageSize = 5 } = options ?? {};
  const trimmedQuery = query?.trim();
  const where = trimmedQuery ? { name: { contains: trimmedQuery } } : undefined;

  const [decks, totalCount] = await Promise.all([
    client.deck.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    client.deck.count({ where }),
  ]);

  const decksWithStats = await attachStats(client, decks);
  return { decks: decksWithStats, totalCount };
}

/** Top few deck-name matches for the search box's autocomplete dropdown — a
 * lighter query than listDecksWithStats, no per-deck review-stats computation. */
export async function searchDeckNamesCore(client: PrismaClient, query: string): Promise<{ id: string; name: string }[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return client.deck.findMany({
    where: { name: { contains: trimmed } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 6,
  });
}

export async function getDeckWithQuestions(client: PrismaClient, deckId: string): Promise<DeckWithQuestions | null> {
  const deck = await client.deck.findUnique({
    where: { id: deckId },
    include: { questions: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
  });
  if (!deck) return null;

  return {
    id: deck.id,
    name: deck.name,
    questions: deck.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type as QuestionType,
      explanation: q.explanation,
      flagged: q.flagged,
      options: q.options,
    })),
  };
}
