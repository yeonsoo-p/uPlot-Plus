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

  // --- Path cache with scale-range keying and LRU eviction ---
  private pathCache = new Map<string, SeriesPaths>();
  private cacheOrder: string[] = [];

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

  // --- Path cache ---

  /** Build cache key incorporating scale range for invalidation */
  private cacheKey(group: number, index: number, xMin: number | null, xMax: number | null): string {
    return `${group}:${index}:${xMin ?? ''}:${xMax ?? ''}`;
  }

  /** Get cached paths for a series */
  getCachedPaths(group: number, index: number, xMin: number | null, xMax: number | null): SeriesPaths | undefined {
    const key = this.cacheKey(group, index, xMin, xMax);
    const paths = this.pathCache.get(key);
    if (paths != null) {
      // Move to end for LRU
      const idx = this.cacheOrder.indexOf(key);
      if (idx !== -1) {
        this.cacheOrder.splice(idx, 1);
        this.cacheOrder.push(key);
      }
    }
    return paths;
  }

  /** Store paths in cache */
  setCachedPaths(group: number, index: number, xMin: number | null, xMax: number | null, paths: SeriesPaths): void {
    const key = this.cacheKey(group, index, xMin, xMax);

    if (!this.pathCache.has(key)) {
      // Evict oldest if at capacity
      while (this.cacheOrder.length >= MAX_CACHE_SIZE) {
        const oldest = this.cacheOrder.shift();
        if (oldest != null) {
          this.pathCache.delete(oldest);
        }
      }
      this.cacheOrder.push(key);
    }

    this.pathCache.set(key, paths);
  }

  /** Invalidate paths for a specific series (all scale ranges) */
  invalidateSeries(group: number, index: number): void {
    const prefix = `${group}:${index}:`;
    const toRemove: string[] = [];
    for (const key of this.pathCache.keys()) {
      if (key.startsWith(prefix)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.pathCache.delete(key);
      const idx = this.cacheOrder.indexOf(key);
      if (idx !== -1) {
        this.cacheOrder.splice(idx, 1);
      }
    }
  }

  /** Invalidate all cached paths (e.g. on scale change) */
  clearCache(): void {
    this.pathCache.clear();
    this.cacheOrder.length = 0;
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
    const xMin = info.xScale.min;
    const xMax = info.xScale.max;

    let paths = this.getCachedPaths(group, index, xMin, xMax);

    if (paths == null) {
      const pathBuilder = info.config.paths ?? defaultPathBuilder;
      const dir = info.xScale.dir;
      const pxRound = (v: number) => round(v);

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
        info.window[0],
        info.window[1],
        dir,
        pxRound,
        { fillTo, spanGaps: info.config.spanGaps },
      );

      this.setCachedPaths(group, index, xMin, xMax, paths);
    }

    drawSeriesPath(ctx, info.config, paths, pxRatio);
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
