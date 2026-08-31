'use server';

import type { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../lib/db';
import { shuffleArray } from '../lib/shuffle';
import { isAnswerCorrect } from '../lib/scoring';
import { getReviewCandidates } from '../lib/review';

export type QuizQuestion = {
  id: string;
  text: string;
  type: 'SINGLE' | 'MULTI';
  options: { id: string; text: string }[];
};

export type SubmitAnswerResult = {
  isCorrect: boolean;
  correctOptionIds: string[];
  explanation: string | null;
};

export type FinishResult = {
  correctCount: number;
  totalQuestions: number;
};

export async function startQuizSessionCore(
  client: PrismaClient,
  deckId: string,
  mode: 'NORMAL' | 'REVIEW'
): Promise<{ attemptId: string; questions: QuizQuestion[] }> {
  let questionIds: string[] | undefined;

  if (mode === 'REVIEW') {
    const candidates = await getReviewCandidates(client, deckId);
    questionIds = candidates.map((c) => c.questionId);
  }

  const questions = await client.question.findMany({
    where: { deckId, ...(questionIds ? { id: { in: questionIds } } : {}) },
    include: { options: { orderBy: { order: 'asc' } } },
  });

  const selected = shuffleArray(questions);

  const attempt = await client.attempt.create({
    data: { deckId, mode, totalQuestions: selected.length },
  });

  const quizQuestions: QuizQuestion[] = selected.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type as 'SINGLE' | 'MULTI',
    options: shuffleArray(q.options).map((o) => ({ id: o.id, text: o.text })),
  }));

  return { attemptId: attempt.id, questions: quizQuestions };
}

export async function submitAnswerCore(
  client: PrismaClient,
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<SubmitAnswerResult> {
  const question = await client.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { options: true },
  });
  const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
  const correct = isAnswerCorrect(selectedOptionIds, correctOptionIds);

  await client.attemptAnswer.create({
    data: {
      attemptId,
      questionId,
      selectedOptionIds: JSON.stringify(selectedOptionIds),
      isCorrect: correct,
    },
  });

  return { isCorrect: correct, correctOptionIds, explanation: question.explanation };
}

export async function finishQuizSessionCore(client: PrismaClient, attemptId: string): Promise<FinishResult> {
  // Only the correct/total counts are needed here to close out the Attempt — the per-question
  // missed-answer detail is display-only and the results page computes it fresh from the DB
  // itself (it can be revisited independently of this call), so it isn't duplicated here.
  const answers = await client.attemptAnswer.findMany({ where: { attemptId } });

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;

  await client.attempt.update({
    where: { id: attemptId },
    data: { finishedAt: new Date(), correctCount },
  });

  return { correctCount, totalQuestions };
}

export async function startQuizSession(
  deckId: string,
  mode: 'NORMAL' | 'REVIEW'
): Promise<{ attemptId: string; questions: QuizQuestion[] }> {
  return startQuizSessionCore(prisma, deckId, mode);
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<SubmitAnswerResult> {
  return submitAnswerCore(prisma, attemptId, questionId, selectedOptionIds);
}

export async function finishQuizSession(attemptId: string): Promise<FinishResult> {
  const result = await finishQuizSessionCore(prisma, attemptId);
  revalidatePath('/');
  return result;
}
