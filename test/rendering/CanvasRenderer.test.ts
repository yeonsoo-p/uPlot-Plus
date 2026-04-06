import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasRenderer } from '@/rendering/CanvasRenderer';
import type { RenderableSeriesInfo } from '@/rendering/CanvasRenderer';
import type { SeriesPaths } from '@/paths/types';
import type { ScaleState } from '@/types';
import { createScaleState } from '@/core/Scale';
import { tuple } from '../helpers/mockCanvas';

/** Create a stub SeriesPaths object for caching tests */
function stubPaths(label = 'a'): SeriesPaths {
  const paths: SeriesPaths = { stroke: new Path2D(), fill: new Path2D(), clip: null, band: null, gaps: null };
  return Object.assign(paths, { _label: label });
}

function makeScale(id: string, min: number, max: number): ScaleState {
  return { ...createScaleState({ id, min, max }) };
}

function makeRenderInfo(xScale: ScaleState, yScale: ScaleState): RenderableSeriesInfo {
  return {
    config: { group: 0, index: 0, yScale: 'y', show: true, stroke: 'red' },
    dataX: [0, 1, 2, 3, 4],
    dataY: [10, 20, 30, 40, 50],
    xScale,
    yScale,
    window: tuple(0, 4),
  };
}

describe('CanvasRenderer: path cache', () => {
  let r: CanvasRenderer;

  beforeEach(() => {
    r = new CanvasRenderer();
  });

  it('stores and retrieves paths by composite key', () => {
    const p = stubPaths();
    r.setCachedPaths(0, 1, 10, 20, p);
    expect(r.getCachedPaths(0, 1, 10, 20)).toBe(p);
  });

  it('returns undefined for cache miss', () => {
    expect(r.getCachedPaths(0, 0, 0, 100)).toBeUndefined();
  });

  it('superset window fallback returns cached entry that fully contains the requested range', () => {
    const p = stubPaths();
    r.setCachedPaths(0, 0, 0, 100, p);
    // Request a sub-range — should hit the superset
    expect(r.getCachedPaths(0, 0, 20, 80)).toBe(p);
  });

  it('superset fallback does NOT match if cached window is smaller', () => {
    const p = stubPaths();
    r.setCachedPaths(0, 0, 30, 70, p);
    // Request a wider range — should miss
    expect(r.getCachedPaths(0, 0, 20, 80)).toBeUndefined();
  });

  it('exact match is preferred and promoted', () => {
    const wide = stubPaths('wide');
    const exact = stubPaths('exact');
    r.setCachedPaths(0, 0, 0, 100, wide);
    r.setCachedPaths(0, 0, 20, 80, exact);
    // Exact match should be returned
    expect(r.getCachedPaths(0, 0, 20, 80)).toBe(exact);
  });

  it('evicts oldest 25% when at capacity', () => {
    // Fill cache to 64 entries
    for (let i = 0; i < 64; i++) {
      r.setCachedPaths(0, i, 0, 100, stubPaths(`s${i}`));
    }
    // Oldest entries (0-15) should still be findable before eviction trigger
    // Adding one more should trigger eviction of oldest 16
    r.setCachedPaths(1, 0, 0, 100, stubPaths('new'));

    // Oldest 16 entries should be evicted
    expect(r.getCachedPaths(0, 0, 0, 100)).toBeUndefined();
    expect(r.getCachedPaths(0, 15, 0, 100)).toBeUndefined();
    // Entry 16 should survive
    expect(r.getCachedPaths(0, 16, 0, 100)).toBeDefined();
    // New entry should exist
    expect(r.getCachedPaths(1, 0, 0, 100)).toBeDefined();
  });

  it('invalidateSeries removes all windows for that series', () => {
    r.setCachedPaths(0, 0, 0, 50, stubPaths());
    r.setCachedPaths(0, 0, 50, 100, stubPaths());
    r.setCachedPaths(0, 1, 0, 100, stubPaths());

    r.invalidateSeries(0, 0);

    expect(r.getCachedPaths(0, 0, 0, 50)).toBeUndefined();
    expect(r.getCachedPaths(0, 0, 50, 100)).toBeUndefined();
    // Other series unaffected
    expect(r.getCachedPaths(0, 1, 0, 100)).toBeDefined();
  });

  it('clearGroupCache removes all series in that group', () => {
    r.setCachedPaths(0, 0, 0, 100, stubPaths());
    r.setCachedPaths(0, 1, 0, 100, stubPaths());
    r.setCachedPaths(1, 0, 0, 100, stubPaths());

    r.clearGroupCache(0);

    expect(r.getCachedPaths(0, 0, 0, 100)).toBeUndefined();
    expect(r.getCachedPaths(0, 1, 0, 100)).toBeUndefined();
    // Other group unaffected
    expect(r.getCachedPaths(1, 0, 0, 100)).toBeDefined();
  });

  it('clearCache removes everything', () => {
    r.setCachedPaths(0, 0, 0, 100, stubPaths());
    r.setCachedPaths(1, 0, 0, 100, stubPaths());

    r.clearCache();

    expect(r.getCachedPaths(0, 0, 0, 100)).toBeUndefined();
    expect(r.getCachedPaths(1, 0, 0, 100)).toBeUndefined();
  });
});

