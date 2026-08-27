'use server';

import { prisma } from '../lib/db';
import { importDeck, type ImportResult } from './import-actions';

export async function submitImport(deckName: string, sourceFileName: string, csvText: string): Promise<ImportResult> {
  return importDeck(prisma, deckName, sourceFileName, csvText);
}
