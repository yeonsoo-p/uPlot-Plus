import { bench, describe } from 'vitest';
import { valToPos, posToVal, createScaleState } from '@/core/Scale';
import { closestIdx } from '@/math/utils';
import type { ScaleState } from '@/types';

function makeScale(min: number, max: number, distr: 1 | 3 | 4 = 1): ScaleState {
  return { ...createScaleState({ id: 's', distr }), min, max, ori: 0, dir: 1 };
}

describe('valToPos / posToVal', () => {
  const linearScale = makeScale(0, 1000);
  const logScale = makeScale(1, 1000, 3);
  const asinhScale = makeScale(-100, 100, 4);

  bench('linear valToPos 1M iterations', () => {
    for (let i = 0; i < 1_000_000; i++) {
      valToPos(i % 1000, linearScale, 800, 0);
    }
  });

  bench('log valToPos 1M iterations', () => {
    for (let i = 0; i < 1_000_000; i++) {
      valToPos((i % 999) + 1, logScale, 800, 0);
    }
  });

  bench('asinh valToPos 1M iterations', () => {
    for (let i = 0; i < 1_000_000; i++) {
      valToPos((i % 200) - 100, asinhScale, 800, 0);
    }
  });

  bench('linear posToVal 1M iterations', () => {
    for (let i = 0; i < 1_000_000; i++) {
      posToVal(i % 800, linearScale, 800, 0);
    }
  });
});

describe('closestIdx', () => {
  const arr = new Array<number>(1_000_000);
  for (let i = 0; i < arr.length; i++) arr[i] = i;

  bench('binary search on 1M array', () => {
    for (let i = 0; i < 1000; i++) {
      closestIdx(Math.random() * 1_000_000, arr);
    }
  });
});
