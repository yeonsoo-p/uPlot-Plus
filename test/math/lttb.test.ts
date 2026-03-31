import { describe, it, expect } from 'vitest';
import { lttb, lttbGroup } from '@/math/lttb';
import type { XGroup } from '@/types/data';

describe('lttb', () => {
  it('returns identity when data fits within target', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 20, 30, 40, 50];
    const result = lttb(x, y, 10);

    expect(result.indices).toEqual(new Uint32Array([0, 1, 2, 3, 4]));
    expect(result.x).toEqual(new Float64Array([1, 2, 3, 4, 5]));
    expect(result.y).toEqual([10, 20, 30, 40, 50]);
  });

  it('returns identity when target equals data length', () => {
    const x = [1, 2, 3];
    const y = [10, 20, 30];
    const result = lttb(x, y, 3);

    expect(result.indices.length).toBe(3);
  });

  it('always keeps first and last points', () => {
    const x = Array.from({ length: 100 }, (_, i) => i);
    const y = Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.1));
    const result = lttb(x, y, 10);

    expect(result.indices[0]).toBe(0);
    expect(result.indices[result.indices.length - 1]).toBe(99);
    expect(result.x[0]).toBe(0);
    expect(result.x[result.x.length - 1]).toBe(99);
  });

  it('produces exactly targetPoints output points', () => {
    const n = 1000;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = Array.from({ length: n }, (_, i) => Math.sin(i * 0.01) * 100);
    const result = lttb(x, y, 50);

    expect(result.indices.length).toBe(50);
    expect(result.x.length).toBe(50);
    expect(result.y.length).toBe(50);
  });

  it('indices are in ascending order', () => {
    const n = 500;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = Array.from({ length: n }, (_, i) => Math.random() * 100);
    const result = lttb(x, y, 20);

    for (let i = 1; i < result.indices.length; i++) {
      expect(result.indices[i]).toBeGreaterThan(result.indices[i - 1]!);
    }
  });

  it('preserves peaks in sine wave', () => {
    // Create a sine wave with known peaks
    const n = 1000;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = Array.from({ length: n }, (_, i) => Math.sin(i * 2 * Math.PI / 100) * 100);

    const result = lttb(x, y, 50);

    // The global max and min should be among the selected points
    const selectedY = result.y as number[];
    const maxSelected = Math.max(...selectedY);
    const minSelected = Math.min(...selectedY);

    // Should capture most of the range
    expect(maxSelected).toBeGreaterThan(90);
    expect(minSelected).toBeLessThan(-90);
  });

  it('handles null gaps — splits into runs', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const y: (number | null)[] = [
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
      null, null,
      10, 20, 30, 40, 50, 60, 70, 80,
    ];
    const result = lttb(x, y, 8);

    // Should not contain null in output y values
    expect(result.y.every(v => v != null)).toBe(true);
    // Should have <= 8 points total
    expect(result.indices.length).toBeLessThanOrEqual(8);
  });

  it('returns empty for all-null data', () => {
    const x = [1, 2, 3, 4, 5];
    const y: (number | null)[] = [null, null, null, null, null];
    const result = lttb(x, y, 3);

    expect(result.indices.length).toBe(0);
    expect(result.x.length).toBe(0);
    expect(result.y.length).toBe(0);
  });

  it('handles single non-null point', () => {
    const x = [1, 2, 3];
    const y: (number | null)[] = [null, 42, null];
    const result = lttb(x, y, 2);

    expect(result.indices.length).toBe(1);
    expect(result.y[0]).toBe(42);
  });

  it('works with Float64Array input', () => {
    const x = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const y = new Float64Array([10, 20, 15, 25, 30, 5, 35, 20, 40, 10]);
    const result = lttb(x, y, 5);

    expect(result.indices.length).toBe(5);
    expect(result.x).toBeInstanceOf(Float64Array);
  });

  it('clamps target to minimum of 2', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const result = lttb(x, y, 1);

    expect(result.indices.length).toBe(2);
    expect(result.indices[0]).toBe(0);
    expect(result.indices[1]).toBe(9);
  });

  it('triangle area selection prefers visually significant points', () => {
    // Flat line with one spike — LTTB should select the spike
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = Array.from({ length: n }, () => 50);
    y[50] = 200; // spike

    const result = lttb(x, y, 5);
    const selectedIndices = Array.from(result.indices);

    expect(selectedIndices).toContain(50);
  });
});

describe('lttbGroup', () => {
  function makeGroup(x: number[], series: (number | null)[][]): XGroup {
    return { x, series };
  }

  it('returns original group when data fits within target', () => {
    const group = makeGroup([1, 2, 3], [[10, 20, 30], [40, 50, 60]]);
    const result = lttbGroup(group, 10);

    expect(result).toBe(group); // same reference — no copy
  });

  it('downsamples preserving x-alignment across series', () => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const s1 = Array.from({ length: n }, (_, i) => Math.sin(i * 0.05) * 100);
    const s2 = Array.from({ length: n }, (_, i) => Math.cos(i * 0.05) * 100);
    const group = makeGroup(x, [s1, s2]);

    const result = lttbGroup(group, 30);

    // Both series have the same length (aligned)
    expect(result.x.length).toBe(result.series[0]!.length);
    expect(result.x.length).toBe(result.series[1]!.length);

    // Union of indices may exceed individual target but both are aligned
    expect(result.x.length).toBeGreaterThanOrEqual(30);
    expect(result.x.length).toBeLessThanOrEqual(n);
  });

  it('x values are sorted ascending', () => {
    const n = 500;
    const x = Array.from({ length: n }, (_, i) => i * 0.5);
    const s1 = Array.from({ length: n }, (_, i) => Math.random() * 100);
    const group = makeGroup(x, [s1]);

    const result = lttbGroup(group, 30);

    for (let i = 1; i < result.x.length; i++) {
      expect(result.x[i]).toBeGreaterThanOrEqual(result.x[i - 1]!);
    }
  });

  it('preserves null values in nullable series', () => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const s1: (number | null)[] = Array.from({ length: n }, (_, i) =>
      i >= 40 && i <= 60 ? null : Math.sin(i * 0.1) * 50,
    );
    const group = makeGroup(x, [s1]);

    const result = lttbGroup(group, 20);

    // Nulls in original data should map to nulls in result
    for (let i = 0; i < result.x.length; i++) {
      const origIdx = Array.from(group.x).indexOf(result.x[i] as number);
      if (origIdx >= 0 && s1[origIdx] === null) {
        expect(result.series[0]![i]).toBeNull();
      }
    }
  });
});
