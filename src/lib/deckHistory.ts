import type { PrismaClient } from '@prisma/client';
import { calculateScorePercent } from './scoring';

export type DeckAttemptSummary = {
  id: string;
  mode: 'NORMAL' | 'REVIEW' | 'FLAGGED';
  startedAt: Date;
  finishedAt: Date;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
};

/** Every completed attempt for a deck, oldest first — the chronological order a
 * "progress over time" comparison page needs. In-progress (never-finished)
 * attempts are excluded: they have no final score to compare. */
export async function getDeckAttemptHistory(client: PrismaClient, deckId: string): Promise<DeckAttemptSummary[]> {
  const attempts = await client.attempt.findMany({
    where: { deckId, finishedAt: { not: null } },
    orderBy: { finishedAt: 'asc' },
  });

  return attempts.map((attempt) => ({
    id: attempt.id,
    mode: attempt.mode as 'NORMAL' | 'REVIEW' | 'FLAGGED',
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt as Date,
    correctCount: attempt.correctCount,
    totalQuestions: attempt.totalQuestions,
    scorePercent: calculateScorePercent(attempt.correctCount, attempt.totalQuestions),
  }));
}
