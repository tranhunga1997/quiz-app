import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';

describe('createTestDb', () => {
  let cleanup: () => Promise<void>;

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it('creates an empty, queryable database', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;

    const deck = await db.prisma.deck.create({ data: { name: 'Test Deck' } });
    const found = await db.prisma.deck.findUnique({ where: { id: deck.id } });

    expect(found?.name).toBe('Test Deck');
  });

  it('gives two calls independent databases', async () => {
    const dbA = createTestDb();
    const dbB = createTestDb();

    await dbA.prisma.deck.create({ data: { name: 'Only in A' } });
    const foundInB = await dbB.prisma.deck.findMany();

    expect(foundInB).toHaveLength(0);

    await dbA.cleanup();
    await dbB.cleanup();
  });
});
