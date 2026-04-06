import { bench, describe } from 'vitest';
import { CanvasRenderer } from '@/rendering/CanvasRenderer';
import type { SeriesPaths } from '@/paths/types';
import { tuple } from '../helpers/mockCanvas';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';

function stubPaths(): SeriesPaths {
  return { stroke: new Path2D(), fill: new Path2D(), clip: null, band: null, gaps: null };
}

function makeRenderer(): CanvasRenderer {
  return new CanvasRenderer();
}

function makeScaleState(id: string, min: number, max: number): ScaleState {
  return { ...createScaleState({ id, min, max }) };
}

describe('path cache: exact key operations', () => {
  const r = makeRenderer();
  const paths = stubPaths();
  r.setCachedPaths(0, 0, 0, 1000, paths);

  bench('cache hit (exact key)', () => {
    r.getCachedPaths(0, 0, 0, 1000);
  });

  bench('cache miss (wrong key)', () => {
    r.getCachedPaths(0, 0, 500, 1500);
  });
});

describe('path cache: superset fallback', () => {
  const r = makeRenderer();
  const paths = stubPaths();
  // Cache a wide window
  r.setCachedPaths(0, 0, 0, 10_000, paths);

  bench('superset hit (sub-range of cached window)', () => {
    r.getCachedPaths(0, 0, 1000, 9000);
  });
});

describe('path cache: eviction', () => {
  bench('fill to capacity + evict (64 → prune 16)', () => {
    const r = makeRenderer();
    for (let i = 0; i < 65; i++) {
      r.setCachedPaths(0, i, 0, 100, stubPaths());
    }
  });
});

describe('path cache: scale stamp invalidation', () => {
  bench('checkScaleStamp (same scales, no invalidation)', () => {
    const r = makeRenderer();
    const xScale = makeScaleState('x', 0, 100);
    const yScale = makeScaleState('y', 0, 50);
    const info = [{
      config: { group: 0, index: 0, yScale: 'y', show: true, stroke: 'red' },
      dataX: [0], dataY: [0], xScale, yScale, window: tuple(0, 0),
    }];
    // Set initial stamp
    r.checkScaleStamp(info);
    // Benchmark repeated checks with same scales
    r.checkScaleStamp(info);
  });

  bench('checkScaleStamp (changed scales, triggers invalidation)', () => {
    const r = makeRenderer();
    const xScale = makeScaleState('x', 0, 100);
    const yScale = makeScaleState('y', 0, 50);
    const info1 = [{
      config: { group: 0, index: 0, yScale: 'y', show: true, stroke: 'red' },
      dataX: [0], dataY: [0], xScale, yScale, window: tuple(0, 0),
    }];
    r.checkScaleStamp(info1);
    r.setCachedPaths(0, 0, 0, 100, stubPaths());

    // Change scale range (simulate zoom)
    const xZoomed = makeScaleState('x', 20, 80);
    const info2 = [{
      config: { group: 0, index: 0, yScale: 'y', show: true, stroke: 'red' },
      dataX: [0], dataY: [0], xScale: xZoomed, yScale, window: tuple(0, 0),
    }];
    r.checkScaleStamp(info2);
  });
});

describe('path cache: lookup with many entries', () => {
  const r = makeRenderer();
  // Fill with 60 entries across different series
  for (let g = 0; g < 6; g++) {
    for (let i = 0; i < 10; i++) {
      r.setCachedPaths(g, i, 0, 1000, stubPaths());
    }
  }

  bench('exact hit in 60-entry cache', () => {
    r.getCachedPaths(3, 5, 0, 1000);
  });

  bench('superset fallback scan in 60-entry cache', () => {
    r.getCachedPaths(3, 5, 100, 900);
  });

  bench('complete miss in 60-entry cache', () => {
    r.getCachedPaths(9, 9, 0, 1000);
  });
});
