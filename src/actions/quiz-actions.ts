'use server';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/db';
import { shuffleArray } from '../lib/shuffle';
import { isAnswerCorrect, calculateScorePercent } from '../lib/scoring';
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

export type MissedQuestion = {
  questionId: string;
  questionText: string;
  yourAnswerText: string[];
  correctAnswerText: string[];
};

export type FinishResult = {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  missedQuestions: MissedQuestion[];
};

export async function startQuizSessionCore(
  client: PrismaClient,
  deckId: string,
  count: number | 'all',
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

  let selected = shuffleArray(questions);
  if (count !== 'all') {
    selected = selected.slice(0, count);
  }

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
  const answers = await client.attemptAnswer.findMany({
    where: { attemptId },
    include: { question: { include: { options: true } } },
  });

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;

  const missedQuestions: MissedQuestion[] = answers
    .filter((a) => !a.isCorrect)
    .map((a) => {
      const selectedIds: string[] = JSON.parse(a.selectedOptionIds);
      const optionById = new Map(a.question.options.map((o) => [o.id, o.text]));
      return {
        questionId: a.questionId,
        questionText: a.question.text,
        yourAnswerText: selectedIds.map((id) => optionById.get(id) ?? ''),
        correctAnswerText: a.question.options.filter((o) => o.isCorrect).map((o) => o.text),
      };
    });

  await client.attempt.update({
    where: { id: attemptId },
    data: { finishedAt: new Date(), correctCount },
  });

  return {
    correctCount,
    totalQuestions,
    scorePercent: calculateScorePercent(correctCount, totalQuestions),
    missedQuestions,
  };
}

export async function startQuizSession(
  deckId: string,
  count: number | 'all',
  mode: 'NORMAL' | 'REVIEW'
): Promise<{ attemptId: string; questions: QuizQuestion[] }> {
  return startQuizSessionCore(prisma, deckId, count, mode);
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[]
): Promise<SubmitAnswerResult> {
  return submitAnswerCore(prisma, attemptId, questionId, selectedOptionIds);
}

export async function finishQuizSession(attemptId: string): Promise<FinishResult> {
  return finishQuizSessionCore(prisma, attemptId);
}
