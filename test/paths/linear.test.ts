import { describe, it, expect } from 'vitest';
import { linear } from '@/paths/linear';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Orientation, Direction } from '@/types';
import { round } from '@/math/utils';
import { getMockCalls, tuple } from '../helpers/mockCanvas';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id }), min, max, ori, dir: Direction.Forward };
}

function getLineToCalls(path: Path2D): [number, number][] {
  return getMockCalls(path)
    .filter((c) => c[0] === 'lineTo')
    .map((c) => tuple(c[1], c[2]));
}

const pxRound = (v: number) => round(v);

describe('linear path builder', () => {
  const builder = linear();

  describe('basic line drawing', () => {
    it('draws lineTo for each data point', () => {
      const sx = makeScale('x', 0, 4);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };
      const dataX = [0, 1, 2, 3, 4];
      const dataY: (number | null)[] = [0, 25, 50, 75, 100];

      const result = builder(dataX, dataY, sx, sy, 400, 200, 0, 0, 0, 4, 1, pxRound);

      expect(result.stroke).toBeInstanceOf(Path2D);
      const lineToPoints = getLineToCalls(result.stroke);
      expect(lineToPoints.length).toBe(5);

      // First point: x=0 maps to pixel 0, y=0 maps to pixel 200 (bottom)
      expect(lineToPoints[0]).toEqual([0, 200]);
      // Last point: x=4 maps to pixel 400, y=100 maps to pixel 0 (top)
      expect(lineToPoints[4]).toEqual([400, 0]);
    });

    it('two points draws a straight line', () => {
      const sx = makeScale('x', 0, 1);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const result = builder([0, 1], [0, 100], sx, sy, 200, 100, 0, 0, 0, 1, 1, pxRound);

      const lineToPoints = getLineToCalls(result.stroke);
      expect(lineToPoints.length).toBe(2);
      expect(lineToPoints[0]).toEqual([0, 100]); // y=0 at bottom
      expect(lineToPoints[1]).toEqual([200, 0]);  // y=100 at top
    });

    it('single point draws a single lineTo', () => {
      const sx = makeScale('x', 0, 0);
      const sy: ScaleState = { ...makeScale('y', 50, 50, Orientation.Vertical) };

      const result = builder([0], [50], sx, sy, 200, 100, 0, 0, 0, 0, 1, pxRound);

      const lineToPoints = getLineToCalls(result.stroke);
      expect(lineToPoints.length).toBe(1);
    });
  });

  describe('fill path', () => {
    it('creates a fill path that closes to the bottom', () => {
      const sx = makeScale('x', 0, 2);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const result = builder([0, 1, 2], [50, 100, 50], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound);

      expect(result.fill).toBeInstanceOf(Path2D);
      // Fill path includes the stroke points plus closing lines to bottom
      const fillLineTos = getLineToCalls(result.fill!);
      // 3 data points + 2 closing lines (to bottom-right and bottom-left)
      expect(fillLineTos.length).toBe(5);
    });

    it('fillTo option controls fill baseline', () => {
      const sx = makeScale('x', 0, 1);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const result = builder([0, 1], [50, 50], sx, sy, 200, 100, 0, 0, 0, 1, 1, pxRound, { fillTo: 50 });

      expect(result.fill).toBeInstanceOf(Path2D);
      const fillLineTos = getLineToCalls(result.fill!);
      // The closing lines should go to y=50 (pixel 50) instead of y=0 (pixel 100)
      const lastTwo = fillLineTos.slice(-2);
      expect(lastTwo[0]![1]).toBe(50); // fillTo=50 maps to pixel 50
      expect(lastTwo[1]![1]).toBe(50);
    });
  });

  describe('gap handling', () => {
    it('null values produce clip path', () => {
      const sx = makeScale('x', 0, 4);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };
      const dataY: (number | null)[] = [50, 75, null, 25, 50];

      const result = builder([0, 1, 2, 3, 4], dataY, sx, sy, 400, 200, 0, 0, 0, 4, 1, pxRound);

      expect(result.clip).toBeInstanceOf(Path2D);
      expect(result.gaps).not.toBeNull();
      expect(result.gaps!.length).toBe(1);

      // Stroke should only have lineTo calls for non-null points
      const lineToPoints = getLineToCalls(result.stroke);
      expect(lineToPoints.length).toBe(4); // 4 non-null points
    });

    it('spanGaps suppresses clip path', () => {
      const sx = makeScale('x', 0, 4);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };
      const dataY: (number | null)[] = [50, null, null, 25, 50];

      const result = builder([0, 1, 2, 3, 4], dataY, sx, sy, 400, 200, 0, 0, 0, 4, 1, pxRound, { spanGaps: true });

      expect(result.clip).toBeNull();
      expect(result.gaps).toBeNull();
    });

    it('all null data returns empty stroke and null fill', () => {
      const sx = makeScale('x', 0, 4);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const result = builder([0, 1, 2, 3, 4], [null, null, null, null, null], sx, sy, 400, 200, 0, 0, 0, 4, 1, pxRound);

      const lineToPoints = getLineToCalls(result.stroke);
      expect(lineToPoints.length).toBe(0);
      expect(result.fill).toBeNull();
      expect(result.clip).toBeNull();
    });

    it('multiple gaps produce multiple clip rects', () => {
      const sx = makeScale('x', 0, 6);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };
      const dataY: (number | null)[] = [50, null, 50, null, 50, null, 50];

      const result = builder([0, 1, 2, 3, 4, 5, 6], dataY, sx, sy, 600, 200, 0, 0, 0, 6, 1, pxRound);

      expect(result.gaps!.length).toBe(3);
    });
  });

  describe('decimation', () => {
    it('kicks in when points >= 4x pixel width', () => {
      const n = 4000; // 4000 points for 400px width = exactly 10x threshold
      const sx = makeScale('x', 0, n - 1);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const dataX = Array.from({ length: n }, (_, i) => i);
      const dataY: (number | null)[] = Array.from({ length: n }, (_, i) => Math.sin(i * 0.01) * 50 + 50);

      const result = builder(dataX, dataY, sx, sy, 400, 200, 0, 0, 0, n - 1, 1, pxRound);

      // With decimation, we should have far fewer lineTo calls than data points
      const lineToCount = getLineToCalls(result.stroke).length;
      expect(lineToCount).toBeLessThan(n);
      expect(lineToCount).toBeGreaterThan(0);
    });

    it('does NOT decimate when points < 4x pixel width', () => {
      const n = 100; // 100 points for 400px = well below threshold
      const sx = makeScale('x', 0, n - 1);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const dataX = Array.from({ length: n }, (_, i) => i);
      const dataY: (number | null)[] = Array.from({ length: n }, (_, i) => i);

      const result = builder(dataX, dataY, sx, sy, 400, 200, 0, 0, 0, n - 1, 1, pxRound);

      // Without decimation, every point gets a lineTo
      const lineToCount = getLineToCalls(result.stroke).length;
      expect(lineToCount).toBe(n);
    });
  });

  describe('direction', () => {
    it('backward direction reverses traversal order', () => {
      const sx = makeScale('x', 0, 2);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const resultFwd = builder([0, 1, 2], [0, 50, 100], sx, sy, 200, 100, 0, 0, 0, 2, 1, pxRound);
      const resultRev = builder([0, 1, 2], [0, 50, 100], sx, sy, 200, 100, 0, 0, 0, 2, -1, pxRound);

      const fwdPoints = getLineToCalls(resultFwd.stroke);
      const revPoints = getLineToCalls(resultRev.stroke);

      expect(fwdPoints.length).toBe(revPoints.length);
      // Forward starts at index 0, reverse starts at index 2
      expect(fwdPoints[0]).not.toEqual(revPoints[0]);
    });
  });

  describe('offset', () => {
    it('xOff and yOff shift pixel positions', () => {
      const sx = makeScale('x', 0, 1);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };

      const noOffset = builder([0, 1], [0, 100], sx, sy, 200, 100, 0, 0, 0, 1, 1, pxRound);
      const withOffset = builder([0, 1], [0, 100], sx, sy, 200, 100, 50, 30, 0, 1, 1, pxRound);

      const noOffPts = getLineToCalls(noOffset.stroke);
      const offPts = getLineToCalls(withOffset.stroke);

      // With xOff=50, all x coords shift by 50
      expect(offPts[0]![0]).toBe(noOffPts[0]![0] + 50);
      expect(offPts[1]![0]).toBe(noOffPts[1]![0] + 50);
      // With yOff=30, all y coords shift by 30
      expect(offPts[0]![1]).toBe(noOffPts[0]![1] + 30);
    });
  });
});
