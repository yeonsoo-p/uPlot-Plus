import { describe, it, expect } from 'vitest';
import { normalizeData } from '@/core/normalizeData';

describe('normalizeData', () => {
  describe('SimpleGroup (single object)', () => {
    it('converts { x, y } to single XGroup with one series', () => {
      const result = normalizeData({ x: [1, 2, 3], y: [10, 20, 30] });
      expect(result).toHaveLength(1);
      expect(result[0]!.x).toBeInstanceOf(Float64Array);
      expect(Array.from(result[0]!.x)).toEqual([1, 2, 3]);
      expect(result[0]!.series).toHaveLength(1);
      expect(result[0]!.series[0]).toBeInstanceOf(Float64Array);
      expect(Array.from(result[0]!.series[0]!)).toEqual([10, 20, 30]);
    });

    it('passes through Float64Array x without copy', () => {
      const x = new Float64Array([1, 2, 3]);
      const result = normalizeData({ x, y: [10, 20, 30] });
      expect(result[0]!.x).toBe(x); // same reference
    });

    it('passes through Float64Array y without copy', () => {
      const y = new Float64Array([10, 20, 30]);
      const result = normalizeData({ x: [1, 2, 3], y });
      expect(result[0]!.series[0]).toBe(y); // same reference
    });

    it('keeps y as (number|null)[] when it contains nulls', () => {
      const y = [10, null, 30];
      const result = normalizeData({ x: [1, 2, 3], y });
      expect(result[0]!.series[0]).not.toBeInstanceOf(Float64Array);
      expect(result[0]!.series[0]).toEqual([10, null, 30]);
    });
  });

  describe('SimpleGroup[] (array of {x, y})', () => {
    it('converts [{x,y}, {x,y}] to two XGroups', () => {
      const result = normalizeData([
        { x: [1, 2], y: [10, 20] },
        { x: [3, 4], y: [30, 40] },
      ]);
      expect(result).toHaveLength(2);
      expect(Array.from(result[0]!.x)).toEqual([1, 2]);
      expect(Array.from(result[1]!.x)).toEqual([3, 4]);
      expect(result[0]!.series).toHaveLength(1);
      expect(result[1]!.series).toHaveLength(1);
    });
  });

  describe('FullGroup[] (array of {x, series})', () => {
    it('converts [{x, series}] to XGroups', () => {
      const result = normalizeData([
        { x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]!.x).toBeInstanceOf(Float64Array);
      expect(result[0]!.series).toHaveLength(2);
      expect(result[0]!.series[0]).toBeInstanceOf(Float64Array);
      expect(result[0]!.series[1]).toBeInstanceOf(Float64Array);
    });

    it('handles mixed null/non-null series in same group', () => {
      const result = normalizeData([
        { x: [1, 2, 3], series: [[10, 20, 30], [null, 50, null]] },
      ]);
      expect(result[0]!.series[0]).toBeInstanceOf(Float64Array);
      expect(result[0]!.series[1]).not.toBeInstanceOf(Float64Array);
      expect(result[0]!.series[1]).toEqual([null, 50, null]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      expect(normalizeData([] as never)).toEqual([]);
    });

    it('promotes number[] x to Float64Array', () => {
      const result = normalizeData({ x: [1, 2, 3], y: [10, 20, 30] });
      expect(result[0]!.x).toBeInstanceOf(Float64Array);
    });

    it('promotes number[] y (no nulls) to Float64Array', () => {
      const result = normalizeData({ x: [1, 2], y: [10, 20] });
      expect(result[0]!.series[0]).toBeInstanceOf(Float64Array);
    });

    it('filters corresponding y-values when x contains nulls (SimpleGroup)', () => {
      const result = normalizeData({ x: [1, null, 3], y: [10, 20, 30] });
      expect(result[0]!.x.length).toBe(2);
      expect(Array.from(result[0]!.x)).toEqual([1, 3]);
      expect(result[0]!.series[0]!.length).toBe(2);
      expect(Array.from(result[0]!.series[0]!)).toEqual([10, 30]);
    });

    it('filters y-values across multiple series in FullGroup when x has nulls', () => {
      const result = normalizeData([
        { x: [1, null, 3, null, 5], series: [[10, 20, 30, 40, 50], [null, 2, null, 4, 5]] },
      ]);
      expect(result[0]!.x.length).toBe(3);
      expect(Array.from(result[0]!.x)).toEqual([1, 3, 5]);
      expect(result[0]!.series[0]!.length).toBe(3);
      expect(Array.from(result[0]!.series[0]!)).toEqual([10, 30, 50]);
      expect(result[0]!.series[1]!.length).toBe(3);
      expect(Array.from(result[0]!.series[1]!)).toEqual([null, null, 5]);
    });

    it('preserves y-series with nulls as plain arrays after x-null filtering', () => {
      const result = normalizeData({ x: [1, null, 3], y: [null, 20, 30] });
      // y had nulls → stays as plain array, but filtered to indices 0 and 2
      expect(result[0]!.series[0]).not.toBeInstanceOf(Float64Array);
      expect(result[0]!.series[0]).toEqual([null, 30]);
    });
  });
});
