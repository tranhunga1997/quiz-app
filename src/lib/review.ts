import type { PrismaClient } from '@prisma/client';

export type ReviewCandidate = { questionId: string; wrongCount: number; lastWrongAt: Date };

type QuestionStats = { wrongCount: number; lastWrongAt: Date | null; latestAt: Date; latestIsCorrect: boolean };

export async function getReviewCandidates(prisma: PrismaClient, deckId: string): Promise<ReviewCandidate[]> {
  // Fetch every answer (not just wrong ones) so we can tell, per question, whether the most
  // recent answer was correct — a question only keeps needing review while its latest answer
  // (in any attempt, including a prior REVIEW attempt) is still wrong. wrongCount/lastWrongAt
  // still track the full wrong history, for ranking.
  const allAnswers = await prisma.attemptAnswer.findMany({
    where: { question: { deckId } },
    include: { attempt: true },
  });

  const byQuestion = new Map<string, QuestionStats>();
  for (const answer of allAnswers) {
    const answeredAt = answer.attempt.finishedAt ?? answer.attempt.startedAt;
    const existing = byQuestion.get(answer.questionId);

    if (!existing) {
      byQuestion.set(answer.questionId, {
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

  return Array.from(byQuestion.entries())
    .filter(([, stats]) => !stats.latestIsCorrect)
    .map(([questionId, stats]) => ({ questionId, wrongCount: stats.wrongCount, lastWrongAt: stats.lastWrongAt as Date }))
    .sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt.getTime() - a.lastWrongAt.getTime());
}
