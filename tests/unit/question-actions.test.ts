import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { addQuestionCore, updateQuestionCore, deleteQuestionCore, setQuestionFlagCore } from '../../src/actions/question-actions';

describe('question-actions', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  const validInput = {
    text: 'Q?',
    explanation: null,
    options: [
      { text: 'A', isCorrect: true },
      { text: 'B', isCorrect: false },
      { text: 'C', isCorrect: false },
      { text: 'D', isCorrect: false },
    ],
  };

  it('addQuestionCore creates a SINGLE-type question with 4 options', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    const { id } = await addQuestionCore(db.prisma, deck.id, validInput);

    const question = await db.prisma.question.findUnique({ where: { id }, include: { options: true } });
    expect(question?.type).toBe('SINGLE');
    expect(question?.options).toHaveLength(4);
    expect(question?.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('addQuestionCore creates a MULTI-type question when 2+ options are correct', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    const { id } = await addQuestionCore(db.prisma, deck.id, {
      ...validInput,
      options: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: true },
        { text: 'C', isCorrect: false },
        { text: 'D', isCorrect: false },
      ],
    });

    const question = await db.prisma.question.findUnique({ where: { id } });
    expect(question?.type).toBe('MULTI');
  });

  it('addQuestionCore rejects input with zero correct options', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    await expect(
      addQuestionCore(db.prisma, deck.id, {
        ...validInput,
        options: validInput.options.map((o) => ({ ...o, isCorrect: false })) as any,
      })
    ).rejects.toThrow('Phải có ít nhất 1 đáp án đúng');
  });

  it('addQuestionCore rejects input with a number of options other than 4', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    await expect(
      addQuestionCore(db.prisma, deck.id, { ...validInput, options: validInput.options.slice(0, 3) })
    ).rejects.toThrow('Phải có đúng 4 lựa chọn');
  });

  it('addQuestionCore rejects blank question text', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    await expect(
      addQuestionCore(db.prisma, deck.id, { ...validInput, text: '   ' })
    ).rejects.toThrow('Nội dung câu hỏi không được để trống');
  });

  it('addQuestionCore rejects a blank option', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    await expect(
      addQuestionCore(db.prisma, deck.id, {
        ...validInput,
        options: [{ text: '  ', isCorrect: true }, ...validInput.options.slice(1)],
      })
    ).rejects.toThrow('Mỗi lựa chọn phải có nội dung');
  });

  it('addQuestionCore assigns each new question the next order within its deck', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });

    const first = await addQuestionCore(db.prisma, deck.id, validInput);
    const second = await addQuestionCore(db.prisma, deck.id, validInput);

    const q1 = await db.prisma.question.findUniqueOrThrow({ where: { id: first.id } });
    const q2 = await db.prisma.question.findUniqueOrThrow({ where: { id: second.id } });
    expect(q1.order).toBe(0);
    expect(q2.order).toBe(1);
  });

  it('updateQuestionCore replaces text, explanation, and options', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    const { id } = await addQuestionCore(db.prisma, deck.id, validInput);

    await updateQuestionCore(db.prisma, id, {
      text: 'Updated?',
      explanation: 'now has one',
      options: [
        { text: 'W', isCorrect: false },
        { text: 'X', isCorrect: true },
        { text: 'Y', isCorrect: false },
        { text: 'Z', isCorrect: false },
      ],
    });

    const question = await db.prisma.question.findUnique({ where: { id }, include: { options: true } });
    expect(question?.text).toBe('Updated?');
    expect(question?.explanation).toBe('now has one');
    expect(question?.options.map((o) => o.text).sort()).toEqual(['W', 'X', 'Y', 'Z']);
  });

  it('deleteQuestionCore removes the question and its options', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    const { id } = await addQuestionCore(db.prisma, deck.id, validInput);

    await deleteQuestionCore(db.prisma, id);

    expect(await db.prisma.question.findUnique({ where: { id } })).toBeNull();
  });

  it('setQuestionFlagCore sets and unsets the flagged field', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const deck = await db.prisma.deck.create({ data: { name: 'D' } });
    const { id } = await addQuestionCore(db.prisma, deck.id, validInput);
    expect((await db.prisma.question.findUnique({ where: { id } }))?.flagged).toBe(false);

    await setQuestionFlagCore(db.prisma, id, true);
    expect((await db.prisma.question.findUnique({ where: { id } }))?.flagged).toBe(true);

    await setQuestionFlagCore(db.prisma, id, false);
    expect((await db.prisma.question.findUnique({ where: { id } }))?.flagged).toBe(false);
  });
});
