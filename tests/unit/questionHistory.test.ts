import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { getQuestionHistoryStats } from '../../src/lib/questionHistory';

describe('getQuestionHistoryStats', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  async function seedQuestion(prisma: ReturnType<typeof createTestDb>['prisma']) {
    const deck = await prisma.deck.create({ data: { name: 'D' } });
    const question = await prisma.question.create({
      data: {
        deckId: deck.id,
        text: 'Q1',
        type: 'SINGLE',
        options: {
          create: [
            { text: 'A', isCorrect: true, order: 1 },
            { text: 'B', isCorrect: false, order: 2 },
          ],
        },
      },
    });
    return { deck, question };
  }

  async function recordAnswer(
    prisma: ReturnType<typeof createTestDb>['prisma'],
    deckId: string,
    questionId: string,
    isCorrect: boolean,
    finishedAt: Date
  ) {
    const attempt = await prisma.attempt.create({
      data: { deckId, mode: 'NORMAL', totalQuestions: 1, correctCount: isCorrect ? 1 : 0, finishedAt },
    });
    await prisma.attemptAnswer.create({
      data: { attemptId: attempt.id, questionId, selectedOptionIds: '[]', isCorrect },
    });
  }

  it('returns zeroed stats and no entries for a never-answered question', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { question } = await seedQuestion(db.prisma);

    const stats = await getQuestionHistoryStats(db.prisma, question.id);

    expect(stats).toEqual({ totalAttempts: 0, correctCount: 0, wrongCount: 0, entries: [] });
  });

  it('aggregates counts across multiple answers and orders entries chronologically', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedQuestion(db.prisma);
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-02'));
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-03'));

    const stats = await getQuestionHistoryStats(db.prisma, question.id);

    expect(stats.totalAttempts).toBe(3);
    expect(stats.correctCount).toBe(2);
    expect(stats.wrongCount).toBe(1);
    expect(stats.entries.map((e) => e.isCorrect)).toEqual([true, false, true]);
    expect(stats.entries.map((e) => e.answeredAt)).toEqual([
      new Date('2026-01-01'),
      new Date('2026-01-02'),
      new Date('2026-01-03'),
    ]);
  });

  it('only includes answers for the given question, not sibling questions in the same deck', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedQuestion(db.prisma);
    const other = await db.prisma.question.create({
      data: { deckId: deck.id, text: 'Q2', type: 'SINGLE', options: { create: [{ text: 'A', isCorrect: true, order: 1 }] } },
    });
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, other.id, false, new Date('2026-01-02'));

    const stats = await getQuestionHistoryStats(db.prisma, question.id);

    expect(stats.totalAttempts).toBe(1);
    expect(stats.entries).toHaveLength(1);
  });
});
