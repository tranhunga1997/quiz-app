import type { PrismaClient } from '@prisma/client';

type QuestionHistoryEntry = { answeredAt: Date; isCorrect: boolean };

export type QuestionHistoryStats = {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  /** Chronological (oldest first) — lets the UI render a "correct/wrong over time" timeline. */
  entries: QuestionHistoryEntry[];
};

/** Answers from attempts that were never finished (browser closed mid-quiz) are
 * deliberately still counted here — an answer was genuinely submitted regardless of
 * whether the session was ever completed, and per-question history is a per-answer,
 * not per-session, concept. (This is why lib/deckHistory.ts — which lists completed
 * *sessions* — filters on finishedAt: { not: null }, while this does not; mirrors the
 * same deliberate choice in lib/review.ts's fetchQuestionStats.) */
export async function getQuestionHistoryStats(client: PrismaClient, questionId: string): Promise<QuestionHistoryStats> {
  const answers = await client.attemptAnswer.findMany({
    where: { questionId },
    include: { attempt: true },
  });

  const entries: QuestionHistoryEntry[] = answers
    .map((answer) => ({
      answeredAt: answer.attempt.finishedAt ?? answer.attempt.startedAt,
      isCorrect: answer.isCorrect,
    }))
    .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());

  const correctCount = entries.filter((e) => e.isCorrect).length;

  return {
    totalAttempts: entries.length,
    correctCount,
    wrongCount: entries.length - correctCount,
    entries,
  };
}
