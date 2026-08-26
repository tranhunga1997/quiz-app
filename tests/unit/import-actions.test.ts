import { describe, it, expect, afterEach } from 'vitest';
import { createTestDb } from '../testDb';
import { importDeck } from '../../src/actions/import-actions';

describe('importDeck', () => {
  let cleanup: () => void;
  afterEach(() => cleanup?.());

  it('creates a deck and its questions/options from valid CSV rows', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const csv =
      'question,option1,option2,option3,option4,correct,explanation\n' +
      'Q1?,A,B,C,D,1,exp1\n' +
      'Q2?,A,B,C,D,1;3,';

    const result = await importDeck(db.prisma, 'My Deck', 'my-deck.csv', csv);

    expect(result).toMatchObject({ ok: true, importedCount: 2, errors: [] });
    if (!result.ok) throw new Error('expected ok result');

    const deck = await db.prisma.deck.findUnique({
      where: { id: result.deckId },
      include: { questions: { include: { options: true } } },
    });
    expect(deck?.name).toBe('My Deck');
    expect(deck?.sourceFileName).toBe('my-deck.csv');
    expect(deck?.questions).toHaveLength(2);

    const q1 = deck!.questions.find((q) => q.text === 'Q1?')!;
    expect(q1.type).toBe('SINGLE');
    expect(q1.explanation).toBe('exp1');
    expect(q1.options.filter((o) => o.isCorrect)).toHaveLength(1);

    const q2 = deck!.questions.find((q) => q.text === 'Q2?')!;
    expect(q2.type).toBe('MULTI');
    expect(q2.options.filter((o) => o.isCorrect)).toHaveLength(2);
  });

  it('imports valid rows and reports errors for invalid rows in the same file', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const csv =
      'question,option1,option2,option3,option4,correct\n' +
      'Good?,A,B,C,D,1\n' +
      ',A,B,C,D,1';

    const result = await importDeck(db.prisma, 'Mixed Deck', 'mixed.csv', csv);

    expect(result).toMatchObject({
      ok: true,
      importedCount: 1,
      errors: [{ rowNumber: 2, reason: 'Thiếu nội dung câu hỏi' }],
    });
  });

  it('returns ok:false and creates no deck when every row is invalid', async () => {
    const db = createTestDb();
    cleanup = db.cleanup;
    const csv = 'question,option1,option2,option3,option4,correct\n' + ',A,B,C,D,1';

    const result = await importDeck(db.prisma, 'Empty Deck', 'empty.csv', csv);

    expect(result.ok).toBe(false);
    const decks = await db.prisma.deck.findMany();
    expect(decks).toHaveLength(0);
  });
});
