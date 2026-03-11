import { describe, it, expect } from 'vitest';
import {
  closestIdx,
  nonNullIdxs,
  positiveIdxs,
  getMinMax,
  roundDec,
  guessDec,
  incrRound,
  incrRoundUp,
  incrRoundDn,
  genIncrs,
  clamp,
  fmtNum,
  hasData,
  rangeNum,
  rangeLog,
  rangeAsinh,
  numIntDigits,
  findIncr,
} from '@/math/utils';
import { SortOrder } from '@/types';

// ---- closestIdx ----
describe('closestIdx', () => {
  const arr = [1, 3, 5, 7, 9, 11];

  it('finds exact match', () => {
    expect(closestIdx(5, arr)).toBe(2);
  });

  it('finds closest when between values', () => {
    expect(closestIdx(6, arr)).toBe(2); // closer to 5 than 7
    expect(closestIdx(8, arr)).toBe(3); // closer to 7 than 9
  });

  it('handles value below range', () => {
    expect(closestIdx(-10, arr)).toBe(0);
  });

  it('handles value above range', () => {
    expect(closestIdx(100, arr)).toBe(5);
  });

  it('handles single element', () => {
    expect(closestIdx(42, [10])).toBe(0);
  });

  it('handles two elements', () => {
    expect(closestIdx(2, [1, 3])).toBe(0);
    expect(closestIdx(2.5, [1, 3])).toBe(1); // tie goes to hi (due to <= comparison)
    expect(closestIdx(3, [1, 3])).toBe(1);
  });

  it('respects lo/hi bounds', () => {
    expect(closestIdx(5, arr, 3, 5)).toBe(3); // constrained to [7,9,11]
  });
});

// ---- nonNullIdxs ----
describe('nonNullIdxs', () => {
  it('finds first and last non-null', () => {
    const data = [null, null, 3, 4, null, 6, null];
    expect(nonNullIdxs(data, 0, 6)).toEqual([2, 5]);
  });

  it('returns [-1, -1] for all null', () => {
    expect(nonNullIdxs([null, null, null], 0, 2)).toEqual([-1, -1]);
  });

  it('works with single non-null', () => {
    expect(nonNullIdxs([null, 5, null], 0, 2)).toEqual([1, 1]);
  });
});

// ---- positiveIdxs ----
describe('positiveIdxs', () => {
  it('finds first and last positive', () => {
    const data = [-1, 0, null, 3, -2, 5];
    expect(positiveIdxs(data, 0, 5)).toEqual([3, 5]);
  });

  it('returns [-1, -1] for no positives', () => {
    expect(positiveIdxs([-1, 0, null], 0, 2)).toEqual([-1, -1]);
  });
});

// ---- getMinMax ----
describe('getMinMax', () => {
  it('unsorted data', () => {
    expect(getMinMax([3, 1, 4, 1, 5], 0, 4)).toEqual([1, 5]);
  });

  it('ascending sorted', () => {
    expect(getMinMax([1, 2, 3, 4, 5], 0, 4, SortOrder.Ascending)).toEqual([1, 5]);
  });

  it('descending sorted', () => {
    expect(getMinMax([5, 4, 3, 2, 1], 0, 4, SortOrder.Descending)).toEqual([1, 5]);
  });

  it('handles nulls in unsorted', () => {
    expect(getMinMax([null, 3, null, 1, null], 0, 4)).toEqual([1, 3]);
  });

  it('all null returns inf/-inf', () => {
    const [mn, mx] = getMinMax([null, null], 0, 1);
    expect(mn).toBe(Infinity);
    expect(mx).toBe(-Infinity);
  });

  it('single element', () => {
    expect(getMinMax([42], 0, 0)).toEqual([42, 42]);
  });

  it('log mode excludes non-positive', () => {
    expect(getMinMax([-1, 0, 2, 3], 0, 3, SortOrder.Unsorted, true)).toEqual([2, 3]);
  });

  it('respects index range', () => {
    expect(getMinMax([10, 2, 3, 20], 1, 2)).toEqual([2, 3]);
  });
});

// ---- roundDec ----
describe('roundDec', () => {
  it('rounds to specified decimals', () => {
    expect(roundDec(1.2345, 2)).toBe(1.23);
    expect(roundDec(1.235, 2)).toBe(1.24);
  });

  it('integers pass through', () => {
    expect(roundDec(5, 3)).toBe(5);
  });

  it('zero decimals rounds to integer', () => {
    expect(roundDec(1.7)).toBe(2);
  });
});

// ---- guessDec ----
describe('guessDec', () => {
  it('counts decimal places', () => {
    expect(guessDec(1.23)).toBe(2);
    expect(guessDec(1.0)).toBe(0);
    expect(guessDec(0.001)).toBe(3);
  });

  it('integers return 0', () => {
    expect(guessDec(42)).toBe(0);
  });
});

// ---- incrRound / incrRoundUp / incrRoundDn ----
describe('incrRound', () => {
  it('rounds to nearest multiple', () => {
    expect(incrRound(7, 5)).toBe(5);
    expect(incrRound(8, 5)).toBe(10);
  });

  it('exact multiples unchanged', () => {
    expect(incrRound(10, 5)).toBe(10);
  });
});

describe('incrRoundUp', () => {
  it('rounds up to nearest multiple', () => {
    expect(incrRoundUp(6, 5)).toBe(10);
    expect(incrRoundUp(10, 5)).toBe(10);
  });
});

