import { describe, it, expect } from 'vitest';
import { findGaps, clipGaps, lineToH, lineToV } from '@/paths/utils';
import { createScaleState, valToPos } from '@/core/Scale';
import { Orientation } from '@/types';

/** Helper to extract recorded calls from Path2D mock */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCalls(path: Path2D): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (path as any)._calls;
}

// ---- lineToH / lineToV ----
describe('lineToH / lineToV', () => {
  it('lineToH calls lineTo(x, y) in original order', () => {
    const path = new Path2D();
    lineToH(path, 10, 20);
    const calls = getCalls(path);
    expect(calls).toEqual([['lineTo', 10, 20]]);
  });

  it('lineToV swaps args: lineTo(x, y) becomes lineTo(second, first)', () => {
    const path = new Path2D();
    lineToV(path, 10, 20);
    const calls = getCalls(path);
    // lineToV(path, y, x) calls path.lineTo(x, y) — args are swapped
    expect(calls).toEqual([['lineTo', 20, 10]]);
  });
});

// ---- findGaps ----
describe('findGaps', () => {
  const makePixelForX = (xArr: number[]) => {
    const scale = { ...createScaleState({ id: 'x' }), min: xArr[0]!, max: xArr[xArr.length - 1]! };
    return (val: number) => valToPos(val, scale, 500, 0);
  };

  it('no gaps when all data present', () => {
    const dataX = [0, 1, 2, 3, 4];
    const dataY: (number | null)[] = [10, 20, 30, 40, 50];
    const gaps = findGaps(dataX, dataY, 0, 4, 1, makePixelForX(dataX));
    expect(gaps).toEqual([]);
  });

  it('detects single gap', () => {
    const dataX = [0, 1, 2, 3, 4];
    const dataY: (number | null)[] = [10, 20, null, 40, 50];
    const gaps = findGaps(dataX, dataY, 0, 4, 1, makePixelForX(dataX));
    expect(gaps.length).toBe(1);
    expect(gaps[0]![0]).toBeLessThan(gaps[0]![1]);
  });

  it('detects multiple gaps', () => {
    const dataX = [0, 1, 2, 3, 4, 5, 6];
    const dataY: (number | null)[] = [10, null, 30, null, null, 60, 70];
    const gaps = findGaps(dataX, dataY, 0, 6, 1, makePixelForX(dataX));
    expect(gaps.length).toBe(2);
  });

  it('handles gap at start', () => {
    const dataX = [0, 1, 2, 3];
    const dataY: (number | null)[] = [null, null, 30, 40];
    const gaps = findGaps(dataX, dataY, 0, 3, 1, makePixelForX(dataX));
    expect(gaps.length).toBe(1);
  });

  it('handles gap at end', () => {
    const dataX = [0, 1, 2, 3];
    const dataY: (number | null)[] = [10, 20, null, null];
    const gaps = findGaps(dataX, dataY, 0, 3, 1, makePixelForX(dataX));
    expect(gaps.length).toBe(1);
  });

  it('all null is one gap', () => {
    const dataX = [0, 1, 2];
    const dataY: (number | null)[] = [null, null, null];
    const gaps = findGaps(dataX, dataY, 0, 2, 1, makePixelForX(dataX));
    expect(gaps.length).toBe(1);
  });
});

// ---- clipGaps ----
describe('clipGaps', () => {
  it('creates clip rects excluding gap regions for horizontal', () => {
    const gaps: [number, number][] = [[100, 200]];
    const clip = clipGaps(gaps, Orientation.Horizontal, 0, 0, 500, 300);
    const calls = getCalls(clip);
    // Should create 2 rects: [0..100] and [200..500]
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    expect(rects.length).toBe(2);
    // First rect: from 0 to gap start (100), full height
    expect(rects[0]).toEqual(['rect', 0, 0, 100, 300]);
    // Second rect: from gap end (200) to dim end (500), full height
    expect(rects[1]).toEqual(['rect', 200, 0, 300, 300]);
  });

  it('creates clip rects for vertical orientation', () => {
    const gaps: [number, number][] = [[50, 150]];
    const clip = clipGaps(gaps, Orientation.Vertical, 0, 0, 300, 500);
    const calls = getCalls(clip);
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    expect(rects.length).toBe(2);
    // Vertical: rect(crossOff, prevEnd, crossDim, gapStart - prevEnd)
    expect(rects[0]).toEqual(['rect', 0, 0, 300, 50]);
    // rect(crossOff, gapEnd, crossDim, dimEnd - gapEnd)
    expect(rects[1]).toEqual(['rect', 0, 150, 300, 350]);
  });

  it('handles empty gaps array — single rect covering full area', () => {
    const clip = clipGaps([], Orientation.Horizontal, 0, 0, 500, 300);
    const calls = getCalls(clip);
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    // No gaps → one rect covering the entire dimension
    expect(rects.length).toBe(1);
    expect(rects[0]).toEqual(['rect', 0, 0, 500, 300]);
  });

  it('handles multiple gaps', () => {
    const gaps: [number, number][] = [[50, 100], [200, 250], [400, 450]];
    const clip = clipGaps(gaps, Orientation.Horizontal, 0, 0, 500, 300);
    const calls = getCalls(clip);
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    // 3 gaps → 4 visible rects: [0,50], [100,200], [250,400], [450,500]
    expect(rects.length).toBe(4);
    expect(rects[0]).toEqual(['rect', 0, 0, 50, 300]);
    expect(rects[1]).toEqual(['rect', 100, 0, 100, 300]);
    expect(rects[2]).toEqual(['rect', 250, 0, 150, 300]);
    expect(rects[3]).toEqual(['rect', 450, 0, 50, 300]);
  });
});
