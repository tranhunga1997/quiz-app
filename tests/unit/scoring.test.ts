import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, calculateScorePercent } from '../../src/lib/scoring';

describe('isAnswerCorrect', () => {
  it('is true when selection exactly matches the correct set, order-independent', () => {
    expect(isAnswerCorrect(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('is false when selection is missing a correct option', () => {
    expect(isAnswerCorrect(['a'], ['a', 'b'])).toBe(false);
  });

  it('is false when selection includes an extra wrong option', () => {
    expect(isAnswerCorrect(['a', 'b', 'c'], ['a', 'b'])).toBe(false);
  });

  it('is false when nothing is selected but an answer is required', () => {
    expect(isAnswerCorrect([], ['a'])).toBe(false);
  });
});

describe('calculateScorePercent', () => {
  it('rounds to the nearest whole percent', () => {
    expect(calculateScorePercent(8, 10)).toBe(80);
    expect(calculateScorePercent(1, 3)).toBe(33);
    expect(calculateScorePercent(2, 3)).toBe(67);
  });

  it('returns 0 for a session with zero questions', () => {
    expect(calculateScorePercent(0, 0)).toBe(0);
  });
});
