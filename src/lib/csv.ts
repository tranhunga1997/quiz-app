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

  const validRows: ParsedRow[] = [];
  const errors: CsvRowError[] = [];

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 1;
    const question = (raw.question ?? '').trim();
    if (!question) {
      errors.push({ rowNumber, reason: 'Thiếu nội dung câu hỏi' });
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
    for (let i = 1; i <= 4; i++) {
      const value = (raw[`option${i}`] ?? '').trim();
      if (!value) {
        errors.push({ rowNumber, reason: `Thiếu lựa chọn option${i}` });
        return;
      }
      options.push(value);
    }

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
