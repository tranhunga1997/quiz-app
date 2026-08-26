import type { PrismaClient } from '@prisma/client';

export type ReviewCandidate = { questionId: string; wrongCount: number; lastWrongAt: Date };

export async function getReviewCandidates(prisma: PrismaClient, deckId: string): Promise<ReviewCandidate[]> {
  const wrongAnswers = await prisma.attemptAnswer.findMany({
    where: { isCorrect: false, question: { deckId } },
    include: { attempt: true },
  });

  const byQuestion = new Map<string, { wrongCount: number; lastWrongAt: Date }>();
  for (const answer of wrongAnswers) {
    const finishedAt = answer.attempt.finishedAt ?? answer.attempt.startedAt;
    const existing = byQuestion.get(answer.questionId);
    if (!existing) {
      byQuestion.set(answer.questionId, { wrongCount: 1, lastWrongAt: finishedAt });
    } else {
      existing.wrongCount += 1;
      if (finishedAt > existing.lastWrongAt) existing.lastWrongAt = finishedAt;
    }
  }

  return Array.from(byQuestion.entries())
    .map(([questionId, stats]) => ({ questionId, ...stats }))
    .sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt.getTime() - a.lastWrongAt.getTime());
}
