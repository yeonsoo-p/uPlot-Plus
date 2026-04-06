import { describe, it, expect } from 'vitest';
import { bars } from '@/paths/bars';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Orientation, Direction } from '@/types';
import { round } from '@/math/utils';
import { getMockCalls } from '../helpers/mockCanvas';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id }), min, max, ori, dir: Direction.Forward };
}

const pxRound = (v: number) => round(v);
const dataX = [0, 1, 2, 3, 4];
const scaleX = makeScale('x', 0, 4);
const scaleY: ScaleState = { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward };

describe('bars path builder', () => {
  const builder = bars();

  it('produces one rect per non-null data point', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    expect(result.fill).toBe(result.stroke);

    const calls = getMockCalls(result.stroke);
    const rects = calls.filter((c) => c[0] === 'rect');
    // 5 non-null data points → 5 rects
    expect(rects.length).toBe(5);
  });

  it('skips null values — fewer rects than data points', () => {
    const dataY: (number | null)[] = [10, null, 30, null, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const rects = getMockCalls(result.stroke).filter((c) => c[0] === 'rect');
    // Only 3 non-null values → 3 rects
    expect(rects.length).toBe(3);
  });

  it('barWidth option produces narrower bars', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const defaultResult = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const narrowResult = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { barWidth: 0.3 });

    const defaultRects = getMockCalls(defaultResult.stroke).filter((c) => c[0] === 'rect');
    const narrowRects = getMockCalls(narrowResult.stroke).filter((c) => c[0] === 'rect');

    // Both have same number of rects
    expect(narrowRects.length).toBe(defaultRects.length);
    // Narrow bars should have smaller width (3rd arg to rect for horizontal)
    const defaultWidth = defaultRects[0]![3];
    const narrowWidth = narrowRects[0]![3];
    expect(narrowWidth).toBeLessThan(defaultWidth);
  });

  it('barRadius option uses moveTo/lineTo/arc instead of rect', () => {
    const dataY: (number | null)[] = [10, 40, 30, 80, 50];
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { barRadius: 0.3 });
    const calls = getMockCalls(result.stroke);
    // With radius, bars use moveTo/lineTo/arc/closePath instead of rect
    const arcs = calls.filter((c) => c[0] === 'arc');
    expect(arcs.length).toBeGreaterThan(0);
    // No rect calls when radius is used
    const rects = calls.filter((c) => c[0] === 'rect');
    expect(rects.length).toBe(0);
  });

  it('handles negative values — bars extend in both directions from baseline', () => {
    const scaleYNeg: ScaleState = { ...makeScale('y', -50, 50), ori: Orientation.Vertical, dir: Direction.Forward };
    const dataY: (number | null)[] = [10, -20, 30, -40, 50];
    const result = builder(dataX, dataY, scaleX, scaleYNeg, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const rects = getMockCalls(result.stroke).filter((c) => c[0] === 'rect');
    expect(rects.length).toBe(5);
    // All rects should have positive height (4th arg)
    for (const r of rects) {
      expect(r[4]).toBeGreaterThan(0);
    }
  });

  it('handles single bar', () => {
    const result = builder([5], [50], scaleX, scaleY, 400, 300, 0, 0, 0, 0, 1, pxRound);
    const calls = getMockCalls(result.stroke);
    const rects = calls.filter((c) => c[0] === 'rect');
    expect(rects.length).toBe(1);
  });

  it('fillToData shifts bar baselines per data point', () => {
    const dataY: (number | null)[] = [50, 80, 60, 90, 70];
    const baseline = [10, 30, 20, 40, 25];
    const resultWithBaseline = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { fillToData: baseline });
    const resultWithout = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);

    const rectsWithBaseline = getMockCalls(resultWithBaseline.stroke).filter((c) => c[0] === 'rect');
    const rectsWithout = getMockCalls(resultWithout.stroke).filter((c) => c[0] === 'rect');

    // Same number of bars
    expect(rectsWithBaseline.length).toBe(rectsWithout.length);
    // Bar heights should differ (baseline shifts the bottom)
    expect(rectsWithBaseline[0]![4]).not.toBe(rectsWithout[0]![4]);
  });

  it('fillToData with null baseline falls back to fillTo for that point', () => {
    const dataY: (number | null)[] = [50, 80, 60];
    const baseline: (number | null)[] = [10, null, 20];
    const result = builder([0, 1, 2], dataY, makeScale('x', 0, 2), scaleY, 300, 300, 0, 0, 0, 2, 1, pxRound, { fillToData: baseline });

    const rects = getMockCalls(result.stroke).filter((c) => c[0] === 'rect');
    // All 3 bars should still render
    expect(rects.length).toBe(3);
  });
});
