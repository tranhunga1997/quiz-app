import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { renameDeckCore, deleteDeckCore } from '../../src/actions/deck-actions';

describe('deck-actions', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  it('renameDeckCore updates the deck name', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'Old Name' } });

    await renameDeckCore(db.prisma, deck.id, 'New Name');

    const updated = await db.prisma.deck.findUnique({ where: { id: deck.id } });
    expect(updated?.name).toBe('New Name');
  });

  it('deleteDeckCore removes the deck and cascades to its questions/options', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({
      data: {
        name: 'To Delete',
        questions: {
          create: [
            {
              text: 'Q',
              type: 'SINGLE',
              options: { create: [{ text: 'A', isCorrect: true, order: 1 }] },
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });
    const questionId = deck.questions[0].id;

    await deleteDeckCore(db.prisma, deck.id);

    expect(await db.prisma.deck.findUnique({ where: { id: deck.id } })).toBeNull();
    expect(await db.prisma.question.findUnique({ where: { id: questionId } })).toBeNull();
  });
});
