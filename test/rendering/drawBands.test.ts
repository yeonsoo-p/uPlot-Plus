import { describe, it, expect } from 'vitest';
import { buildBandPath } from '@/rendering/drawBands';
import { createScaleState } from '@/core/Scale';
import type { ScaleState, BBox } from '@/types';
import { getMockCalls } from '../helpers/mockCanvas';
import type { PathCall } from '../setup';

function getCalls(path: Path2D): PathCall[] {
  return getMockCalls(path);
}

function makeScales(): { xScale: ScaleState; yScale: ScaleState; plotBox: BBox } {
  const xScale = createScaleState({ id: 'x', min: 0, max: 4 });
  const yScale = createScaleState({ id: 'y', min: 0, max: 10 });
  const plotBox: BBox = { left: 0, top: 0, width: 100, height: 100 };
  return { xScale, yScale, plotBox };
}

describe('buildBandPath', () => {
  const dataX = [0, 1, 2, 3, 4];

  it('dir=0 fills full region between upper and lower', () => {
    const upper = [8, 8, 8, 8, 8];
    const lower = [2, 2, 2, 2, 2];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 0);
    expect(path).not.toBeNull();

    const calls = getCalls(path!);
    // Should have moveTo, lineTo... for upper, then lineTo... for lower, then closePath
    expect(calls[0]?.[0]).toBe('moveTo');
    expect(calls[calls.length - 1]?.[0]).toBe('closePath');
  });

  it('dir=1 only fills where upper > lower', () => {
    // Upper is above lower only at indices 2-3
    const upper = [2, 2, 8, 8, 2];
    const lower = [5, 5, 3, 3, 5];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 1);
    expect(path).not.toBeNull();

    const calls = getCalls(path!);
    // Should have segments only where upper > lower
    expect(calls.some(c => c[0] === 'moveTo')).toBe(true);
    expect(calls.some(c => c[0] === 'closePath')).toBe(true);
  });

  it('dir=1 returns null when upper is always below lower', () => {
    const upper = [2, 2, 2, 2, 2];
    const lower = [8, 8, 8, 8, 8];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 1);
    expect(path).toBeNull();
  });

  it('dir=-1 only fills where lower > upper', () => {
    // Lower is above upper only at indices 0-1 and 4
    const upper = [2, 2, 8, 8, 2];
    const lower = [5, 5, 3, 3, 5];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, -1);
    expect(path).not.toBeNull();
  });

  it('dir=-1 returns null when lower is always below upper', () => {
    const upper = [8, 8, 8, 8, 8];
    const lower = [2, 2, 2, 2, 2];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, -1);
    expect(path).toBeNull();
  });

  it('returns null when both series are all-null', () => {
    const upper = [null, null, null, null, null];
    const lower = [null, null, null, null, null];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 0);
    expect(path).toBeNull();
  });

  it('returns null for invalid range (i0 > i1)', () => {
    const upper = [8, 8, 8, 8, 8];
    const lower = [2, 2, 2, 2, 2];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 3, 1, 0);
    expect(path).toBeNull();
  });

  it('splits into separate sub-paths at null gaps in dir=0', () => {
    // Gap in upper at index 2 — should produce two segments: [0,1] and [3,4]
    const upper: (number | null)[] = [8, 8, null, 8, 8];
    const lower: (number | null)[] = [2, 2, 2, 2, 2];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 0);
    expect(path).not.toBeNull();

    const calls = getCalls(path!);
    const moveTos = calls.filter(c => c[0] === 'moveTo');
    const closePaths = calls.filter(c => c[0] === 'closePath');
    expect(moveTos.length).toBe(2);
    expect(closePaths.length).toBe(2);
  });

  it('returns null when upper and lower have staggered nulls (no overlap)', () => {
    const upper: (number | null)[] = [8, null, 8, null, 8];
    const lower: (number | null)[] = [null, 2, null, 2, null];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 0);
    expect(path).toBeNull();
  });

  it('produces single-point sub-paths for isolated valid indices in dir=0', () => {
    // Only indices 0 and 4 have both upper and lower valid
    const upper: (number | null)[] = [8, null, 8, null, 8];
    const lower: (number | null)[] = [2, 2, null, 2, 2];
    const { xScale, yScale, plotBox } = makeScales();

    const path = buildBandPath(dataX, upper, lower, xScale, yScale, plotBox, 1, 0, 4, 0);
    expect(path).not.toBeNull();
  });
});
