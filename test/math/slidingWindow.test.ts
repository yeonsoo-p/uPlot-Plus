import { describe, it, expect } from 'vitest';
import type { ChartData } from '@/types';

/**
 * Tests for the sliding-window algorithm used by streaming data logic.
 */

function slidingWindow(
  prev: ChartData,
  windowSize: number,
  groupIdx: number,
  x: number[],
  ...ySeries: number[][]
): ChartData {
  const group = prev[groupIdx];
  if (group == null) return prev;

  const prevX = Array.from(group.x);
  const drop = Math.max(0, prevX.length + x.length - windowSize);
  const newX = drop > 0 ? prevX.slice(drop).concat(x) : prevX.concat(x);

  const newSeries = group.series.map((s, i) => {
    const arr = Array.from(s);
    const yNew = ySeries[i] ?? [];
    return drop > 0 ? arr.slice(drop).concat(yNew) : arr.concat(yNew);
  });

  const next = prev.slice();
  next[groupIdx] = { x: newX, series: newSeries };
  return next;
}

/** Convenience wrapper for group 0 (matches the hook's push() signature) */
function slidingWindowGroup0(
  prev: ChartData,
  windowSize: number,
  x: number[],
  ...ySeries: number[][]
): ChartData {
  return slidingWindow(prev, windowSize, 0, x, ...ySeries);
}

describe('slidingWindow', () => {
  const initial: ChartData = [
    { x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] },
  ];

  it('appends without trimming when under window size', () => {
    const result = slidingWindowGroup0(initial, 10, [4], [40], [70]);
    const g = result[0]!;
    expect(g.x).toEqual([1, 2, 3, 4]);
    expect(g.series[0]).toEqual([10, 20, 30, 40]);
    expect(g.series[1]).toEqual([40, 50, 60, 70]);
  });

  it('trims oldest when exceeding window size', () => {
    const result = slidingWindowGroup0(initial, 4, [4, 5, 6], [40, 50, 60], [70, 80, 90]);
    const g = result[0]!;
    // 3 + 3 = 6, window = 4, drop 2
    expect(g.x).toEqual([3, 4, 5, 6]);
    expect(g.series[0]).toEqual([30, 40, 50, 60]);
    expect(g.series[1]).toEqual([60, 70, 80, 90]);
  });

  it('handles exact window size', () => {
    const result = slidingWindowGroup0(initial, 3, [4], [40], [70]);
    const g = result[0]!;
    // 3 + 1 = 4, window = 3, drop 1
    expect(g.x).toEqual([2, 3, 4]);
    expect(g.series[0]).toEqual([20, 30, 40]);
  });

  it('handles empty push', () => {
    const result = slidingWindowGroup0(initial, 10, []);
    const g = result[0]!;
    expect(g.x).toEqual([1, 2, 3]);
  });

  it('returns empty array unchanged when no groups exist', () => {
    const empty: ChartData = [];
    const result = slidingWindowGroup0(empty, 10, [1], [10]);
    expect(result).toBe(empty);
  });
});

describe('slidingWindow multi-group', () => {
  const multiGroup: ChartData = [
    { x: [1, 2, 3], series: [[10, 20, 30]] },
    { x: [100, 200, 300], series: [[1000, 2000, 3000]] },
  ];

  it('streaming into group 0 preserves group 1', () => {
    const result = slidingWindow(multiGroup, 4, 0, [4], [40]);
    expect(result[0]!.x).toEqual([1, 2, 3, 4]);
    expect(result[0]!.series[0]).toEqual([10, 20, 30, 40]);
    // group 1 unchanged
    expect(result[1]).toBe(multiGroup[1]);
  });

  it('streaming into group 1 preserves group 0', () => {
    const result = slidingWindow(multiGroup, 4, 1, [400], [4000]);
    // group 0 unchanged
    expect(result[0]).toBe(multiGroup[0]);
    expect(result[1]!.x).toEqual([100, 200, 300, 400]);
    expect(result[1]!.series[0]).toEqual([1000, 2000, 3000, 4000]);
  });

  it('trims group 1 independently of group 0', () => {
    const result = slidingWindow(multiGroup, 3, 1, [400, 500], [4000, 5000]);
    // group 0 unchanged
    expect(result[0]).toBe(multiGroup[0]);
    // group 1: 3 + 2 = 5, window = 3, drop 2
    expect(result[1]!.x).toEqual([300, 400, 500]);
    expect(result[1]!.series[0]).toEqual([3000, 4000, 5000]);
  });

  it('returns data unchanged for out-of-bounds group index', () => {
    const result = slidingWindow(multiGroup, 10, 5, [1], [1]);
    expect(result).toBe(multiGroup);
  });
});
