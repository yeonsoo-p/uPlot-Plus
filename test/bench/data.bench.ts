import { bench, describe } from 'vitest';
import { DataStore } from '@/core/DataStore';
import { createScaleState } from '@/core/Scale';
import type { ChartData, ScaleState } from '@/types';

function makeGroups(nGroups: number, nPoints: number): ChartData {
  const data: ChartData = [];
  for (let g = 0; g < nGroups; g++) {
    const x = new Array<number>(nPoints);
    const y = new Array<number>(nPoints);
    for (let i = 0; i < nPoints; i++) {
      x[i] = i;
      y[i] = Math.sin(i * 0.01 + g) * 100;
    }
    data.push({ x, series: [y] });
  }
  return data;
}

function makeScale(min: number, max: number): ScaleState {
  return { ...createScaleState({ id: 'x' }), min, max };
}

describe('DataStore.updateWindows', () => {
  const data10x100k = makeGroups(10, 100_000);

  bench('10 groups x 100k points', () => {
    const ds = new DataStore();
    ds.setData(data10x100k);
    ds.updateWindows(() => makeScale(0, 99999));
  });
});

describe('DataStore.getCachedMinMax', () => {
  const data = makeGroups(1, 100_000);
  const ds = new DataStore();
  ds.setData(data);
  ds.updateWindows(() => makeScale(0, 99999));

  bench('cache miss (first call)', () => {
    // Clear cache by re-setting data
    ds.setData(data);
    ds.updateWindows(() => makeScale(0, 99999));
    ds.getCachedMinMax(0, 0, 0, 99999, 0, false);
  });

  bench('cache hit (second call)', () => {
    ds.getCachedMinMax(0, 0, 0, 99999, 0, false);
  });
});
