import { bench, describe } from 'vitest';
import { linear } from '@/paths/linear';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { round } from '@/math/utils';

function makeData(n: number): { x: number[]; y: (number | null)[] } {
  const x = new Array<number>(n);
  const y = new Array<number | null>(n);
  for (let i = 0; i < n; i++) {
    x[i] = i;
    y[i] = Math.sin(i * 0.01) * 100;
  }
  return { x, y };
}

function makeScale(min: number, max: number, ori: 0 | 1 = 0): ScaleState {
  return { ...createScaleState({ id: 's' }), min, max, ori };
}

const pxRound = (v: number) => round(v);

describe('linear path builder', () => {
  const builder = linear();
  const scaleX = makeScale(0, 999);
  const scaleY: ScaleState = { ...makeScale(0, 100), ori: 1, dir: 1 };

  const data10k = makeData(10_000);
  const data100k = makeData(100_000);
  const data1M = makeData(1_000_000);

  bench('10k points', () => {
    builder(data10k.x, data10k.y, scaleX, scaleY, 800, 400, 0, 0, 0, 9999, 1, pxRound);
  });

  bench('100k points', () => {
    builder(data100k.x, data100k.y, scaleX, scaleY, 800, 400, 0, 0, 0, 99999, 1, pxRound);
  });

  bench('1M points', () => {
    builder(data1M.x, data1M.y, scaleX, scaleY, 800, 400, 0, 0, 0, 999999, 1, pxRound);
  });
});
