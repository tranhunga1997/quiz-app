import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { getReviewCandidates } from '../../src/lib/review';

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
    await recordAnswer(db.prisma, deck.id, question.id, true, new Date('2026-01-03'));

    const candidates = await getReviewCandidates(db.prisma, deck.id);

    expect(candidates).toEqual([
      { questionId: question.id, wrongCount: 2, lastWrongAt: new Date('2026-01-02') },
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
});
