import { describe, it, expect } from 'vitest';
import { lttbLinear } from '@/paths/lttbLinear';
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

describe('lttbLinear path builder', () => {
  describe('passthrough below threshold', () => {
    it('delegates directly to linear when points below threshold', () => {
      const builder = lttbLinear();
      const sx = makeScale('x', 0, 4);
      const sy: ScaleState = { ...makeScale('y', 0, 100, Orientation.Vertical) };
      const dataX = [0, 1, 2, 3, 4];
      const dataY: (number | null)[] = [0, 25, 50, 75, 100];

      // xDim=400 → target=400, pointCount=5, 5 < 800 → no downsampling
      const result = builder(dataX, dataY, sx, sy, 400, 200, 0, 0, 0, 4, 1, pxRound);

      expect(result.stroke).toBeInstanceOf(Path2D);
      const lineToPoints = getLineToCalls(result.stroke);
      // All 5 points should be drawn
      expect(lineToPoints.length).toBe(5);
    });
  });

  describe('LTTB downsampling above threshold', () => {
    it('reduces points when above threshold', () => {
      const n = 2000;
      const dataX = Array.from({ length: n }, (_, i) => i);
      const dataY = Array.from({ length: n }, (_, i) => Math.sin(i * 0.01) * 100);

      const builder = lttbLinear({ factor: 1 });
      const sx = makeScale('x', 0, n - 1);
      const sy: ScaleState = { ...makeScale('y', -100, 100, Orientation.Vertical) };

      // xDim=200 → target=200, pointCount=2000, 2000 > 400 → LTTB kicks in
      const result = builder(dataX, dataY, sx, sy, 200, 200, 0, 0, 0, n - 1, 1, pxRound);

      expect(result.stroke).toBeInstanceOf(Path2D);
      const lineToPoints = getLineToCalls(result.stroke);
      // Should have ~200 points (target), not 2000
      expect(lineToPoints.length).toBeLessThanOrEqual(210);
      expect(lineToPoints.length).toBeGreaterThanOrEqual(190);
    });

    it('factor controls downsampling density', () => {
      const n = 2000;
      const dataX = Array.from({ length: n }, (_, i) => i);
      const dataY = Array.from({ length: n }, (_, i) => Math.sin(i * 0.01) * 100);

      const sx = makeScale('x', 0, n - 1);
      const sy: ScaleState = { ...makeScale('y', -100, 100, Orientation.Vertical) };

      const builder1x = lttbLinear({ factor: 1 });
      const builder2x = lttbLinear({ factor: 2 });

      const result1 = builder1x(dataX, dataY, sx, sy, 100, 200, 0, 0, 0, n - 1, 1, pxRound);
      const result2 = builder2x(dataX, dataY, sx, sy, 100, 200, 0, 0, 0, n - 1, 1, pxRound);

      const points1 = getLineToCalls(result1.stroke).length;
      const points2 = getLineToCalls(result2.stroke).length;

      // 2x factor should produce roughly double the points
      expect(points2).toBeGreaterThan(points1);
    });
  });

  describe('null gap handling', () => {
    it('handles data with null gaps', () => {
      const n = 1000;
      const dataX = Array.from({ length: n }, (_, i) => i);
      const dataY: (number | null)[] = Array.from({ length: n }, (_, i) =>
        i >= 400 && i <= 600 ? null : Math.sin(i * 0.01) * 100,
      );

      const builder = lttbLinear();
      const sx = makeScale('x', 0, n - 1);
      const sy: ScaleState = { ...makeScale('y', -100, 100, Orientation.Vertical) };

      // Should not throw
      const result = builder(dataX, dataY, sx, sy, 100, 200, 0, 0, 0, n - 1, 1, pxRound);
      expect(result.stroke).toBeInstanceOf(Path2D);
    });
  });

  describe('defaults', () => {
    it('has LINE_DEFAULTS', () => {
      const builder = lttbLinear();
      expect(builder.defaults).toBeDefined();
      expect(builder.defaults!.width).toBe(1);
    });
  });
});
