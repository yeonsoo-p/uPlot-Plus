import { describe, it, expect } from 'vitest';
import { stepped } from '@/paths/stepped';
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

function getLineToCalls(path: Path2D): [number, number][] {
  return getCalls(path)
    .filter((c: string[]) => c[0] === 'lineTo')
    .map((c: [string, number, number]) => [c[1], c[2]]);
}

const pxRound = (v: number) => round(v);
const dataX = [0, 1, 2, 3, 4];
const dataY: (number | null)[] = [10, 20, 15, 30, 25];
const scaleX = makeScale('x', 0, 4);
const scaleY: ScaleState = { ...makeScale('y', 0, 30), ori: Orientation.Vertical, dir: Direction.Forward };

describe('stepped path builder', () => {
  const builder = stepped();

  it('produces stroke and fill paths with lineTo calls for each data point', () => {
    const result = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    expect(result.stroke).toBeInstanceOf(Path2D);
    expect(result.fill).toBeInstanceOf(Path2D);

    // Stroke should have lineTo calls for stepped path
    const strokeLineToCount = getCalls(result.stroke).filter((c: string[]) => c[0] === 'lineTo').length;
    expect(strokeLineToCount).toBe(11);
  });

  it('align=1 produces horizontal-then-vertical steps (staircase pattern)', () => {
    const sx = makeScale('x', 0, 2);
    const sy: ScaleState = { ...makeScale('y', 0, 10), ori: Orientation.Vertical, dir: Direction.Forward };
    const result = builder([0, 1, 2], [0, 10, 0], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound, { align: 1 });

    const lineToPoints = getLineToCalls(result.stroke);
    // pixelForX: 0→0, 1→100, 2→200; pixelForY: 0→100, 10→0
    // align=1: horizontal to new x at old y, then vertical to new y
    expect(lineToPoints).toEqual([
      [0, 100],    // initial point
      [0, 100],    // i=0: step to self (x1=0, prevY=100)
      [0, 100],    // i=0: arrive at (0, 100)
      [100, 100],  // i=1: horizontal step right at old y=100
      [100, 0],    // i=1: vertical step down to y=0
      [200, 0],    // i=2: horizontal step right at old y=0
      [200, 100],  // i=2: vertical step up to y=100
    ]);
  });

  it('align=-1 produces vertical-then-horizontal steps', () => {
    const sx = makeScale('x', 0, 2);
    const sy: ScaleState = { ...makeScale('y', 0, 10), ori: Orientation.Vertical, dir: Direction.Forward };
    const result = builder([0, 1, 2], [0, 10, 0], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound, { align: -1 });

    const lineToPoints = getLineToCalls(result.stroke);
    // align=-1: vertical to new y at old x, then horizontal to new x
    expect(lineToPoints).toEqual([
      [0, 100],    // initial point
      [0, 100],    // i=0: step to self (prevX=0, y1=100)
      [0, 100],    // i=0: arrive at (0, 100)
      [0, 0],      // i=1: vertical to y=0 at old x=0
      [100, 0],    // i=1: horizontal to x=100
      [100, 100],  // i=2: vertical to y=100 at old x=100
      [200, 100],  // i=2: horizontal to x=200
    ]);
  });

  it('align=0 adds midpoint steps (more lineTo calls than align=1)', () => {
    const sx = makeScale('x', 0, 2);
    const sy: ScaleState = { ...makeScale('y', 0, 10), ori: Orientation.Vertical, dir: Direction.Forward };
    const resultMid = builder([0, 1, 2], [0, 10, 0], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound, { align: 0 });
    const resultAfter = builder([0, 1, 2], [0, 10, 0], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound, { align: 1 });

    const midCount = getLineToCalls(resultMid.stroke).length;
    const afterCount = getLineToCalls(resultAfter.stroke).length;
    // align=0 adds 3 lineTos per transition vs 2 for align=1
    expect(midCount).toBeGreaterThan(afterCount);
  });

  it('handles gaps — produces clip path with rect calls for visible regions', () => {
    // Data with a single gap in the middle, so there are visible regions on both sides
    const dataWithGap: (number | null)[] = [10, 20, null, 30, 25];
    const result = builder(dataX, dataWithGap, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    expect(result.clip).toBeInstanceOf(Path2D);
    expect(result.gaps).not.toBeNull();
    expect(result.gaps!.length).toBe(1);

    // Clip path should have rect calls for the visible regions (before and after the gap)
    const clipRects = getCalls(result.clip!).filter((c: string[]) => c[0] === 'rect');
    expect(clipRects.length).toBe(2);
  });

  it('spanGaps suppresses clip path', () => {
    const dataWithGaps: (number | null)[] = [10, null, 15, null, 25];
    const result = builder(dataX, dataWithGaps, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound, { spanGaps: true });
    expect(result.clip).toBeNull();
  });

  it('handles all-null data — empty stroke, no fill', () => {
    const result = builder(dataX, [null, null, null, null, null], scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const calls = getCalls(result.stroke);
    expect(calls.filter((c: string[]) => c[0] === 'lineTo').length).toBe(0);
    expect(result.fill).toBeNull();
  });

  it('reversed direction traverses data backward, producing different call order', () => {
    const resultFwd = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, 1, pxRound);
    const resultRev = builder(dataX, dataY, scaleX, scaleY, 400, 300, 0, 0, 0, 4, -1, pxRound);

    const fwdCalls = getLineToCalls(resultFwd.stroke);
    const revCalls = getLineToCalls(resultRev.stroke);
    expect(fwdCalls.length).toBe(revCalls.length);
    // First lineTo should differ since forward starts at index 0, reverse at index 4
    expect(fwdCalls[0]).not.toEqual(revCalls[0]);
  });
});
