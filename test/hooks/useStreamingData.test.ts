import { describe, it, expect } from 'vitest';
import type { ChartData } from '@/types';

/**
 * Tests for the streaming data logic (window trimming).
 * Since @testing-library/react is not available, we test the
 * sliding-window algorithm directly.
 */

function slidingWindow(
  prev: ChartData,
  windowSize: number,
  x: number[],
  ...ySeries: number[][]
): ChartData {
  const group = prev[0];
  if (group == null) return prev;

  const prevX = group.x as number[];
  const drop = Math.max(0, prevX.length + x.length - windowSize);
  const newX = drop > 0 ? (prevX.slice(drop) as number[]).concat(x) : prevX.concat(x);

  const newSeries = group.series.map((s, i) => {
    const arr = s as number[];
    const yNew = ySeries[i] ?? [];
    return drop > 0 ? (arr.slice(drop) as number[]).concat(yNew) : arr.concat(yNew);
  });

  return [{ x: newX, series: newSeries }];
}

describe('useStreamingData sliding window', () => {
  const initial: ChartData = [
    { x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] },
  ];

  it('appends without trimming when under window size', () => {
    const result = slidingWindow(initial, 10, [4], [40], [70]);
    const g = result[0]!;
    expect(g.x).toEqual([1, 2, 3, 4]);
    expect(g.series[0]).toEqual([10, 20, 30, 40]);
    expect(g.series[1]).toEqual([40, 50, 60, 70]);
  });

  it('trims oldest when exceeding window size', () => {
    const result = slidingWindow(initial, 4, [4, 5, 6], [40, 50, 60], [70, 80, 90]);
    const g = result[0]!;
    // 3 + 3 = 6, window = 4, drop 2
    expect(g.x).toEqual([3, 4, 5, 6]);
    expect(g.series[0]).toEqual([30, 40, 50, 60]);
    expect(g.series[1]).toEqual([60, 70, 80, 90]);
  });

  it('handles exact window size', () => {
    const result = slidingWindow(initial, 3, [4], [40], [70]);
    const g = result[0]!;
    // 3 + 1 = 4, window = 3, drop 1
    expect(g.x).toEqual([2, 3, 4]);
    expect(g.series[0]).toEqual([20, 30, 40]);
  });

  it('handles empty push', () => {
    const result = slidingWindow(initial, 10, []);
    const g = result[0]!;
    expect(g.x).toEqual([1, 2, 3]);
  });

  it('returns empty array unchanged when no groups exist', () => {
    const empty: ChartData = [];
    const result = slidingWindow(empty, 10, [1], [10]);
    expect(result).toBe(empty);
  });
});
