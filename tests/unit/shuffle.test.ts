import { describe, it, expect, vi, afterEach } from 'vitest';
import { shuffleArray } from '../../src/lib/shuffle';

describe('shuffleArray', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4];
    shuffleArray(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('returns an array with exactly the same elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const result = shuffleArray(input);
    expect(result.slice().sort()).toEqual(input.slice().sort());
    expect(result).toHaveLength(input.length);
  });

  it('produces a different order given a non-identity random sequence', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = shuffleArray([1, 2, 3, 4, 5]);
    expect(result).not.toEqual([1, 2, 3, 4, 5]);
  });
});
