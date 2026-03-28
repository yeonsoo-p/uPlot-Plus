import type { SeriesConfig, ScaleState, BBox } from '../types';
import type { SeriesPaths } from '../paths/types';
import { linear } from '../paths/linear';
import { drawSeriesPath } from './drawSeries';
import { round } from '../math/utils';

const defaultPathBuilder = linear();

export interface RenderableSeriesInfo {
  config: SeriesConfig;
  dataX: ArrayLike<number>;
  dataY: ArrayLike<number | null>;
  xScale: ScaleState;
  yScale: ScaleState;
  window: [number, number];
}

/** Maximum number of cached path entries before full cache clear */
const MAX_CACHE_SIZE = 64;

/** Doubly-linked list node for O(1) LRU promotion */
interface LruNode {
  group: number;
  index: number;
  key: string;
  prev: LruNode | null;
  next: LruNode | null;
}

/**
 * Imperative canvas renderer.
 * Handles clearing, drawing series, and (later) axes, cursor, selection.
 * This is completely decoupled from React.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private pxRatio = 1;

  // --- Two-level path cache: group -> index -> windowKey -> SeriesPaths ---
  // Enables O(1) invalidation by group or series without string prefix scanning.
  private pathCache = new Map<number, Map<number, Map<string, SeriesPaths>>>();
  private pathCacheSize = 0;

  // --- Band path cache: keyed by group:upper:lower:i0:i1 ---
  private bandCache = new Map<string, Path2D>();

  // Scale-stamp: fingerprint of all active scale ranges. Auto-clears cache on zoom.
  private scaleStamp = '';

  // LRU tracking: doubly-linked list + Map for O(1) promotion and eviction
  private lruHead: LruNode | null = null; // oldest
  private lruTail: LruNode | null = null; // newest
  private lruMap = new Map<string, LruNode>();

  private lruKey(group: number, index: number, key: string): string {
    return `${group}:${index}:${key}`;
  }

  /** Unlink a node from the doubly-linked list */
  private lruUnlink(node: LruNode): void {
    if (node.prev != null) node.prev.next = node.next;
    else this.lruHead = node.next;
    if (node.next != null) node.next.prev = node.prev;
    else this.lruTail = node.prev;
    node.prev = null;
    node.next = null;
  }

  /** Append a node to the tail (most-recently-used) */
  private lruAppend(node: LruNode): void {
    node.prev = this.lruTail;
    node.next = null;
    if (this.lruTail != null) this.lruTail.next = node;
    else this.lruHead = node;
    this.lruTail = node;
  }

  // --- Offscreen canvas for cursor-only snapshot (avoids getImageData/putImageData) ---
  private snapshotCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private snapshotValid = false;

  // --- Context property cache (F1) ---
  private cachedFillStyle = '';
  private cachedStrokeStyle = '';
  private cachedLineWidth = -1;
  private cachedFont = '';
  private cachedTextAlign = '';
  private cachedTextBaseline = '';
  private cachedGlobalAlpha = -1;

  setContext(ctx: CanvasRenderingContext2D, pxRatio: number): void {
    this.ctx = ctx;
    this.pxRatio = pxRatio;
    this.resetPropertyCache();
  }

  /** Reset cached property values (after context change) */
  private resetPropertyCache(): void {
    this.cachedFillStyle = '';
    this.cachedStrokeStyle = '';
    this.cachedLineWidth = -1;
    this.cachedFont = '';
    this.cachedTextAlign = '';
    this.cachedTextBaseline = '';
    this.cachedGlobalAlpha = -1;
  }

  /** Set fillStyle only if changed */
  setFillStyle(ctx: CanvasRenderingContext2D, val: string): void {
    if (val !== this.cachedFillStyle) {
      ctx.fillStyle = val;
      this.cachedFillStyle = val;
    }
  }

  /** Set strokeStyle only if changed */
  setStrokeStyle(ctx: CanvasRenderingContext2D, val: string): void {
    if (val !== this.cachedStrokeStyle) {
      ctx.strokeStyle = val;
      this.cachedStrokeStyle = val;
    }
  }

  /** Set lineWidth only if changed */
  setLineWidth(ctx: CanvasRenderingContext2D, val: number): void {
    if (val !== this.cachedLineWidth) {
      ctx.lineWidth = val;
      this.cachedLineWidth = val;
    }
  }

  /** Set font only if changed */
  setFont(ctx: CanvasRenderingContext2D, val: string): void {
    if (val !== this.cachedFont) {
      ctx.font = val;
      this.cachedFont = val;
    }
  }

  /** Set textAlign only if changed */
  setTextAlign(ctx: CanvasRenderingContext2D, val: CanvasTextAlign): void {
    if (val !== this.cachedTextAlign) {
      ctx.textAlign = val;
      this.cachedTextAlign = val;
    }
  }

  /** Set textBaseline only if changed */
  setTextBaseline(ctx: CanvasRenderingContext2D, val: CanvasTextBaseline): void {
    if (val !== this.cachedTextBaseline) {
      ctx.textBaseline = val;
      this.cachedTextBaseline = val;
    }
  }

  /** Set globalAlpha only if changed */
  setGlobalAlpha(ctx: CanvasRenderingContext2D, val: number): void {
    if (val !== this.cachedGlobalAlpha) {
      ctx.globalAlpha = val;
      this.cachedGlobalAlpha = val;
    }
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

  // --- Two-level path cache ---

  private windowKey(i0: number, i1: number): string {
    return `${i0}:${i1}`;
  }

  /** Get cached paths for a series, promoting to most-recently-used.
   *  Falls back to a superset window match if exact key misses. */
  getCachedPaths(group: number, index: number, i0: number, i1: number): SeriesPaths | undefined {
    const groupMap = this.pathCache.get(group);
    if (groupMap == null) return undefined;
    const indexMap = groupMap.get(index);
    if (indexMap == null) return undefined;
    const wk = this.windowKey(i0, i1);
    let paths = indexMap.get(wk);

    // Superset fallback: check if any cached window fully contains the requested range
    if (paths == null) {
      for (const [cachedWk, cachedPaths] of indexMap) {
        const sep = cachedWk.indexOf(':');
        const ci0 = +cachedWk.slice(0, sep);
        const ci1 = +cachedWk.slice(sep + 1);
        if (ci0 <= i0 && ci1 >= i1) {
          paths = cachedPaths;
          // Promote the superset entry
          const node = this.lruMap.get(this.lruKey(group, index, cachedWk));
          if (node != null && node !== this.lruTail) {
            this.lruUnlink(node);
            this.lruAppend(node);
          }
          break;
        }
      }
    } else {
      // O(1) promote to most-recently-used
      const node = this.lruMap.get(this.lruKey(group, index, wk));
      if (node != null && node !== this.lruTail) {
        this.lruUnlink(node);
        this.lruAppend(node);
      }
    }
    return paths;
  }

  /** Store paths in cache, evicting oldest 25% when at capacity.
   *  Callers may pass padded i0/i1 (wider than the visible window) for "runway" during panning. */
  setCachedPaths(group: number, index: number, i0: number, i1: number, paths: SeriesPaths): void {
    // LRU eviction: remove oldest 25% when at capacity
    if (this.pathCacheSize >= MAX_CACHE_SIZE) {
      const evictCount = MAX_CACHE_SIZE >> 2; // 25%
      let cur = this.lruHead;
      for (let i = 0; i < evictCount && cur != null; i++) {
        const next = cur.next;
        const gm = this.pathCache.get(cur.group);
        if (gm != null) {
          const im = gm.get(cur.index);
          if (im != null) {
            im.delete(cur.key);
            this.pathCacheSize--;
            if (im.size === 0) gm.delete(cur.index);
            if (gm.size === 0) this.pathCache.delete(cur.group);
          }
        }
        this.lruMap.delete(this.lruKey(cur.group, cur.index, cur.key));
        cur = next;
      }
      this.lruHead = cur;
      if (cur != null) cur.prev = null;
      else this.lruTail = null;
    }

    let groupMap = this.pathCache.get(group);
    if (groupMap == null) {
      groupMap = new Map();
      this.pathCache.set(group, groupMap);
    }

    let indexMap = groupMap.get(index);
    if (indexMap == null) {
      indexMap = new Map();
      groupMap.set(index, indexMap);
    }

    const wk = this.windowKey(i0, i1);
    const lk = this.lruKey(group, index, wk);
    if (!indexMap.has(wk)) {
      this.pathCacheSize++;
      const node: LruNode = { group, index, key: wk, prev: null, next: null };
      this.lruAppend(node);
      this.lruMap.set(lk, node);
    }
    indexMap.set(wk, paths);
  }

  /** Invalidate paths for a specific series (all windows) */
  invalidateSeries(group: number, index: number): void {
    const groupMap = this.pathCache.get(group);
    if (groupMap == null) return;
    const indexMap = groupMap.get(index);
    if (indexMap != null) {
      this.pathCacheSize -= indexMap.size;
      // Remove LRU nodes for all window keys of this series
      for (const wk of indexMap.keys()) {
        const lk = this.lruKey(group, index, wk);
        const node = this.lruMap.get(lk);
        if (node != null) {
          this.lruUnlink(node);
          this.lruMap.delete(lk);
        }
      }
      groupMap.delete(index);
    }
  }

  /** Invalidate cached paths for a specific group */
  clearGroupCache(group: number): void {
    const groupMap = this.pathCache.get(group);
    if (groupMap != null) {
      for (const [index, indexMap] of groupMap.entries()) {
        this.pathCacheSize -= indexMap.size;
        for (const wk of indexMap.keys()) {
          const lk = this.lruKey(group, index, wk);
          const node = this.lruMap.get(lk);
          if (node != null) {
            this.lruUnlink(node);
            this.lruMap.delete(lk);
          }
        }
      }
      this.pathCache.delete(group);
    }
    // Clear band paths for this group
    for (const bk of this.bandCache.keys()) {
      if (bk.startsWith(`${group}:`)) {
        this.bandCache.delete(bk);
      }
    }
    this.invalidateSnapshot();
  }

  /** Invalidate all cached paths (e.g. on scale change) */
  clearCache(): void {
    this.pathCache.clear();
    this.pathCacheSize = 0;
    this.lruHead = null;
    this.lruTail = null;
    this.lruMap.clear();
    this.bandCache.clear();
    this.invalidateSnapshot();
  }

  // --- Band path cache ---

  private bandKey(group: number, upper: number, lower: number, i0: number, i1: number): string {
    return `${group}:${upper}:${lower}:${i0}:${i1}`;
  }

  getCachedBandPath(group: number, upper: number, lower: number, i0: number, i1: number): Path2D | undefined {
    return this.bandCache.get(this.bandKey(group, upper, lower, i0, i1));
  }

  setCachedBandPath(group: number, upper: number, lower: number, i0: number, i1: number, path: Path2D): void {
    this.bandCache.set(this.bandKey(group, upper, lower, i0, i1), path);
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
      const pxRound = (v: number) => round(v);

      // Expand window by ~10% on each side for "runway" during panning
      const span = i1 - i0;
      const pad = Math.max(1, Math.ceil(span * 0.1));
      const dataLen = info.dataX.length;
      const pi0 = Math.max(0, i0 - pad);
      const pi1 = Math.min(dataLen - 1, i1 + pad);

      const fillToCfg = info.config.fillTo;
      const fillTo = typeof fillToCfg === 'function'
        ? fillToCfg(info.yScale.min ?? 0, info.yScale.max ?? 0)
        : fillToCfg;

      paths = pathBuilder(
        info.dataX,
        info.dataY,
        info.xScale,
        info.yScale,
        plotBox.width,
        plotBox.height,
        plotBox.left,
        plotBox.top,
        pi0,
        pi1,
        dir,
        pxRound,
        { fillTo, spanGaps: info.config.spanGaps },
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
    this.resetPropertyCache();
  }
}
