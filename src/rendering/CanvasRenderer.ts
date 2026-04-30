import type { SeriesConfig, ScaleState, BBox } from '../types';
import { Distribution, Orientation } from '../types';
import type { SeriesPaths } from '../paths/types';
import { lttbLinear } from '../paths/lttbLinear';
import { drawSeriesPath } from './drawSeries';

const defaultPathBuilder = lttbLinear();

export interface RenderableSeriesInfo {
  config: SeriesConfig;
  dataX: ArrayLike<number>;
  dataY: ArrayLike<number | null>;
  xScale: ScaleState;
  yScale: ScaleState;
  window: [number, number];
}

/** Maximum number of cached path entries before LRU eviction */
const MAX_CACHE_SIZE = 64;

/**
 * Imperative canvas renderer.
 * Handles clearing, drawing series, and (later) axes, cursor, selection.
 * This is completely decoupled from React.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private pxRatio = 1;

  // --- Flat path cache: composite key "group:index:i0:i1" -> SeriesPaths ---
  // JS Map iteration order = insertion order, so delete+re-insert gives LRU for free.
  private pathCache = new Map<string, SeriesPaths>();

  // --- Band path cache: keyed by group:upper:lower:i0:i1 ---
  private bandCache = new Map<string, Path2D>();

  // Scale-stamp: fingerprint of all active scale ranges. Auto-clears cache on zoom.
  private scaleStamp = '';

  // --- Offscreen canvas for cursor-only snapshot (avoids getImageData/putImageData) ---
  private snapshotCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private snapshotValid = false;


  setContext(ctx: CanvasRenderingContext2D, pxRatio: number): void {
    this.ctx = ctx;
    this.pxRatio = pxRatio;
  }


  // --- Offscreen canvas snapshot ---

  /** Save a snapshot of the current canvas using an offscreen canvas (much cheaper than getImageData) */
  saveSnapshot(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const canvas = ctx.canvas;

    // Lazily create or resize the offscreen canvas
    if (this.snapshotCanvas == null ||
        this.snapshotCanvas.width !== w ||
        this.snapshotCanvas.height !== h) {
      this.snapshotCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(w, h)
        : document.createElement('canvas');
      this.snapshotCanvas.width = w;
      this.snapshotCanvas.height = h;
    }

    const snapCtx = this.snapshotCanvas.getContext('2d');
    if (snapCtx != null && typeof snapCtx.drawImage === 'function') {
      snapCtx.clearRect(0, 0, w, h);
      snapCtx.drawImage(canvas, 0, 0);
      this.snapshotValid = true;
    }
  }

  /** Restore a previously saved snapshot. Returns false if no snapshot exists. */
  restoreSnapshot(ctx: CanvasRenderingContext2D): boolean {
    if (!this.snapshotValid || this.snapshotCanvas == null || typeof ctx.drawImage !== 'function') return false;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(this.snapshotCanvas, 0, 0);
    return true;
  }

  /** Invalidate the saved snapshot */
  invalidateSnapshot(): void {
    this.snapshotValid = false;
  }

  // --- Scale-stamp auto-invalidation ---

  /** Compare current scale ranges to cached stamp; clear path cache if scales changed (zoom). */
  checkScaleStamp(renderList: RenderableSeriesInfo[]): void {
    let stamp = '';
    const seen = new Set<string>();
    for (const info of renderList) {
      for (const s of [info.xScale, info.yScale]) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        stamp += `${s.id}:${s.min}:${s.max};`;
      }
    }
    if (stamp !== this.scaleStamp) {
      if (this.scaleStamp !== '') {
        // Scales changed (not first render) — clear stale paths
        this.clearCache();
      }
      this.scaleStamp = stamp;
    }
  }

  // --- Flat path cache (insertion-ordered Map = built-in LRU) ---

  private cacheKey(group: number, index: number, i0: number, i1: number): string {
    return `${group}:${index}:${i0}:${i1}`;
  }

  /** Promote a key to most-recently-used (delete + re-insert preserves Map insertion order) */
  private promote(key: string, paths: SeriesPaths): void {
    this.pathCache.delete(key);
    this.pathCache.set(key, paths);
  }

  /** Get cached paths for a series, promoting to most-recently-used.
   *  Falls back to a superset window match if exact key misses. */
  getCachedPaths(group: number, index: number, i0: number, i1: number): SeriesPaths | undefined {
    const key = this.cacheKey(group, index, i0, i1);
    const paths = this.pathCache.get(key);
    if (paths != null) {
      this.promote(key, paths);
      return paths;
    }
    // Superset fallback: check if any cached window for this series fully contains the requested range
    const prefix = `${group}:${index}:`;
    for (const [ck, cachedPaths] of this.pathCache) {
      if (!ck.startsWith(prefix)) continue;
      const rest = ck.slice(prefix.length);
      const sep = rest.indexOf(':');
      const ci0 = +rest.slice(0, sep);
      const ci1 = +rest.slice(sep + 1);
      if (ci0 <= i0 && ci1 >= i1) {
        this.promote(ck, cachedPaths);
        return cachedPaths;
      }
    }
    return undefined;
  }

  /** Store paths in cache, evicting oldest 25% when at capacity.
   *  Callers may pass padded i0/i1 (wider than the visible window) for "runway" during panning. */
  setCachedPaths(group: number, index: number, i0: number, i1: number, paths: SeriesPaths): void {
    if (this.pathCache.size >= MAX_CACHE_SIZE) {
      const evictCount = MAX_CACHE_SIZE >> 2; // 25%
      const iter = this.pathCache.keys();
      for (let i = 0; i < evictCount; i++) {
        const oldest = iter.next().value;
        if (oldest != null) this.pathCache.delete(oldest);
      }
    }
    const key = this.cacheKey(group, index, i0, i1);
    // Delete first so re-insert moves to end (most-recently-used)
    this.pathCache.delete(key);
    this.pathCache.set(key, paths);
  }

  /** Invalidate paths and band geometry for a specific series (all windows) */
  invalidateSeries(group: number, index: number): void {
    const prefix = `${group}:${index}:`;
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(prefix)) this.pathCache.delete(key);
    }
    // Also invalidate band cache entries where this series is upper or lower
    const groupPrefix = `${group}:`;
    const idx = String(index);
    for (const bk of this.bandCache.keys()) {
      if (!bk.startsWith(groupPrefix)) continue;
      const parts = bk.split(':');
      if (parts[1] === idx || parts[2] === idx) {
        this.bandCache.delete(bk);
      }
    }
  }

  /** Invalidate cached paths for a specific group */
  clearGroupCache(group: number): void {
    const prefix = `${group}:`;
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(prefix)) this.pathCache.delete(key);
    }
    // Clear band paths for this group
    for (const bk of this.bandCache.keys()) {
      if (bk.startsWith(prefix)) this.bandCache.delete(bk);
    }
    this.invalidateSnapshot();
  }

  /** Invalidate all cached paths (e.g. on scale change) */
  clearCache(): void {
    this.pathCache.clear();
    this.bandCache.clear();
    this.invalidateSnapshot();
  }

  // --- Band path cache ---

  private bandKey(group: number, upper: number, lower: number, i0: number, i1: number, dir: -1 | 0 | 1): string {
    return `${group}:${upper}:${lower}:${i0}:${i1}:${dir}`;
  }

  getCachedBandPath(group: number, upper: number, lower: number, i0: number, i1: number, dir: -1 | 0 | 1): Path2D | undefined {
    return this.bandCache.get(this.bandKey(group, upper, lower, i0, i1, dir));
  }

  setCachedBandPath(group: number, upper: number, lower: number, i0: number, i1: number, dir: -1 | 0 | 1, path: Path2D): void {
    this.bandCache.set(this.bandKey(group, upper, lower, i0, i1, dir), path);
  }

  /**
   * Draw a single series onto the canvas (assumes context is already clipped).
   * Builds/caches paths and delegates to drawSeriesPath.
   */
  drawSeries(info: RenderableSeriesInfo, plotBox: BBox, pxRatio: number): void {
    const ctx = this.ctx;
    if (ctx == null || info.config.show === false) return;

    const group = info.config.group;
    const index = info.config.index;
    const [i0, i1] = info.window;

    let paths = this.getCachedPaths(group, index, i0, i1);

    if (paths == null) {
      const pathBuilder = info.config.paths ?? defaultPathBuilder;
      const dir = info.xScale.dir;
      const pxRound = (v: number) => v;

      // Expand window by ~10% on each side for "runway" during panning
      const span = i1 - i0;
      const pad = Math.max(1, Math.ceil(span * 0.1));
      const dataLen = info.dataX.length;
      const pi0 = Math.max(0, i0 - pad);
      const pi1 = Math.min(dataLen - 1, i1 + pad);

      const fillToCfg = info.config.fillTo;
      let fillTo: number | undefined;
      if (typeof fillToCfg === 'function') {
        fillTo = fillToCfg(info.yScale.min ?? 0, info.yScale.max ?? 0);
      } else if (fillToCfg === 0 && info.yScale.distr === Distribution.Log) {
        // Log scales can't represent 0; use 1 as the natural bar floor
        fillTo = 1;
      } else {
        fillTo = fillToCfg;
      }

      // Orientation-aware dim/off: each scale maps into width or height based on its ori.
      // Default (xScale=Horizontal, yScale=Vertical) preserves prior (width, height, left, top) behavior.
      const xHoriz = info.xScale.ori === Orientation.Horizontal;
      const yHoriz = info.yScale.ori === Orientation.Horizontal;
      const xDim = xHoriz ? plotBox.width  : plotBox.height;
      const yDim = yHoriz ? plotBox.width  : plotBox.height;
      const xOff = xHoriz ? plotBox.left   : plotBox.top;
      const yOff = yHoriz ? plotBox.left   : plotBox.top;

      paths = pathBuilder(
        info.dataX,
        info.dataY,
        info.xScale,
        info.yScale,
        xDim,
        yDim,
        xOff,
        yOff,
        pi0,
        pi1,
        dir,
        pxRound,
        { fillTo, fillToData: info.config.fillToData, spanGaps: info.config.spanGaps },
      );

      this.setCachedPaths(group, index, pi0, pi1, paths);
    }

    drawSeriesPath(ctx, info.config, paths, pxRatio, plotBox);
  }

  /**
   * Full draw cycle: clear canvas and draw all series.
   */
  draw(
    canvasWidth: number,
    canvasHeight: number,
    plotBox: BBox,
    seriesList: RenderableSeriesInfo[],
  ): void {
    const ctx = this.ctx;
    if (ctx == null) return;

    const pr = this.pxRatio;

    ctx.clearRect(0, 0, canvasWidth * pr, canvasHeight * pr);

    ctx.save();
    ctx.scale(pr, pr);
    ctx.beginPath();
    ctx.rect(plotBox.left, plotBox.top, plotBox.width, plotBox.height);
    ctx.clip();

    for (const info of seriesList) {
      this.drawSeries(info, plotBox, 1);
    }

    ctx.restore();
  }
}
