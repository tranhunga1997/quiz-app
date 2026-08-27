import { describe, it, expect } from 'vitest';
import { parseQuizCsv } from '../../src/lib/csv';

describe('parseQuizCsv', () => {
  it('parses a valid single-correct-answer row', () => {
    const csv =
      'question,option1,option2,option3,option4,correct,explanation\n' +
      'Thu do VN?,Ha Noi,HCM,Da Nang,Hue,1,Because reasons';

    const result = parseQuizCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toEqual([
      {
        rowNumber: 1,
        question: 'Thu do VN?',
        options: ['Ha Noi', 'HCM', 'Da Nang', 'Hue'],
        correctIndexes: [1],
        explanation: 'Because reasons',
      },
    ]);
  });

  it('parses a multi-correct-answer row using ; separator', () => {
    const csv =
      'question,option1,option2,option3,option4,correct,explanation\n' +
      'Pick OSes,Windows,Linux,macOS,Photoshop,1;2;3,';

    const result = parseQuizCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].correctIndexes).toEqual([1, 2, 3]);
    expect(result.validRows[0].explanation).toBeNull();
  });

  it('matches headers case-insensitively and in any order', () => {
    const csv =
      'CORRECT,Option2,Option1,Question,option4,option3\n' + '1,B,A,Q?,D,C';

    const result = parseQuizCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0]).toMatchObject({
      question: 'Q?',
      options: ['A', 'B', 'C', 'D'],
      correctIndexes: [1],
    });
  });

  it('reports a row with an empty question and does not include it in validRows', () => {
    const csv =
      'question,option1,option2,option3,option4,correct\n' + ',A,B,C,D,1';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toEqual([{ rowNumber: 1, reason: 'Thiếu nội dung câu hỏi' }]);
  });

  it('reports a row with a missing option', () => {
    const csv =
      'question,option1,option2,option3,option4,correct\n' + 'Q?,A,B,,D,1';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toEqual([{ rowNumber: 1, reason: 'Thiếu lựa chọn option3' }]);
  });

  it('reports a row with an out-of-range correct index', () => {
    const csv =
      'question,option1,option2,option3,option4,correct\n' + 'Q?,A,B,C,D,5';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toEqual([
      { rowNumber: 1, reason: 'Cột correct không hợp lệ: "5" (chỉ nhận 1-4, phân tách bằng ";")' },
    ]);
  });

  it('reports a row with an empty correct column', () => {
    const csv = 'question,option1,option2,option3,option4,correct\n' + 'Q?,A,B,C,D,';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].rowNumber).toBe(1);
  });

  it('keeps valid rows even when other rows in the same file are invalid', () => {
    const csv =
      'question,option1,option2,option3,option4,correct\n' +
      'Good?,A,B,C,D,1\n' +
      ',A,B,C,D,1\n' +
      'Also good?,A,B,C,D,2';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(2);
    expect(result.validRows.map((r) => r.rowNumber)).toEqual([1, 3]);
    expect(result.errors).toEqual([{ rowNumber: 2, reason: 'Thiếu nội dung câu hỏi' }]);
  });

  it('reports a row-level error when the correct column contains a comma instead of a semicolon', () => {
    // User meant "1 or 2 are correct" and typed a comma (habit) instead of the required ';'
    // separator. PapaParse splits that comma as an extra CSV field beyond the 6 header
    // columns, spilling "2" into __parsed_extra — raw.correct ends up as the (validly
    // single-answer) "1", which must NOT silently import as correctIndexes: [1].
    const csv = 'question,option1,option2,option3,option4,correct\n' + 'Q?,A,B,C,D,1,2';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toEqual([
      {
        rowNumber: 1,
        reason: 'Cột correct chứa dấu phẩy (,) — chỉ dùng dấu chấm phẩy (;) để phân tách nhiều đáp án đúng',
      },
    ]);
  });

  it('returns a single file-level error when required headers are missing', () => {
    const csv = 'question,option1\nQ?,A';

    const result = parseQuizCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toEqual([
      { rowNumber: 0, reason: 'Thiếu cột bắt buộc: option2, option3, option4, correct' },
    ]);
  });
});
