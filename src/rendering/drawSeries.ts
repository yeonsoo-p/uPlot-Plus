import type { SeriesConfig, BBox } from '../types';
import type { SeriesPaths } from '../paths/types';
import type { GradientConfig, ColorValue } from '../types/series';

interface GradientCacheEntry { grad: CanvasGradient; left: number; top: number; width: number; height: number }
/** Cache gradients per (config, orientation) — separate maps so transposed and normal series don't collide. */
const gradientCacheV = new WeakMap<GradientConfig, GradientCacheEntry>();
const gradientCacheH = new WeakMap<GradientConfig, GradientCacheEntry>();

/** Resolve a ColorValue to a CanvasGradient or string */
function resolveColor(
  ctx: CanvasRenderingContext2D,
  value: ColorValue,
  plotBox: BBox,
  horizontal: boolean,
): string | CanvasGradient {
  if (typeof value === 'string') return value;
  return getCachedGradient(ctx, value, plotBox, horizontal);
}

/** Get or create a cached CanvasGradient. horizontal=true for transposed series (left→right); false for normal (top→bottom). */
function getCachedGradient(
  ctx: CanvasRenderingContext2D,
  cfg: GradientConfig,
  plotBox: BBox,
  horizontal: boolean,
): CanvasGradient {
  const cache = horizontal ? gradientCacheH : gradientCacheV;
  const cached = cache.get(cfg);
  if (cached != null && cached.left === plotBox.left && cached.top === plotBox.top &&
      cached.width === plotBox.width && cached.height === plotBox.height) {
    return cached.grad;
  }
  const grad = horizontal
    ? ctx.createLinearGradient(plotBox.left, 0, plotBox.left + plotBox.width, 0)
    : ctx.createLinearGradient(0, plotBox.top, 0, plotBox.top + plotBox.height);
  for (const [offset, color] of cfg.stops) {
    grad.addColorStop(offset, color);
  }
  cache.set(cfg, { grad, left: plotBox.left, top: plotBox.top, width: plotBox.width, height: plotBox.height });
  return grad;
}

/**
 * Draw a single series onto the canvas context.
 */
export function drawSeriesPath(
  ctx: CanvasRenderingContext2D,
  config: SeriesConfig,
  paths: SeriesPaths,
  pxRatio: number,
  plotBox?: BBox,
): void {
  if (config.show === false) return;

  const alpha = config.alpha ?? 1;

  ctx.save();

  if (alpha < 1)
    ctx.globalAlpha = alpha;

  // Apply clip path for gaps
  if (paths.clip) {
    ctx.clip(paths.clip);
  }

  const box = plotBox ?? { left: 0, top: 0, width: ctx.canvas.width / pxRatio, height: ctx.canvas.height / pxRatio };
  // For transposed series, value axis runs horizontally — gradients should follow.
  const horizontalGradient = config.transposed === true;

  // Draw fill
  if (config.fill && paths.fill) {
    ctx.fillStyle = resolveColor(ctx, config.fill, box, horizontalGradient);
    ctx.fill(paths.fill);
  }

  // Draw stroke
  if (config.stroke) {
    const lineWidth = (config.strokeWidth ?? 1) * pxRatio;
    ctx.strokeStyle = resolveColor(ctx, config.stroke, box, horizontalGradient);
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = config.join ?? 'round';
    ctx.lineCap = config.cap ?? 'butt';

    if (config.dash) {
      ctx.setLineDash(config.dash.map(d => d * pxRatio));
    }

    const offset = (lineWidth % 2) / 2;
    if (offset > 0) ctx.translate(offset, offset);
    ctx.stroke(paths.stroke);
  }

  ctx.restore();
}
