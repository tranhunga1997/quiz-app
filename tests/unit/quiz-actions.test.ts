import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { startQuizSessionCore, submitAnswerCore, finishQuizSessionCore } from '../../src/actions/quiz-actions';

describe('quiz-actions', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  async function seedDeck(prisma: ReturnType<typeof createTestDb>['prisma']) {
    const deck = await prisma.deck.create({
      data: {
        name: 'D',
        questions: {
          create: [
            {
              text: 'Q1',
              type: 'SINGLE',
              options: {
                create: [
                  { text: 'A', isCorrect: true, order: 1 },
                  { text: 'B', isCorrect: false, order: 2 },
                ],
              },
            },
            {
              text: 'Q2',
              type: 'SINGLE',
              explanation: 'because',
              options: {
                create: [
                  { text: 'C', isCorrect: false, order: 1 },
                  { text: 'D', isCorrect: true, order: 2 },
                ],
              },
            },
          ],
        },
      },
      include: { questions: { include: { options: true } } },
    });
    return deck;
  }

  it('startQuizSessionCore creates an Attempt and returns questions without revealing answers', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);

    const { attemptId, questions } = await startQuizSessionCore(db.prisma, deck.id, 'all', 'NORMAL');

    expect(questions).toHaveLength(2);
    for (const q of questions) {
      for (const o of q.options) {
        expect(o).not.toHaveProperty('isCorrect');
      }
    }
    const attempt = await db.prisma.attempt.findUnique({ where: { id: attemptId } });
    expect(attempt?.mode).toBe('NORMAL');
    expect(attempt?.totalQuestions).toBe(2);
  });

  it('startQuizSessionCore honors a numeric count limit', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);

    const { questions } = await startQuizSessionCore(db.prisma, deck.id, 1, 'NORMAL');

    expect(questions).toHaveLength(1);
  });

  it('submitAnswerCore records a correct answer and returns the correct option ids', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);
    const q1 = deck.questions.find((q) => q.text === 'Q1')!;
    const correctOption = q1.options.find((o) => o.isCorrect)!;
    const { attemptId } = await startQuizSessionCore(db.prisma, deck.id, 'all', 'NORMAL');

    const result = await submitAnswerCore(db.prisma, attemptId, q1.id, [correctOption.id]);

    expect(result.isCorrect).toBe(true);
    expect(result.correctOptionIds).toEqual([correctOption.id]);
    const saved = await db.prisma.attemptAnswer.findFirst({ where: { attemptId, questionId: q1.id } });
    expect(saved?.isCorrect).toBe(true);
  });

  it('submitAnswerCore records a wrong answer', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);
    const q1 = deck.questions.find((q) => q.text === 'Q1')!;
    const wrongOption = q1.options.find((o) => !o.isCorrect)!;
    const { attemptId } = await startQuizSessionCore(db.prisma, deck.id, 'all', 'NORMAL');

    const result = await submitAnswerCore(db.prisma, attemptId, q1.id, [wrongOption.id]);

    expect(result.isCorrect).toBe(false);
  });

  it('finishQuizSessionCore computes score and lists missed questions', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);
    const q1 = deck.questions.find((q) => q.text === 'Q1')!;
    const q2 = deck.questions.find((q) => q.text === 'Q2')!;
    const { attemptId } = await startQuizSessionCore(db.prisma, deck.id, 'all', 'NORMAL');

    await submitAnswerCore(db.prisma, attemptId, q1.id, [q1.options.find((o) => o.isCorrect)!.id]);
    await submitAnswerCore(db.prisma, attemptId, q2.id, [q2.options.find((o) => !o.isCorrect)!.id]);

    const result = await finishQuizSessionCore(db.prisma, attemptId);

    expect(result.correctCount).toBe(1);
    expect(result.totalQuestions).toBe(2);
    expect(result.scorePercent).toBe(50);
    expect(result.missedQuestions).toHaveLength(1);
    expect(result.missedQuestions[0].questionText).toBe('Q2');
    expect(result.missedQuestions[0].correctAnswerText).toEqual(['D']);
  });

  it('a REVIEW session only includes questions the deck has answered wrong before', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await seedDeck(db.prisma);
    const q1 = deck.questions.find((q) => q.text === 'Q1')!;
    const q2 = deck.questions.find((q) => q.text === 'Q2')!;

    const normal = await startQuizSessionCore(db.prisma, deck.id, 'all', 'NORMAL');
    await submitAnswerCore(db.prisma, normal.attemptId, q1.id, [q1.options.find((o) => o.isCorrect)!.id]);
    await submitAnswerCore(db.prisma, normal.attemptId, q2.id, [q2.options.find((o) => !o.isCorrect)!.id]);
    await finishQuizSessionCore(db.prisma, normal.attemptId);

    const review = await startQuizSessionCore(db.prisma, deck.id, 'all', 'REVIEW');

    expect(review.questions.map((q) => q.id)).toEqual([q2.id]);
  });

  it('a REVIEW session with a numeric count picks the top-N highest-ranked questions, not a random sample', async () => {
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

    async function recordWrongAnswer(questionId: string, finishedAt: Date) {
      const attempt = await db.prisma.attempt.create({
        data: { deckId: deck.id, mode: 'NORMAL', totalQuestions: 1, correctCount: 0, finishedAt },
      });
      await db.prisma.attemptAnswer.create({
        data: { attemptId: attempt.id, questionId, selectedOptionIds: '[]', isCorrect: false },
      });
    }

    // Ranked (per getReviewCandidates: wrongCount desc, lastWrongAt desc) from most to
    // least eligible for review:
    const qManyRecent = await makeQuestion('many-recent'); // wrongCount 2, most recent
    const qFewRecent = await makeQuestion('few-recent'); // wrongCount 1, more recent than qFewOld
    const qFewOld = await makeQuestion('few-old'); // wrongCount 1, oldest

    await recordWrongAnswer(qFewOld.id, new Date('2026-01-01'));
    await recordWrongAnswer(qManyRecent.id, new Date('2026-01-01'));
    await recordWrongAnswer(qManyRecent.id, new Date('2026-01-05'));
    await recordWrongAnswer(qFewRecent.id, new Date('2026-01-10'));

    // Eligible pool has 3 questions; request only the top 2.
    const review = await startQuizSessionCore(db.prisma, deck.id, 2, 'REVIEW');

    expect(review.questions).toHaveLength(2);
    expect(new Set(review.questions.map((q) => q.id))).toEqual(new Set([qManyRecent.id, qFewRecent.id]));
  });
});
