import { describe, it, expect } from 'vitest';
import { asinhAxisSplits, logAxisValFilter } from '@/axes/ticks';

describe('asinhAxisSplits', () => {
  it('produces zero for a zero-range scale', () => {
    const splits = asinhAxisSplits(0, 0);
    expect(splits).toEqual([0]);
  });

  it('produces symmetric ticks around zero', () => {
    const splits = asinhAxisSplits(-100, 100);
    expect(splits).toContain(0);

    // Should have both negative and positive values
    const negatives = splits.filter(s => s < 0);
    const positives = splits.filter(s => s > 0);
    expect(negatives.length).toBeGreaterThan(0);
    expect(positives.length).toBeGreaterThan(0);
  });

  it('includes powers of 10 for positive range', () => {
    const splits = asinhAxisSplits(0, 10000);
    expect(splits).toContain(0);
    expect(splits).toContain(1);
    expect(splits).toContain(10);
    expect(splits).toContain(100);
    expect(splits).toContain(1000);
    expect(splits).toContain(10000);
  });

  it('includes negative powers of 10 for negative range', () => {
    const splits = asinhAxisSplits(-10000, 0);
    expect(splits).toContain(0);
    expect(splits).toContain(-1);
    expect(splits).toContain(-10);
    expect(splits).toContain(-100);
    expect(splits).toContain(-1000);
    expect(splits).toContain(-10000);
  });

  it('returns sorted unique values', () => {
    const splits = asinhAxisSplits(-1000, 1000);
    for (let i = 1; i < splits.length; i++) {
      expect(splits[i]).toBeGreaterThan(splits[i - 1]!);
    }
  });

  it('respects custom linthresh', () => {
    const splitsDefault = asinhAxisSplits(0, 1000, 1);
    const splitsHighThresh = asinhAxisSplits(0, 1000, 10);
    // Higher threshold means the linear zone extends further,
    // so the first logarithmic tick starts at a higher value
    expect(splitsHighThresh).toContain(10);
  });

  it('handles purely positive range', () => {
    const splits = asinhAxisSplits(10, 10000);
    expect(splits).not.toContain(0);
    expect(splits.every(s => s >= 10)).toBe(true);
  });

  it('handles purely negative range', () => {
    const splits = asinhAxisSplits(-10000, -10);
    expect(splits).not.toContain(0);
    expect(splits.every(s => s <= -10)).toBe(true);
  });
});

describe('logAxisValFilter', () => {
  it('marks powers of 10 as visible for base-10', () => {
    const splits = [1, 2, 3, 5, 10, 20, 50, 100];
    const filter = logAxisValFilter(splits, 10);
    // 1, 10, 100 are powers of 10
    expect(filter[0]).toBe(true);  // 1 = 10^0
    expect(filter[1]).toBe(false); // 2
    expect(filter[2]).toBe(false); // 3
    expect(filter[3]).toBe(false); // 5
    expect(filter[4]).toBe(true);  // 10 = 10^1
    expect(filter[5]).toBe(false); // 20
    expect(filter[6]).toBe(false); // 50
    expect(filter[7]).toBe(true);  // 100 = 10^2
  });

  it('marks powers of 2 as visible for base-2', () => {
    const splits = [1, 2, 3, 4, 8, 16];
    const filter = logAxisValFilter(splits, 2);
    expect(filter[0]).toBe(true);  // 1 = 2^0
    expect(filter[1]).toBe(true);  // 2 = 2^1
    expect(filter[2]).toBe(false); // 3
    expect(filter[3]).toBe(true);  // 4 = 2^2
    expect(filter[4]).toBe(true);  // 8 = 2^3
    expect(filter[5]).toBe(true);  // 16 = 2^4
  });

  it('keeps zero visible', () => {
    const filter = logAxisValFilter([0, 1, 10], 10);
    expect(filter[0]).toBe(true);
  });

  it('rejects negative values', () => {
    const filter = logAxisValFilter([-10, -1, 1, 10], 10);
    expect(filter[0]).toBe(false);
    expect(filter[1]).toBe(false);
  });

  it('handles empty array', () => {
    const filter = logAxisValFilter([], 10);
    expect(filter).toEqual([]);
  });
});
