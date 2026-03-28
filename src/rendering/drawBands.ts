import type { BBox, ScaleState } from '../types';
import type { BandConfig } from '../types/bands';
import { valToPos } from '../core/Scale';
import { hasData } from '../math/utils';

/**
 * Build a Path2D for the filled region between two series.
 * Returns null if no valid points exist.
 */
export function buildBandPath(
  dataX: ArrayLike<number>,
  upperY: ArrayLike<number | null>,
  lowerY: ArrayLike<number | null>,
  xScale: ScaleState,
  yScale: ScaleState,
  plotBox: BBox,
  pxRatio: number,
  i0: number,
  i1: number,
): Path2D | null {
  if (i0 > i1 || i0 < 0) return null;

  // Skip if both series are all-null in the visible range
  if (!hasData(upperY, i0, i1) && !hasData(lowerY, i0, i1)) return null;

  const toXPx = (val: number) => valToPos(val, xScale, plotBox.width, plotBox.left) * pxRatio;
  const toYPx = (val: number) => valToPos(val, yScale, plotBox.height, plotBox.top) * pxRatio;

  const path = new Path2D();
  let started = false;

  // Forward pass: upper series (left to right)
  for (let i = i0; i <= i1; i++) {
    const uv = upperY[i];
    const xv = dataX[i];
    if (uv == null || xv == null) continue;

    const px = toXPx(xv);
    const py = toYPx(uv);

    if (!started) {
      path.moveTo(px, py);
      started = true;
    } else {
      path.lineTo(px, py);
    }
  }

  if (!started) return null;

  // Reverse pass: lower series (right to left)
  for (let i = i1; i >= i0; i--) {
    const lv = lowerY[i];
    const xv = dataX[i];
    if (lv == null || xv == null) continue;

    path.lineTo(toXPx(xv), toYPx(lv));
  }

  path.closePath();
  return path;
}

/**
 * Draw a pre-built band path onto the canvas.
 */
export function drawBandPath(
  ctx: CanvasRenderingContext2D,
  band: BandConfig,
  path: Path2D,
): void {
  ctx.save();
  ctx.fillStyle = band.fill ?? 'rgba(0, 120, 255, 0.1)';
  ctx.fill(path);
  ctx.restore();
}
