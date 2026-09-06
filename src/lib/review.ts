import type { PrismaClient } from '@prisma/client';

export type ReviewCandidate = { questionId: string; wrongCount: number; lastWrongAt: Date };

type QuestionStats = {
  deckId: string;
  wrongCount: number;
  lastWrongAt: Date | null;
  latestAt: Date;
  latestIsCorrect: boolean;
};

/** Shared aggregation behind getReviewCandidates/getReviewDueCountsByDeck: for every
 * question matched by `deckWhere` (a single deck, a known set of decks, or every deck
 * when omitted), compute its wrongCount/lastWrongAt across all history and whether its
 * MOST RECENT answer (in any attempt, including a prior REVIEW/FLAGGED attempt) was
 * correct — a question only still "needs review" while that latest answer is wrong.
 *
 * Answers from attempts that were never finished (browser closed mid-quiz) are
 * deliberately still counted: an answer was genuinely submitted regardless of whether
 * the session was ever completed, and review eligibility is a per-answer, not
 * per-session, concept. (This is why lib/deckHistory.ts — which lists completed
 * *sessions* — filters on `finishedAt: { not: null }`, while this aggregation does not;
 * see tests/unit/review.test.ts's "counts an answer from an attempt that was never
 * finished" case for the locked-in behavior.)
 *
 * Runs as a single query regardless of how many decks are matched — this used to be
 * called once per deck from lib/decks.ts's attachStats, an N+1 that scaled with the
 * whole library on every home-page load. */
async function fetchQuestionStats(
  client: PrismaClient,
  deckWhere?: { deckId: string } | { deckId: { in: string[] } }
): Promise<Map<string, QuestionStats>> {
  const allAnswers = await client.attemptAnswer.findMany({
    where: deckWhere ? { question: deckWhere } : undefined,
    include: { attempt: true, question: { select: { deckId: true } } },
  });

  const byQuestion = new Map<string, QuestionStats>();
  for (const answer of allAnswers) {
    const answeredAt = answer.attempt.finishedAt ?? answer.attempt.startedAt;
    const existing = byQuestion.get(answer.questionId);

    if (!existing) {
      byQuestion.set(answer.questionId, {
        deckId: answer.question.deckId,
        wrongCount: answer.isCorrect ? 0 : 1,
        lastWrongAt: answer.isCorrect ? null : answeredAt,
        latestAt: answeredAt,
        latestIsCorrect: answer.isCorrect,
      });
      continue;
    }

    if (!answer.isCorrect) {
      existing.wrongCount += 1;
      if (!existing.lastWrongAt || answeredAt > existing.lastWrongAt) existing.lastWrongAt = answeredAt;
    }
    if (answeredAt > existing.latestAt) {
      existing.latestAt = answeredAt;
      existing.latestIsCorrect = answer.isCorrect;
    }
  }

  return byQuestion;
}

export async function getReviewCandidates(client: PrismaClient, deckId: string): Promise<ReviewCandidate[]> {
  const byQuestion = await fetchQuestionStats(client, { deckId });

  return Array.from(byQuestion.entries())
    .filter(([, stats]) => !stats.latestIsCorrect)
    .map(([questionId, stats]) => ({ questionId, wrongCount: stats.wrongCount, lastWrongAt: stats.lastWrongAt as Date }))
    .sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt.getTime() - a.lastWrongAt.getTime());
}

/** Per-deck count of questions currently due for review, computed in one query across
 * every matched deck. Pass `deckIds` to scope to a known subset (e.g. the current
 * paginated page); omit it to scan every deck (needed for the home page's "any deck
 * due" banner, which must reflect the whole library regardless of pagination/search). */
export async function getReviewDueCountsByDeck(client: PrismaClient, deckIds?: string[]): Promise<Map<string, number>> {
  const byQuestion = await fetchQuestionStats(client, deckIds ? { deckId: { in: deckIds } } : undefined);

  const counts = new Map<string, number>();
  for (const stats of byQuestion.values()) {
    if (!stats.latestIsCorrect) counts.set(stats.deckId, (counts.get(stats.deckId) ?? 0) + 1);
  }
  return counts;
}
