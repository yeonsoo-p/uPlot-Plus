import type { BBox, ScaleState } from '../types';
import type { BandConfig } from '../types/bands';
import { valToPos } from '../core/Scale';

/**
 * Draw a filled band between two series within the plot area.
 * Renders the region between upper and lower y-values as a filled polygon.
 */
export function drawBand(
  ctx: CanvasRenderingContext2D,
  band: BandConfig,
  dataX: ArrayLike<number>,
  upperY: ArrayLike<number | null>,
  lowerY: ArrayLike<number | null>,
  xScale: ScaleState,
  yScale: ScaleState,
  plotBox: BBox,
  pxRatio: number,
  i0: number,
  i1: number,
): void {
  if (i0 > i1) return;

  const fill = band.fill ?? 'rgba(0, 120, 255, 0.1)';

  const toXPx = (val: number) => valToPos(val, xScale, plotBox.width, plotBox.left) * pxRatio;
  const toYPx = (val: number) => valToPos(val, yScale, plotBox.height, plotBox.top) * pxRatio;

  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();

  // Forward pass: upper series (left to right)
  let started = false;
  for (let i = i0; i <= i1; i++) {
    const uv = upperY[i];
    const xv = dataX[i];
    if (uv == null || xv == null) continue;

    const px = toXPx(xv);
    const py = toYPx(uv);

    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  if (!started) {
    ctx.restore();
    return;
  }

  // Reverse pass: lower series (right to left)
  for (let i = i1; i >= i0; i--) {
    const lv = lowerY[i];
    const xv = dataX[i];
    if (lv == null || xv == null) continue;

    ctx.lineTo(toXPx(xv), toYPx(lv));
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
