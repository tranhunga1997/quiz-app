import Papa from 'papaparse';

export type ParsedRow = {
  rowNumber: number;
  question: string;
  options: [string, string, string, string];
  correctIndexes: number[];
  explanation: string | null;
};

export type CsvRowError = { rowNumber: number; reason: string };

export type CsvParseResult = { validRows: ParsedRow[]; errors: CsvRowError[] };

const REQUIRED_HEADERS = ['question', 'option1', 'option2', 'option3', 'option4', 'correct'];

// Generous but finite caps on imported text — nothing in the UI needs a question or
// option longer than this, and an unbounded field/row count is the only lever an
// otherwise-plain-text CSV import has to produce a pathologically large deck (see the
// security audit's CSV-import finding).
const MAX_QUESTION_LENGTH = 2000;
const MAX_OPTION_LENGTH = 500;
const MAX_EXPLANATION_LENGTH = 5000;
const MAX_ROWS = 2000;

export function parseQuizCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const foundHeaders = new Set(parsed.meta.fields ?? []);
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !foundHeaders.has(h));
  if (missingHeaders.length > 0) {
    return {
      validRows: [],
      errors: [{ rowNumber: 0, reason: `Thiếu cột bắt buộc: ${missingHeaders.join(', ')}` }],
    };
  }

  if (parsed.data.length > MAX_ROWS) {
    return {
      validRows: [],
      errors: [{ rowNumber: 0, reason: `File có quá nhiều dòng (tối đa ${MAX_ROWS} dòng)` }],
    };
  }

  const validRows: ParsedRow[] = [];
  const errors: CsvRowError[] = [];

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const question = (raw.question ?? '').trim();
    if (!question) {
      errors.push({ rowNumber, reason: 'Thiếu nội dung câu hỏi' });
      return;
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      errors.push({ rowNumber, reason: `Nội dung câu hỏi quá dài (tối đa ${MAX_QUESTION_LENGTH} ký tự)` });
      return;
    }

    const parsedExtra = (raw as { __parsed_extra?: unknown }).__parsed_extra;
    if (Array.isArray(parsedExtra) && parsedExtra.length > 0) {
      errors.push({
        rowNumber,
        reason:
          'Cột correct chứa dấu phẩy (,) — chỉ dùng dấu chấm phẩy (;) để phân tách nhiều đáp án đúng',
      });
      return;
    }

    const options: string[] = [];
    let hasOversizedOption = false;
    for (let i = 1; i <= 4; i++) {
      const value = (raw[`option${i}`] ?? '').trim();
      if (!value) {
        errors.push({ rowNumber, reason: `Thiếu lựa chọn option${i}` });
        return;
      }
      if (value.length > MAX_OPTION_LENGTH) {
        errors.push({ rowNumber, reason: `Lựa chọn option${i} quá dài (tối đa ${MAX_OPTION_LENGTH} ký tự)` });
        hasOversizedOption = true;
        break;
      }
      options.push(value);
    }
    if (hasOversizedOption) return;

    const rawCorrect = (raw.correct ?? '').trim();
    const parts = rawCorrect === '' ? [] : rawCorrect.split(';').map((p) => p.trim());
    const correctIndexes = parts.map((p) => Number(p));
    const isValidIndexSet =
      correctIndexes.length > 0 &&
      correctIndexes.every((n) => Number.isInteger(n) && n >= 1 && n <= 4) &&
      new Set(correctIndexes).size === correctIndexes.length;

    if (!isValidIndexSet) {
      errors.push({
        rowNumber,
        reason: `Cột correct không hợp lệ: "${rawCorrect}" (chỉ nhận 1-4, phân tách bằng ";")`,
      });
      return;
    }

    const explanationRaw = (raw.explanation ?? '').trim();
    if (explanationRaw.length > MAX_EXPLANATION_LENGTH) {
      errors.push({ rowNumber, reason: `Giải thích quá dài (tối đa ${MAX_EXPLANATION_LENGTH} ký tự)` });
      return;
    }

    validRows.push({
      rowNumber,
      question,
      options: options as [string, string, string, string],
      correctIndexes: [...correctIndexes].sort((a, b) => a - b),
      explanation: explanationRaw === '' ? null : explanationRaw,
    });
  });

  return { validRows, errors };
}
