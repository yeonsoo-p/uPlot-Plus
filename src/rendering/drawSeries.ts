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
  if (config.show === false) return;

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
    const lineWidth = (config.width ?? 1) * pxRatio;
    ctx.strokeStyle = config.stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = config.join ?? 'round';
    ctx.lineCap = config.cap ?? 'butt';

    if (config.dash) {
      ctx.setLineDash(config.dash.map(d => d * pxRatio));
    }

    // Pixel alignment: shift by half-pixel for odd-width lines to avoid anti-aliasing blur
    const pxAlign = config.pxAlign ?? 1;
    const offset = (lineWidth % 2) / 2;
    const doAlign = pxAlign === 1 && offset > 0;

    if (doAlign) ctx.translate(offset, offset);
    ctx.stroke(paths.stroke);
    if (doAlign) ctx.translate(-offset, -offset);
  }

  ctx.restore();
}
