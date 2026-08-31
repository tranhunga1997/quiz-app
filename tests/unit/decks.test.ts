import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { listDecksDue, listDecksWithStats, searchDeckNamesCore } from '../../src/lib/decks';

describe('decks', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  async function makeDeck(prisma: ReturnType<typeof createTestDb>['prisma'], name: string) {
    return prisma.deck.create({ data: { name } });
  }

  describe('listDecksWithStats', () => {
    it('paginates: returns only pageSize decks per page and the correct totalCount', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
        await makeDeck(db.prisma, name);
      }

      const page1 = await listDecksWithStats(db.prisma, { page: 1, pageSize: 5 });
      const page2 = await listDecksWithStats(db.prisma, { page: 2, pageSize: 5 });

      expect(page1.totalCount).toBe(7);
      expect(page1.decks).toHaveLength(5);
      expect(page2.totalCount).toBe(7);
      expect(page2.decks).toHaveLength(2);
      // No overlap between pages.
      const page1Ids = new Set(page1.decks.map((d) => d.id));
      expect(page2.decks.every((d) => !page1Ids.has(d.id))).toBe(true);
    });

    it('filters by name (case-insensitive substring) and paginates the filtered result', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      await makeDeck(db.prisma, 'Toán học 10');
      await makeDeck(db.prisma, 'toán cao cấp');
      await makeDeck(db.prisma, 'Tiếng Anh');

      const result = await listDecksWithStats(db.prisma, { query: 'toán', page: 1, pageSize: 5 });

      expect(result.totalCount).toBe(2);
      expect(result.decks.map((d) => d.name).sort()).toEqual(['toán cao cấp', 'Toán học 10'].sort());
    });

    it('returns an empty result set for a query matching nothing', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      await makeDeck(db.prisma, 'Toán học');

      const result = await listDecksWithStats(db.prisma, { query: 'không tồn tại', page: 1, pageSize: 5 });

      expect(result.totalCount).toBe(0);
      expect(result.decks).toHaveLength(0);
    });
  });

  describe('listDecksDue', () => {
    it('only returns decks with at least one question due for review, regardless of how many decks exist', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      const dueDeck = await makeDeck(db.prisma, 'Due Deck');
      await makeDeck(db.prisma, 'Clean Deck');
      const question = await db.prisma.question.create({
        data: { deckId: dueDeck.id, text: 'Q', type: 'SINGLE', options: { create: [{ text: 'A', isCorrect: true, order: 1 }] } },
      });
      const attempt = await db.prisma.attempt.create({
        data: { deckId: dueDeck.id, mode: 'NORMAL', totalQuestions: 1, correctCount: 0 },
      });
      await db.prisma.attemptAnswer.create({
        data: { attemptId: attempt.id, questionId: question.id, selectedOptionIds: '[]', isCorrect: false },
      });

      const due = await listDecksDue(db.prisma);

      expect(due.map((d) => d.id)).toEqual([dueDeck.id]);
      expect(due[0].reviewDueCount).toBe(1);
    });

    it('returns an empty array when no deck has anything due', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      await makeDeck(db.prisma, 'Fresh Deck');

      const due = await listDecksDue(db.prisma);

      expect(due).toHaveLength(0);
    });
  });

  describe('searchDeckNamesCore', () => {
    it('returns matching deck names, capped at 6', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      for (let i = 1; i <= 8; i++) {
        await makeDeck(db.prisma, `Toán ${i}`);
      }

      const results = await searchDeckNamesCore(db.prisma, 'Toán');

      expect(results).toHaveLength(6);
      expect(results.every((r) => r.name.startsWith('Toán'))).toBe(true);
    });

    it('returns an empty array for a blank query, without hitting the database', async () => {
      const db = createTestDb();
      cleanup = db.cleanup;
      await makeDeck(db.prisma, 'Toán học');

      const results = await searchDeckNamesCore(db.prisma, '   ');

      expect(results).toHaveLength(0);
    });
  });
});
