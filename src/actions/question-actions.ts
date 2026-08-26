'use server';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/db';

export type QuestionInput = {
  text: string;
  explanation: string | null;
  options: { text: string; isCorrect: boolean }[];
};

function deriveTypeAndValidate(input: QuestionInput): 'SINGLE' | 'MULTI' {
  if (input.options.length !== 4) {
    throw new Error('Phải có đúng 4 lựa chọn');
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
  const question = await client.question.create({
    data: {
      deckId,
      text: input.text,
      type,
      explanation: input.explanation,
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

export async function addQuestion(deckId: string, input: QuestionInput): Promise<{ id: string }> {
  return addQuestionCore(prisma, deckId, input);
}

export async function updateQuestion(questionId: string, input: QuestionInput): Promise<void> {
  return updateQuestionCore(prisma, questionId, input);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  return deleteQuestionCore(prisma, questionId);
}
