'use server';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/db';
import { parseQuizCsv, type CsvRowError } from '../lib/csv';

export type ImportResult =
  | { ok: true; deckId: string; importedCount: number; errors: CsvRowError[] }
  | { ok: false; error: string };

const MAX_DECK_NAME_LENGTH = 200;

export async function importDeckCore(
  client: PrismaClient,
  deckName: string,
  sourceFileName: string,
  csvText: string
): Promise<ImportResult> {
  const trimmedName = deckName.trim();
  if (!trimmedName) {
    return { ok: false, error: 'Tên bộ đề không được để trống.' };
  }
  if (trimmedName.length > MAX_DECK_NAME_LENGTH) {
    return { ok: false, error: `Tên bộ đề quá dài (tối đa ${MAX_DECK_NAME_LENGTH} ký tự).` };
  }

  const { validRows, errors } = parseQuizCsv(csvText);

  if (validRows.length === 0) {
    return { ok: false, error: 'Không có dòng nào hợp lệ để import.' };
  }

  const deck = await client.deck.create({
    data: {
      name: trimmedName,
      sourceFileName,
      questions: {
        create: validRows.map((row, i) => ({
          text: row.question,
          type: row.correctIndexes.length > 1 ? 'MULTI' : 'SINGLE',
          explanation: row.explanation,
          // Preserves CSV row order — NOT derivable from createdAt, since every
          // question in this nested-create call gets the exact same timestamp.
          order: i,
          options: {
            create: row.options.map((text, i) => ({
              text,
              isCorrect: row.correctIndexes.includes(i + 1),
              order: i + 1,
            })),
          },
        })),
      },
    },
  });

  return { ok: true, deckId: deck.id, importedCount: validRows.length, errors };
}

export async function importDeck(deckName: string, sourceFileName: string, csvText: string): Promise<ImportResult> {
  return importDeckCore(prisma, deckName, sourceFileName, csvText);
}
