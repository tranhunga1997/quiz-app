'use server';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/db';
import { getQuestionHistoryStats, type QuestionHistoryStats } from '../lib/questionHistory';
import type { QuestionType } from '../lib/questionType';

export type QuestionInput = {
  text: string;
  explanation: string | null;
  options: { text: string; isCorrect: boolean }[];
};

const MAX_QUESTION_TEXT_LENGTH = 2000;
const MAX_OPTION_TEXT_LENGTH = 500;
const MAX_EXPLANATION_LENGTH = 5000;

function deriveTypeAndValidate(input: QuestionInput): QuestionType {
  if (!input.text.trim()) {
    throw new Error('Nội dung câu hỏi không được để trống');
  }
  if (input.text.length > MAX_QUESTION_TEXT_LENGTH) {
    throw new Error(`Nội dung câu hỏi quá dài (tối đa ${MAX_QUESTION_TEXT_LENGTH} ký tự)`);
  }
  if (input.explanation && input.explanation.length > MAX_EXPLANATION_LENGTH) {
    throw new Error(`Giải thích quá dài (tối đa ${MAX_EXPLANATION_LENGTH} ký tự)`);
  }
  if (input.options.length !== 4) {
    throw new Error('Phải có đúng 4 lựa chọn');
  }
  if (input.options.some((o) => !o.text.trim())) {
    throw new Error('Mỗi lựa chọn phải có nội dung');
  }
  if (input.options.some((o) => o.text.length > MAX_OPTION_TEXT_LENGTH)) {
    throw new Error(`Nội dung lựa chọn quá dài (tối đa ${MAX_OPTION_TEXT_LENGTH} ký tự)`);
  }
  const correctCount = input.options.filter((o) => o.isCorrect).length;
  if (correctCount === 0) {
    throw new Error('Phải có ít nhất 1 đáp án đúng');
  }
  return correctCount > 1 ? 'MULTI' : 'SINGLE';
}

export async function addQuestionCore(
  client: PrismaClient,
  deckId: string,
  input: QuestionInput
): Promise<{ id: string }> {
  const type = deriveTypeAndValidate(input);
  // Appends at the end of the deck's existing order — see prisma/schema.prisma's
  // Question.order doc comment for why this can't be derived from createdAt.
  const order = await client.question.count({ where: { deckId } });
  const question = await client.question.create({
    data: {
      deckId,
      text: input.text,
      type,
      explanation: input.explanation,
      order,
      options: {
        create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i + 1 })),
      },
    },
  });
  return { id: question.id };
}

export async function updateQuestionCore(
  client: PrismaClient,
  questionId: string,
  input: QuestionInput
): Promise<void> {
  const type = deriveTypeAndValidate(input);
  await client.$transaction([
    client.option.deleteMany({ where: { questionId } }),
    client.question.update({
      where: { id: questionId },
      data: {
        text: input.text,
        type,
        explanation: input.explanation,
        options: {
          create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i + 1 })),
        },
      },
    }),
  ]);
}

export async function deleteQuestionCore(client: PrismaClient, questionId: string): Promise<void> {
  await client.question.delete({ where: { id: questionId } });
}

export async function setQuestionFlagCore(client: PrismaClient, questionId: string, flagged: boolean): Promise<void> {
  await client.question.update({ where: { id: questionId }, data: { flagged } });
}

export async function addQuestion(deckId: string, input: QuestionInput): Promise<{ id: string }> {
  return addQuestionCore(prisma, deckId, input);
}

export async function updateQuestion(questionId: string, input: QuestionInput): Promise<void> {
  return updateQuestionCore(prisma, questionId, input);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  return deleteQuestionCore(prisma, questionId);
}

export async function setQuestionFlag(questionId: string, flagged: boolean): Promise<void> {
  return setQuestionFlagCore(prisma, questionId, flagged);
}

/** Fetched on-demand when a question's accordion row is expanded — not eagerly for
 * every question on deck load, since most rows are never opened in a given visit. */
export async function getQuestionHistory(questionId: string): Promise<QuestionHistoryStats> {
  return getQuestionHistoryStats(prisma, questionId);
}
