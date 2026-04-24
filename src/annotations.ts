import type { DrawContext } from './types/hooks';
import type { ScaleState } from './types';
import { Orientation } from './types';
import { valToPx, projectPoint } from './core/Scale';

/** Vertical offset (px) above the data point for label text baseline */
const LABEL_OFFSET_Y = 4;

function applyStrokeStyle(ctx: CanvasRenderingContext2D, style: AnnotationStyle): void {
  ctx.strokeStyle = style.stroke ?? 'red';
  ctx.lineWidth = style.width ?? 1;
  if (style.dash) ctx.setLineDash(style.dash);
}

function resetDash(ctx: CanvasRenderingContext2D, style: AnnotationStyle): void {
  if (style.dash) ctx.setLineDash([]);
}

export interface AnnotationStyle {
  stroke?: string;
  width?: number;
  dash?: number[];
  fill?: string;
  font?: string;
}

/** Draw a line at a constant scale value, perpendicular to the scale's axis.
 *  For a vertical (default) y-scale, this renders as a horizontal screen line.
 *  For a horizontal-ori y-scale (transposed chart), it renders as a vertical screen line.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawHLine(
  dc: DrawContext,
  yScale: ScaleState,
  value: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const pos = valToPx(value, yScale, plotBox);

  ctx.beginPath();
  if (yScale.ori === Orientation.Horizontal) {
    ctx.moveTo(pos, plotBox.top);
    ctx.lineTo(pos, plotBox.top + plotBox.height);
  } else {
    ctx.moveTo(plotBox.left, pos);
    ctx.lineTo(plotBox.left + plotBox.width, pos);
  }
  applyStrokeStyle(ctx, style);
  ctx.stroke();
  resetDash(ctx, style);
}

/** Draw a line at a constant scale value, perpendicular to the scale's axis.
 *  For a horizontal (default) x-scale, this renders as a vertical screen line.
 *  For a vertical-ori x-scale (transposed chart), it renders as a horizontal screen line.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawVLine(
  dc: DrawContext,
  xScale: ScaleState,
  value: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const pos = valToPx(value, xScale, plotBox);

  ctx.beginPath();
  if (xScale.ori === Orientation.Horizontal) {
    ctx.moveTo(pos, plotBox.top);
    ctx.lineTo(pos, plotBox.top + plotBox.height);
  } else {
    ctx.moveTo(plotBox.left, pos);
    ctx.lineTo(plotBox.left + plotBox.width, pos);
  }
  applyStrokeStyle(ctx, style);
  ctx.stroke();
  resetDash(ctx, style);
}

/** Draw a text label at data coordinates.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawLabel(
  dc: DrawContext,
  xScale: ScaleState,
  yScale: ScaleState,
  xVal: number,
  yVal: number,
  text: string,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const { px, py } = projectPoint(xScale, yScale, xVal, yVal, plotBox);

  ctx.font = style.font ?? '12px sans-serif';
  ctx.fillStyle = style.fill ?? '#000';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, px, py - LABEL_OFFSET_Y);
}

/** Draw a shaded region between two scale values, perpendicular to the scale's axis.
 *  For a vertical (default) y-scale, this renders as a horizontal band spanning x.
 *  For a horizontal-ori y-scale (transposed), it renders as a vertical band spanning y.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawRegion(
  dc: DrawContext,
  yScale: ScaleState,
  yMin: number,
  yMax: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const p1 = valToPx(yMax, yScale, plotBox);
  const p2 = valToPx(yMin, yScale, plotBox);
  const isHoriz = yScale.ori === Orientation.Horizontal;

  const x = isHoriz ? Math.min(p1, p2) : plotBox.left;
  const y = isHoriz ? plotBox.top : Math.min(p1, p2);
  const w = isHoriz ? Math.abs(p2 - p1) : plotBox.width;
  const h = isHoriz ? plotBox.height : Math.abs(p2 - p1);

  ctx.fillStyle = style.fill ?? 'rgba(255,0,0,0.1)';
  ctx.fillRect(x, y, w, h);
  if (style.stroke) {
    applyStrokeStyle(ctx, style);
    ctx.strokeRect(x, y, w, h);
    resetDash(ctx, style);
  }
}

/** Draw a shaded region between two scale values, perpendicular to the scale's axis.
 *  For a horizontal (default) x-scale, this renders as a vertical band spanning y.
 *  For a vertical-ori x-scale (transposed), it renders as a horizontal band spanning x.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawVRegion(
  dc: DrawContext,
  xScale: ScaleState,
  xMin: number,
  xMax: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const p1 = valToPx(xMin, xScale, plotBox);
  const p2 = valToPx(xMax, xScale, plotBox);
  const isHoriz = xScale.ori === Orientation.Horizontal;

  const x = isHoriz ? Math.min(p1, p2) : plotBox.left;
  const y = isHoriz ? plotBox.top : Math.min(p1, p2);
  const w = isHoriz ? Math.abs(p2 - p1) : plotBox.width;
  const h = isHoriz ? plotBox.height : Math.abs(p2 - p1);

  ctx.fillStyle = style.fill ?? 'rgba(255,0,0,0.1)';
  ctx.fillRect(x, y, w, h);
  if (style.stroke) {
    applyStrokeStyle(ctx, style);
    ctx.strokeRect(x, y, w, h);
    resetDash(ctx, style);
  }
}

export interface DiagonalLineStyle extends AnnotationStyle {
  extend?: boolean;
  label?: string;
  labelFont?: string;
}

/** Draw a line between two arbitrary data points.
 *  When `extend` is true the line is extrapolated to the plot-box edges.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawDiagonalLine(
  dc: DrawContext,
  xScale: ScaleState,
  yScale: ScaleState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: DiagonalLineStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const { px: px1, py: py1 } = projectPoint(xScale, yScale, x1, y1, plotBox);
  const { px: px2, py: py2 } = projectPoint(xScale, yScale, x2, y2, plotBox);

  let drawX1 = px1;
  let drawY1 = py1;
  let drawX2 = px2;
  let drawY2 = py2;

  if (style.extend) {
    const dx = px2 - px1;
    const dy = py2 - py1;

    if (dx !== 0 || dy !== 0) {
      let tMin = -Infinity;
      let tMax = Infinity;

      if (dx !== 0) {
        const tLeft = (plotBox.left - px1) / dx;
        const tRight = (plotBox.left + plotBox.width - px1) / dx;
        tMin = Math.max(tMin, Math.min(tLeft, tRight));
        tMax = Math.min(tMax, Math.max(tLeft, tRight));
      }

      if (dy !== 0) {
        const tTop = (plotBox.top - py1) / dy;
        const tBottom = (plotBox.top + plotBox.height - py1) / dy;
        tMin = Math.max(tMin, Math.min(tTop, tBottom));
        tMax = Math.min(tMax, Math.max(tTop, tBottom));
      }

      if (tMin < tMax) {
        drawX1 = px1 + tMin * dx;
        drawY1 = py1 + tMin * dy;
        drawX2 = px1 + tMax * dx;
        drawY2 = py1 + tMax * dy;
      }
    }
  }

  ctx.beginPath();
  ctx.moveTo(drawX1, drawY1);
  ctx.lineTo(drawX2, drawY2);
  applyStrokeStyle(ctx, style);
  ctx.stroke();
  resetDash(ctx, style);

  if (style.label) {
    const mx = (drawX1 + drawX2) / 2;
    const my = (drawY1 + drawY2) / 2;
    ctx.font = style.labelFont ?? style.font ?? '12px sans-serif';
    ctx.fillStyle = style.stroke ?? 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(style.label, mx, my - LABEL_OFFSET_Y);
  }
}

/** Convert slope + intercept to two data-space points using the current x-scale range. */
function slopeInterceptToPoints(
  slope: number,
  intercept: number,
  xScale: ScaleState,
): [number, number, number, number] {
  const xMin = xScale.min ?? 0;
  const xMax = xScale.max ?? 1;
  return [xMin, slope * xMin + intercept, xMax, slope * xMax + intercept];
}

/** Draw a line defined by slope and intercept (y = slope * x + intercept).
 *  Defaults to `extend: true` since the line is conceptually infinite.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawSlopeInterceptLine(
  dc: DrawContext,
  xScale: ScaleState,
  yScale: ScaleState,
  slope: number,
  intercept: number,
  style: DiagonalLineStyle = {},
): void {
  const [x1, y1, x2, y2] = slopeInterceptToPoints(slope, intercept, xScale);
  drawDiagonalLine(dc, xScale, yScale, x1, y1, x2, y2, { ...style, extend: style.extend ?? true });
}
