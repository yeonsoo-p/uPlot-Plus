import { describe, it, expect } from 'vitest';
import { bars } from '@/paths/bars';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { round } from '@/math/utils';

function makeScale(id: string, min: number, max: number, ori: 0 | 1 = 0): ScaleState {
  return { ...createScaleState({ id }), min, max, ori, dir: 1 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCalls(path: Path2D): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (path as any)._calls;
}

const pxRound = (v: number) => round(v);
const dataX = [0, 1, 2, 3, 4];
const scaleX = makeScale('x', 0, 4);
const scaleY: ScaleState = { ...makeScale('y', 0, 100), ori: 1, dir: 1 };

describe('bars path builder', () => {
  const builder = bars();

  it('produces one rect per non-null data point', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    expect(result.fill).toBe(result.stroke);

    const calls = getCalls(result.stroke);
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    // 5 non-null data points → 5 rects
    expect(rects.length).toBe(5);
  });

  it('skips null values — fewer rects than data points', () => {
    const dataY: (number | null)[] = [10, null, 30, null, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const rects = getCalls(result.stroke).filter((c: string[]) => c[0] === 'rect');
    // Only 3 non-null values → 3 rects
    expect(rects.length).toBe(3);
  });

  it('barWidth option produces narrower bars', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const defaultResult = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const narrowResult = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { barWidth: 0.3 });

    const defaultRects = getCalls(defaultResult.stroke).filter((c: string[]) => c[0] === 'rect');
    const narrowRects = getCalls(narrowResult.stroke).filter((c: string[]) => c[0] === 'rect');

    // Both have same number of rects
    expect(narrowRects.length).toBe(defaultRects.length);
    // Narrow bars should have smaller width (3rd arg to rect for horizontal)
    const defaultWidth = defaultRects[0]![3] as number;
    const narrowWidth = narrowRects[0]![3] as number;
    expect(narrowWidth).toBeLessThan(defaultWidth);
  });

  it('barRadius option uses moveTo/lineTo/arc instead of rect', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { barRadius: 0.3 });
    const calls = getCalls(result.stroke);
    // With radius, bars use moveTo/lineTo/arc/closePath instead of rect
    const arcs = calls.filter((c: string[]) => c[0] === 'arc');
    expect(arcs.length).toBeGreaterThan(0);
    // No rect calls when radius is used
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    expect(rects.length).toBe(0);
  });

  it('handles negative values — bars extend in both directions from baseline', () => {
    const scaleYNeg: ScaleState = { ...makeScale('y', -50, 50), ori: 1, dir: 1 };
    const dataY: (number | null)[] = [10, -20, 30, -40, 50];
    const result = builder(dataX, dataY, scaleX, scaleYNeg, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const rects = getCalls(result.stroke).filter((c: string[]) => c[0] === 'rect');
    expect(rects.length).toBe(5);
    // All rects should have positive height (4th arg)
    for (const r of rects) {
      expect(r[4] as number).toBeGreaterThan(0);
    }
  });

  it('handles single bar', () => {
    const result = builder([5], [50], scaleX, scaleY, 400, 300, 0, 0, 0, 0, 1, pxRound);
    const calls = getCalls(result.stroke);
    const rects = calls.filter((c: string[]) => c[0] === 'rect');
    expect(rects.length).toBe(1);
  });
});
