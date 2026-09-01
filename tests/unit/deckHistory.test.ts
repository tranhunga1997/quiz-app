import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { getDeckAttemptHistory } from '../../src/lib/deckHistory';

describe('getDeckAttemptHistory', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  it('returns an empty array for a deck with no finished attempts', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    const history = await getDeckAttemptHistory(db.prisma, deck.id);

    expect(history).toEqual([]);
  });

  it('excludes attempts that were never finished', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    await db.prisma.attempt.create({
      data: { deckId: deck.id, mode: 'NORMAL', totalQuestions: 2, correctCount: 0 },
    });

    const history = await getDeckAttemptHistory(db.prisma, deck.id);

    expect(history).toEqual([]);
  });

  it('returns finished attempts oldest-first, with computed scorePercent', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    const later = await db.prisma.attempt.create({
      data: {
        deckId: deck.id,
        mode: 'NORMAL',
        totalQuestions: 4,
        correctCount: 2,
        startedAt: new Date('2026-01-05'),
        finishedAt: new Date('2026-01-05'),
      },
    });
    const earlier = await db.prisma.attempt.create({
      data: {
        deckId: deck.id,
        mode: 'REVIEW',
        totalQuestions: 2,
        correctCount: 2,
        startedAt: new Date('2026-01-01'),
        finishedAt: new Date('2026-01-01'),
      },
    });

    const history = await getDeckAttemptHistory(db.prisma, deck.id);

    expect(history).toEqual([
      {
        id: earlier.id,
        mode: 'REVIEW',
        startedAt: new Date('2026-01-01'),
        finishedAt: new Date('2026-01-01'),
        correctCount: 2,
        totalQuestions: 2,
        scorePercent: 100,
      },
      {
        id: later.id,
        mode: 'NORMAL',
        startedAt: new Date('2026-01-05'),
        finishedAt: new Date('2026-01-05'),
        correctCount: 2,
        totalQuestions: 4,
        scorePercent: 50,
      },
    ]);
  });

  it('only includes attempts for the given deck, not other decks', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    const other = await db.prisma.deck.create({ data: { name: 'Other' } });
    await db.prisma.attempt.create({
      data: { deckId: other.id, mode: 'NORMAL', totalQuestions: 1, correctCount: 1, finishedAt: new Date() },
    });

    const history = await getDeckAttemptHistory(db.prisma, deck.id);

    expect(history).toEqual([]);
  });
});