describe('incrRoundDn', () => {
  it('rounds down to nearest multiple', () => {
    expect(incrRoundDn(7, 5)).toBe(5);
    expect(incrRoundDn(10, 5)).toBe(10);
  });
});

// ---- genIncrs ----
describe('genIncrs', () => {
  it('generates correct sequence for base 10', () => {
    const incrs = genIncrs(10, 0, 3, [1, 2, 5]);
    expect(incrs).toEqual([1, 2, 5, 10, 20, 50, 100, 200, 500]);
  });

  it('generates decimal increments', () => {
    const incrs = genIncrs(10, -2, 0, [1, 5]);
    expect(incrs).toEqual([0.01, 0.05, 0.1, 0.5]);
  });
});

// ---- clamp ----
describe('clamp', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

// ---- fmtNum ----
describe('fmtNum', () => {
  it('formats numbers with locale separators', () => {
    expect(fmtNum(1234)).toBe('1,234');
  });
});

// ---- hasData ----
describe('hasData', () => {
  it('returns true when non-null data exists', () => {
    expect(hasData([null, 1, null], 0, 2)).toBe(true);
  });

  it('returns false for all null', () => {
    expect(hasData([null, null], 0, 1)).toBe(false);
  });

  it('returns false for empty range', () => {
    expect(hasData([1, 2, 3], 5, 3)).toBe(false);
  });
});

// ---- rangeNum ----
describe('rangeNum', () => {
  it('returns [0, 100] for zero range at zero', () => {
    expect(rangeNum(0, 0, 0.1)).toEqual([0, 100]);
  });

  it('adds padding to normal range', () => {
    const [mn, mx] = rangeNum(0, 10, 0.1, true);
    expect(mn).toBe(0);
    expect(mx).toBe(11);
  });

  it('respects hard limits', () => {
    const cfg = {
      min: { pad: 0.1, soft: null, mode: 0, hard: 0 },
      max: { pad: 0.1, soft: null, mode: 0, hard: 100 },
    };
    const [mn, mx] = rangeNum(-5, 105, cfg);
    expect(mn).toBeGreaterThanOrEqual(0);
    expect(mx).toBeLessThanOrEqual(100);
  });

  it('handles equal min/max with padding', () => {
    const [mn, mx] = rangeNum(5, 5, 0.1);
    expect(mn).toBe(0);
    expect(mx).toBe(10);
  });
});

// ---- rangeLog ----
describe('rangeLog', () => {
  it('expands to full magnitudes base 10', () => {
    const [mn, mx] = rangeLog(3, 800, 10, true);
    expect(mn).toBe(1);
    expect(mx).toBe(1000);
  });

  it('handles equal values', () => {
    const [mn, mx] = rangeLog(100, 100, 10, true);
    expect(mn).toBeLessThan(100);
    expect(mx).toBeGreaterThan(100);
  });

  it('base 2 always uses full magnitudes', () => {
    const [mn, mx] = rangeLog(3, 12, 2, false);
    expect(mn).toBe(2);
    expect(mx).toBe(16);
  });
});

// ---- rangeAsinh ----
describe('rangeAsinh', () => {
  it('preserves zero at min', () => {
    const [mn, mx] = rangeAsinh(0, 100, 10, true);
    expect(mn).toBe(0);
    expect(mx).toBeGreaterThan(0);
  });

  it('preserves zero at max', () => {
    const [mn, mx] = rangeAsinh(-100, 0, 10, true);
    expect(mn).toBeLessThan(0);
    expect(mx).toBe(0);
  });
});

// ---- numIntDigits ----
describe('numIntDigits', () => {
  it('counts integer digits', () => {
    expect(numIntDigits(0)).toBe(1);
    expect(numIntDigits(9)).toBe(1);
    expect(numIntDigits(10)).toBe(2);
    expect(numIntDigits(999)).toBe(3);
    expect(numIntDigits(-99)).toBe(2);
  });
});

// ---- findIncr ----
describe('findIncr', () => {
  it('finds appropriate increment', () => {
    const incrs = [1, 2, 5, 10, 20, 50, 100];
    const [foundIncr, foundSpace] = findIncr(0, 100, incrs, 500, 50);
    expect(foundIncr).toBeGreaterThan(0);
    expect(foundSpace).toBeGreaterThanOrEqual(50);
  });

  it('returns [0, 0] when no increment fits', () => {
    const [incr, space] = findIncr(0, 100, [1], 10, 1000);
    expect(incr).toBe(0);
    expect(space).toBe(0);
  });

  it('returns same increment for small dim changes near boundary', () => {
    const incrs = [1, 2, 5, 10, 25, 50, 100];
    // At dim=400, incr=25 gives foundSpace = 400*25/200 = 50px, exactly at minSpace=50
    // At dim=399, without hysteresis it would drop below 50 and jump to incr=50
    const [incr399] = findIncr(0, 200, incrs, 399, 50);
    const [incr401] = findIncr(0, 200, incrs, 401, 50);
    expect(incr399).toBe(incr401);
  });

  it('returns same increment for wider dim variation (dual y-axis case)', () => {
    // Simulates two y-axes: plot width can vary ~20px between convergence cycles
    const incrs = [1, 2, 2.5, 5, 10, 20, 25, 50, 100];
    const [incr680] = findIncr(0, 240, incrs, 680, 60);
    const [incr700] = findIncr(0, 240, incrs, 700, 60);
    const [incr720] = findIncr(0, 240, incrs, 720, 60);
    expect(incr680).toBe(incr700);
    expect(incr700).toBe(incr720);
  });
});
