import type { PrismaClient } from '@prisma/client';

export type QuestionHistoryEntry = { answeredAt: Date; isCorrect: boolean };

export type QuestionHistoryStats = {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  /** Chronological (oldest first) — lets the UI render a "correct/wrong over time" timeline. */
  entries: QuestionHistoryEntry[];
};

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
