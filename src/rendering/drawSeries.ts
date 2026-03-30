import type { SeriesConfig, BBox } from '../types';
import type { SeriesPaths } from '../paths/types';
import type { GradientConfig, ColorValue } from '../types/series';

/** Cache gradients by config identity + plotBox dimensions to avoid recreation every frame */
const gradientCache = new WeakMap<GradientConfig, { grad: CanvasGradient; left: number; top: number; width: number; height: number }>();

/** Resolve a ColorValue to a CanvasGradient or string */
function resolveColor(
  ctx: CanvasRenderingContext2D,
  value: ColorValue,
  plotBox: BBox,
): string | CanvasGradient {
  if (typeof value === 'string') return value;
  return getCachedGradient(ctx, value, plotBox);
}

/** Get or create a cached CanvasGradient */
function getCachedGradient(
  ctx: CanvasRenderingContext2D,
  cfg: GradientConfig,
  plotBox: BBox,
): CanvasGradient {
  const cached = gradientCache.get(cfg);
  if (cached != null && cached.left === plotBox.left && cached.top === plotBox.top &&
      cached.width === plotBox.width && cached.height === plotBox.height) {
    return cached.grad;
  }
  const grad = ctx.createLinearGradient(0, plotBox.top, 0, plotBox.top + plotBox.height);
  for (const [offset, color] of cfg.stops) {
    grad.addColorStop(offset, color);
  }
  gradientCache.set(cfg, { grad, left: plotBox.left, top: plotBox.top, width: plotBox.width, height: plotBox.height });
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

  // Draw fill
  if (config.fill && paths.fill) {
    ctx.fillStyle = resolveColor(ctx, config.fill, box);
    ctx.fill(paths.fill);
  }

  // Draw stroke
  if (config.stroke) {
    const lineWidth = (config.width ?? 1) * pxRatio;
    ctx.strokeStyle = resolveColor(ctx, config.stroke, box);
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = config.join ?? 'round';
    ctx.lineCap = config.cap ?? 'butt';

    if (config.dash) {
      ctx.setLineDash(config.dash.map(d => d * pxRatio));
    }

    // Pixel alignment: shift by half-pixel for odd-width lines to avoid anti-aliasing blur
    const pxAlign = config.pxAlign ?? 0;
    const offset = (lineWidth % 2) / 2;
    const doAlign = pxAlign === 1 && offset > 0;

    if (doAlign) ctx.translate(offset, offset);
    ctx.stroke(paths.stroke);
    // No need to un-translate: ctx.restore() below resets the transform
  }

  ctx.restore();
}
