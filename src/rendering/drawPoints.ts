import type { ScaleState, BBox } from '../types';
import type { PointsConfig } from '../types/series';
import { projectPoint } from '../core/Scale';
import { round } from '../math/utils';

/**
 * Draw hollow data-point circles for a series when zoomed in enough.
 * Matches uPlot behavior: white fill + series stroke color.
 */
export function drawPoints(
  ctx: CanvasRenderingContext2D,
  dataX: ArrayLike<number>,
  dataY: ArrayLike<number | null>,
  xScale: ScaleState,
  yScale: ScaleState,
  plotBox: BBox,
  pxRatio: number,
  i0: number,
  i1: number,
  ptsCfg: PointsConfig | undefined,
  ptDia: number,
  seriesStroke: string,
): void {
  const rad = (ptDia / 2) * pxRatio;
  const strokeW = Math.max(1, round(ptDia * 0.2)) * pxRatio;
  const strokeColor = ptsCfg?.stroke ?? seriesStroke;
  const fillColor = ptsCfg?.fill ?? '#fff';

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeW;

  if (ptsCfg?.dash != null) {
    ctx.setLineDash(ptsCfg.dash.map(d => d * pxRatio));
  }

  for (let i = i0; i <= i1; i++) {
    const yVal = dataY[i];
    if (yVal == null) continue;
    const xVal = dataX[i];
    if (xVal == null) continue;

    const { px: pxCss, py: pyCss } = projectPoint(xScale, yScale, xVal, yVal, plotBox);
    const px = round(pxCss * pxRatio);
    const py = round(pyCss * pxRatio);

    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Determine whether data points should be drawn for a series.
 * Based on uPlot's seriesPointsShow logic: show when data density is low enough.
 */
export function shouldShowPoints(
  show: PointsConfig['show'],
  group: number,
  index: number,
  i0: number,
  i1: number,
  plotDim: number,
  ptSpace: number,
): boolean {
  if (typeof show === 'function') {
    return show(group, index, i0, i1, plotDim);
  }
  if (show === true) return true;
  if (show === false) return false;

  // Auto: show when there are few enough visible points
  const nVisible = i1 - i0;
  return nVisible > 0 && nVisible <= plotDim / ptSpace;
}
