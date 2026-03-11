import type { SeriesConfig } from '../types';
import type { SeriesPaths } from '../paths/types';

/**
 * Draw a single series onto the canvas context.
 */
export function drawSeriesPath(
  ctx: CanvasRenderingContext2D,
  config: SeriesConfig,
  paths: SeriesPaths,
  pxRatio: number,
): void {
  if (!config.show) return;

  const alpha = config.alpha ?? 1;

  ctx.save();

  if (alpha < 1)
    ctx.globalAlpha = alpha;

  // Apply clip path for gaps
  if (paths.clip) {
    ctx.clip(paths.clip);
  }

  // Draw fill
  if (config.fill && paths.fill) {
    ctx.fillStyle = config.fill;
    ctx.fill(paths.fill);
  }

  // Draw stroke
  if (config.stroke) {
    ctx.strokeStyle = config.stroke;
    ctx.lineWidth = (config.width ?? 1) * pxRatio;
    ctx.lineJoin = config.join ?? 'round';
    ctx.lineCap = config.cap ?? 'butt';

    if (config.dash) {
      ctx.setLineDash(config.dash.map(d => d * pxRatio));
    }

    ctx.stroke(paths.stroke);
  }

  ctx.restore();
}
