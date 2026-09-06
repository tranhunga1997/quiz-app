'use server';

import type { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../lib/db';
import { shuffleArray } from '../lib/shuffle';
import { isAnswerCorrect } from '../lib/scoring';
import { getReviewCandidates } from '../lib/review';

export type { QuizMode } from '../lib/quizMode';
import type { QuizMode } from '../lib/quizMode';
import type { QuestionType } from '../lib/questionType';

export type QuizQuestion = {
  id: string;
  text: string;
  type: QuestionType;
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
  mode: QuizMode,
  shuffleQuestions: boolean = true
): Promise<{ attemptId: string; questions: QuizQuestion[] }> {
  let questionIds: string[] | undefined;

  if (mode === 'REVIEW') {
    const candidates = await getReviewCandidates(client, deckId);
    questionIds = candidates.map((c) => c.questionId);
  } else if (mode === 'FLAGGED') {
    // Flagged status is set manually (see setQuestionFlag) and is entirely independent
    // of answer-correctness history — unlike REVIEW, a flagged question stays
    // practiceable here even if its most recent answer was correct, and an
    // always-correctly-answered question never appears here unless the user flags it.
    const flagged = await client.question.findMany({ where: { deckId, flagged: true }, select: { id: true } });
    questionIds = flagged.map((q) => q.id);
  }

  const questions = await client.question.findMany({
    where: { deckId, ...(questionIds ? { id: { in: questionIds } } : {}) },
    include: { options: { orderBy: { order: 'asc' } } },
    // Only meaningful when shuffleQuestions is false — a shuffle right after
    // makes any DB order irrelevant, so skip the explicit sort in that case.
    // Ordered by the explicit `order` column, NOT createdAt: a CSV import
    // nested-creates every question in one Prisma call, so they all get the exact
    // same now() timestamp and createdAt has no defined tiebreaker (verified
    // empirically). See prisma/schema.prisma's Question.order doc comment.
    ...(shuffleQuestions ? {} : { orderBy: { order: 'asc' as const } }),
  });

  // Question order respects shuffleQuestions; answer-option order within each
  // question is always shuffled regardless, so memorizing "the answer is always
  // position 2" never works.
  const selected = shuffleQuestions ? shuffleArray(questions) : questions;

  const attempt = await client.attempt.create({
    data: { deckId, mode, totalQuestions: selected.length },
  });

  const quizQuestions: QuizQuestion[] = selected.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type as QuestionType,
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
  const [question, attempt] = await Promise.all([
    client.question.findUniqueOrThrow({ where: { id: questionId }, include: { options: true } }),
    client.attempt.findUniqueOrThrow({ where: { id: attemptId } }),
  ]);
  // A question must belong to the same deck the attempt was started for — otherwise a
  // caller could record an answer for a question from an unrelated deck under this
  // attempt, corrupting that deck's scoring/review/history data (nothing else in this
  // action validates that relationship, since attemptId and questionId are both
  // client-supplied).
  if (question.deckId !== attempt.deckId) {
    throw new Error('Câu hỏi không thuộc bộ đề của lượt làm bài này');
  }
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
    data: { finishedAt: new Date(), correctCount, totalQuestions },
  });

  return { correctCount, totalQuestions };
}

export async function startQuizSession(
  deckId: string,
  mode: QuizMode,
  shuffleQuestions: boolean = true
): Promise<{ attemptId: string; questions: QuizQuestion[] }> {
  return startQuizSessionCore(prisma, deckId, mode, shuffleQuestions);
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