describe('CanvasRenderer: scale stamp', () => {
  let r: CanvasRenderer;

  beforeEach(() => {
    r = new CanvasRenderer();
  });

  it('first call sets stamp without clearing cache', () => {
    const p = stubPaths();
    r.setCachedPaths(0, 0, 0, 100, p);

    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 50);
    r.checkScaleStamp([makeRenderInfo(xScale, yScale)]);

    // Cache should survive first stamp
    expect(r.getCachedPaths(0, 0, 0, 100)).toBe(p);
  });

  it('same stamp does not clear cache', () => {
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 50);
    const info = makeRenderInfo(xScale, yScale);

    r.checkScaleStamp([info]);
    r.setCachedPaths(0, 0, 0, 100, stubPaths());
    r.checkScaleStamp([info]);

    expect(r.getCachedPaths(0, 0, 0, 100)).toBeDefined();
  });

  it('changed scale range clears cache', () => {
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 50);

    r.checkScaleStamp([makeRenderInfo(xScale, yScale)]);
    r.setCachedPaths(0, 0, 0, 100, stubPaths());

    // Zoom in — scale range changes
    const xZoomed = makeScale('x', 20, 80);
    r.checkScaleStamp([makeRenderInfo(xZoomed, yScale)]);

    expect(r.getCachedPaths(0, 0, 0, 100)).toBeUndefined();
  });
});

describe('CanvasRenderer: band cache', () => {
  let r: CanvasRenderer;

  beforeEach(() => {
    r = new CanvasRenderer();
  });

  it('stores and retrieves band paths', () => {
    const path = new Path2D();
    r.setCachedBandPath(0, 1, 2, 10, 20, 0, path);
    expect(r.getCachedBandPath(0, 1, 2, 10, 20, 0)).toBe(path);
  });

  it('returns undefined for band cache miss', () => {
    expect(r.getCachedBandPath(0, 1, 2, 10, 20, 0)).toBeUndefined();
  });

  it('differentiates cache entries by dir', () => {
    const pFull = new Path2D();
    const pUp = new Path2D();
    const pDown = new Path2D();
    r.setCachedBandPath(0, 1, 2, 0, 100, 0, pFull);
    r.setCachedBandPath(0, 1, 2, 0, 100, 1, pUp);
    r.setCachedBandPath(0, 1, 2, 0, 100, -1, pDown);

    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 0)).toBe(pFull);
    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 1)).toBe(pUp);
    expect(r.getCachedBandPath(0, 1, 2, 0, 100, -1)).toBe(pDown);
  });

  it('clearGroupCache clears band paths for that group', () => {
    const p0 = new Path2D();
    const p1 = new Path2D();
    r.setCachedBandPath(0, 1, 2, 0, 100, 0, p0);
    r.setCachedBandPath(0, 1, 2, 0, 100, 1, new Path2D());
    r.setCachedBandPath(1, 0, 1, 0, 100, 0, p1);

    r.clearGroupCache(0);

    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 0)).toBeUndefined();
    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 1)).toBeUndefined();
    expect(r.getCachedBandPath(1, 0, 1, 0, 100, 0)).toBe(p1);
  });

  it('clearCache clears all band paths', () => {
    r.setCachedBandPath(0, 1, 2, 0, 100, 0, new Path2D());
    r.setCachedBandPath(0, 1, 2, 0, 100, 1, new Path2D());
    r.clearCache();
    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 0)).toBeUndefined();
    expect(r.getCachedBandPath(0, 1, 2, 0, 100, 1)).toBeUndefined();
  });
});

describe('CanvasRenderer: snapshot', () => {
  let r: CanvasRenderer;

  beforeEach(() => {
    r = new CanvasRenderer();
  });

  it('restoreSnapshot returns false when no snapshot saved', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    expect(r.restoreSnapshot(ctx)).toBe(false);
  });

  it('saveSnapshot + restoreSnapshot round-trips', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;
    // The stub sets canvas: null — point it at the real canvas for restoreSnapshot
    Object.defineProperty(ctx, 'canvas', { value: canvas, writable: true });

    r.saveSnapshot(ctx, 100, 50);
    expect(r.restoreSnapshot(ctx)).toBe(true);
  });

  it('invalidateSnapshot makes restoreSnapshot return false', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;

    r.saveSnapshot(ctx, 100, 50);
    r.invalidateSnapshot();
    expect(r.restoreSnapshot(ctx)).toBe(false);
  });

  it('clearGroupCache invalidates snapshot', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;

    r.saveSnapshot(ctx, 100, 50);
    r.clearGroupCache(0);
    expect(r.restoreSnapshot(ctx)).toBe(false);
  });
});
