import { describe, it, expect } from 'vitest';
import { TEMPLATE_CSV } from '../../src/lib/csv-template';
import { parseQuizCsv } from '../../src/lib/csv';

describe('CSV template', () => {
  it('parses with zero errors and at least one example row', () => {
    const result = parseQuizCsv(TEMPLATE_CSV);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows.length).toBeGreaterThanOrEqual(1);
  });
});
