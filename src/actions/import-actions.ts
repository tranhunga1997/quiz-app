import type { PrismaClient } from '@prisma/client';
import { parseQuizCsv, type CsvRowError } from '../lib/csv';

export type ImportResult =
  | { ok: true; deckId: string; importedCount: number; errors: CsvRowError[] }
  | { ok: false; error: string };

export async function importDeck(
  prisma: PrismaClient,
  deckName: string,
  sourceFileName: string,
  csvText: string
): Promise<ImportResult> {
  const { validRows, errors } = parseQuizCsv(csvText);

  if (validRows.length === 0) {
    return { ok: false, error: 'Không có dòng nào hợp lệ để import.' };
  }

  const deck = await prisma.deck.create({
    data: {
      name: deckName,
      sourceFileName,
      questions: {
        create: validRows.map((row) => ({
          text: row.question,
          type: row.correctIndexes.length > 1 ? 'MULTI' : 'SINGLE',
          explanation: row.explanation,
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
