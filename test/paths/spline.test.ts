import { describe, it, expect } from 'vitest';
import { monotoneCubic } from '@/paths/monotoneCubic';
import { catmullRom } from '@/paths/catmullRom';
import { points } from '@/paths/points';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Orientation, Direction } from '@/types';
import { round } from '@/math/utils';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id }), min, max, ori, dir: Direction.Forward };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCalls(path: Path2D): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (path as any)._calls;
}

const pxRound = (v: number) => round(v);
const dataX = [0, 1, 2, 3, 4, 5];
const dataY: (number | null)[] = [10, 40, 20, 60, 30, 50];
const scaleX = makeScale('x', 0, 5);
const scaleY: ScaleState = { ...makeScale('y', 0, 60), ori: Orientation.Vertical, dir: Direction.Forward };

describe('monotoneCubic path builder', () => {
  const builder = monotoneCubic();

  it('produces bezierCurveTo calls for smooth curves', () => {
    const result = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    expect(result.stroke).toBeInstanceOf(Path2D);
    expect(result.fill).toBeInstanceOf(Path2D);

    const calls = getCalls(result.stroke);
    const beziers = calls.filter((c: string[]) => c[0] === 'bezierCurveTo');
    // 6 points → 5 bezier segments
    expect(beziers.length).toBe(5);
  });

  it('handles 2 points — falls back to lineTo', () => {
    const result = builder([0, 1], [10, 20], scaleX, scaleY, 500, 300, 0, 0, 0, 1, 1, pxRound);
    const calls = getCalls(result.stroke);
    const lineTos = calls.filter((c: string[]) => c[0] === 'lineTo');
    const beziers = calls.filter((c: string[]) => c[0] === 'bezierCurveTo');
    // 2 points: linear fallback → lineTo, no bezier
    expect(lineTos.length).toBe(1);
    expect(beziers.length).toBe(0);
  });

  it('handles 1 point — empty path (interp returns null)', () => {
    const result = builder([0], [10], scaleX, scaleY, 500, 300, 0, 0, 0, 0, 1, pxRound);
    const calls = getCalls(result.stroke);
    // Single point: interp returns null, stroke is fresh empty Path2D
    expect(calls.length).toBe(0);
  });

  it('handles gaps — produces clip path with rect calls', () => {
    const gappyY: (number | null)[] = [10, null, 20, null, 30, 50];
    const result = builder(dataX, gappyY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    expect(result.clip).toBeInstanceOf(Path2D);

    const clipRects = getCalls(result.clip!).filter((c: string[]) => c[0] === 'rect');
    // Gaps produce a single clip rect covering the drawable span
    expect(clipRects.length).toBe(1);
  });

  it('all-null returns empty stroke, no fill', () => {
    const result = builder(dataX, [null, null, null, null, null, null], scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    const calls = getCalls(result.stroke);
    expect(calls.length).toBe(0);
    expect(result.fill).toBeNull();
  });
});

describe('catmullRom path builder', () => {
  const builder = catmullRom();

  it('produces bezierCurveTo calls for smooth curves', () => {
    const result = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    const calls = getCalls(result.stroke);
    const beziers = calls.filter((c: string[]) => c[0] === 'bezierCurveTo');
    // 6 points → 5 bezier segments
    expect(beziers.length).toBe(5);
  });

  it('handles 2 points — lineTo fallback', () => {
    const result = builder([0, 1], [10, 20], scaleX, scaleY, 500, 300, 0, 0, 0, 1, 1, pxRound);
    const calls = getCalls(result.stroke);
    const lineTos = calls.filter((c: string[]) => c[0] === 'lineTo');
    expect(lineTos.length).toBe(1);
  });

  it('reversed direction produces same number of bezier segments', () => {
    const resultFwd = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    const resultRev = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, -1, pxRound);
    const fwdBeziers = getCalls(resultFwd.stroke).filter((c: string[]) => c[0] === 'bezierCurveTo');
    const revBeziers = getCalls(resultRev.stroke).filter((c: string[]) => c[0] === 'bezierCurveTo');
    expect(fwdBeziers.length).toBe(revBeziers.length);
  });
});

describe('points path builder', () => {
  const builder = points(5);

  it('produces arc calls for each non-null data point', () => {
    const result = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    expect(result.fill).toBe(result.stroke);
    const calls = getCalls(result.fill!);
    const arcs = calls.filter((c: string[]) => c[0] === 'arc');
    // 6 non-null points → 6 arcs
    expect(arcs.length).toBe(6);
    // Each arc should use radius = ptSize/2 = 2.5
    for (const arc of arcs) {
      expect(arc[3]).toBe(2.5);
    }
  });

  it('skips null values — fewer arcs', () => {
    const gappyY: (number | null)[] = [10, null, null, 60, null, 50];
    const result = builder(dataX, gappyY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    const arcs = getCalls(result.fill!).filter((c: string[]) => c[0] === 'arc');
    // Only 3 non-null values → 3 arcs
    expect(arcs.length).toBe(3);
  });

  it('no clip or gaps', () => {
    const result = builder(dataX, dataY, scaleX, scaleY, 500, 300, 0, 0, 0, 5, 1, pxRound);
    expect(result.clip).toBeNull();
    expect(result.gaps).toBeNull();
  });
});
