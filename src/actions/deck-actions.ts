'use server';

import type { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '../lib/db';

export async function renameDeckCore(client: PrismaClient, deckId: string, name: string): Promise<void> {
  await client.deck.update({ where: { id: deckId }, data: { name } });
}

export async function deleteDeckCore(client: PrismaClient, deckId: string): Promise<void> {
  await client.deck.delete({ where: { id: deckId } });
}

export async function renameDeck(deckId: string, name: string): Promise<void> {
  await renameDeckCore(prisma, deckId, name);
}

export async function deleteDeck(deckId: string): Promise<void> {
  await deleteDeckCore(prisma, deckId);
  revalidatePath('/');
}
