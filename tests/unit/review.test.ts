import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { getReviewCandidates, getReviewDueCountsByDeck } from '../../src/lib/review';

describe('getReviewCandidates', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  async function seedDeckWithQuestion(prisma: ReturnType<typeof createTestDb>['prisma']) {
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
      include: { options: true },
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

  it('excludes questions with no wrong answers', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedDeckWithQuestion(db.prisma);
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date());

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates).toHaveLength(0);
  });

  it('includes a question with at least one wrong answer, with correct wrongCount', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedDeckWithQuestion(db.prisma);
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-02'));

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates).toEqual([
      { questionId: question.id, wrongCount: 2, lastWrongAt: new Date('2026-01-02') },
    ]);
  });

  it('excludes a question whose most recent answer is correct, even after earlier wrong answers', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedDeckWithQuestion(db.prisma);
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-02'));
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-03'));

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates).toHaveLength(0);
  });

  it('re-includes a question that relapses: wrong, then correct, then wrong again', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedDeckWithQuestion(db.prisma);
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-02'));
    await recordAnswer(db.prisma, deck.id, question.id, false, new Date('2026-01-03'));

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates).toEqual([
      { questionId: question.id, wrongCount: 2, lastWrongAt: new Date('2026-01-03') },
    ]);
  });

  it('orders by wrongCount desc, then lastWrongAt desc', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    async function makeQuestion(label: string) {
      return db.prisma.question.create({
        data: {
          deckId: deck.id,
          text: label,
          type: 'SINGLE',
          options: { create: [{ text: 'A', isCorrect: true, order: 1 }] },
        },
      });
    }

    const qFewOld = await makeQuestion('few-old');
    const qManyRecent = await makeQuestion('many-recent');
    const qFewRecent = await makeQuestion('few-recent');

    await recordAnswer(db.prisma, deck.id, qFewOld.id, false, new Date('2026-01-01'));

    await recordAnswer(db.prisma, deck.id, qManyRecent.id, false, new Date('2026-01-01'));
    await recordAnswer(db.prisma, deck.id, qManyRecent.id, false, new Date('2026-01-05'));

    await recordAnswer(db.prisma, deck.id, qFewRecent.id, false, new Date('2026-01-10'));

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates.map((c) => c.questionId)).toEqual([qManyRecent.id, qFewRecent.id, qFewOld.id]);
  });

  it('counts an answer from an attempt that was never finished (abandoned mid-quiz)', async () => {
    // Locks in the deliberate behavior described in review.ts's fetchQuestionStats
    // comment: review eligibility is a per-answer concept, independent of whether the
    // session it was submitted in was ever completed.
    const db = createTestDb();
    cleanup = db.cleanup;
    const { deck, question } = await seedDeckWithQuestion(db.prisma);
    const abandonedAttempt = await db.prisma.attempt.create({
      data: { deckId: deck.id, mode: 'NORMAL', totalQuestions: 1, correctCount: 0 },
    });
    await db.prisma.attemptAnswer.create({
      data: { attemptId: abandonedAttempt.id, questionId: question.id, selectedOptionIds: '[]', isCorrect: false },
    });

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates.map((c) => c.questionId)).toEqual([question.id]);
  });
});

describe('getReviewDueCountsByDeck', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  async function seedQuestion(prisma: ReturnType<typeof createTestDb>['prisma'], deckId: string) {
    return prisma.question.create({
      data: { deckId, text: 'Q', type: 'SINGLE', options: { create: [{ text: 'A', isCorrect: true, order: 1 }] } },
    });
  }

  async function recordAnswer(
    prisma: ReturnType<typeof createTestDb>['prisma'],
    deckId: string,
    questionId: string,
    isCorrect: boolean
  ) {
    const attempt = await prisma.attempt.create({
      data: { deckId, mode: 'NORMAL', totalQuestions: 1, correctCount: isCorrect ? 1 : 0, finishedAt: new Date() },
    });
    await prisma.attemptAnswer.create({
      data: { attemptId: attempt.id, questionId, selectedOptionIds: '[]', isCorrect },
    });
  }

  it('returns a per-deck due count across every deck when deckIds is omitted', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deckA = await db.prisma.deck.create({ data: { name: 'A' } });
    const deckB = await db.prisma.deck.create({ data: { name: 'B' } });
    const deckC = await db.prisma.deck.create({ data: { name: 'C' } });
    const qA = await seedQuestion(db.prisma, deckA.id);
    const qB = await seedQuestion(db.prisma, deckB.id);
    await seedQuestion(db.prisma, deckC.id);
    await recordAnswer(db.prisma, deckA.id, qA.id, false);
    await recordAnswer(db.prisma, deckB.id, qB.id, true);

    const counts = await getReviewDueCountsByDeck(db.prisma);

    expect(counts.get(deckA.id)).toBe(1);
    expect(counts.has(deckB.id)).toBe(false);
    expect(counts.has(deckC.id)).toBe(false);
  });

  it('scopes to the given deckIds when provided', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deckA = await db.prisma.deck.create({ data: { name: 'A' } });
    const deckB = await db.prisma.deck.create({ data: { name: 'B' } });
    const qA = await seedQuestion(db.prisma, deckA.id);
    const qB = await seedQuestion(db.prisma, deckB.id);
    await recordAnswer(db.prisma, deckA.id, qA.id, false);
    await recordAnswer(db.prisma, deckB.id, qB.id, false);

    const counts = await getReviewDueCountsByDeck(db.prisma, [deckA.id]);

    expect(counts.get(deckA.id)).toBe(1);
    expect(counts.has(deckB.id)).toBe(false);
  });
});
