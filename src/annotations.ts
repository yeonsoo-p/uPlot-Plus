import type { DrawContext } from './types/hooks';
import type { ScaleState } from './types';
import { valToPos } from './core/Scale';

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

/** Draw a horizontal line at a y-value.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawHLine(
  dc: DrawContext,
  yScale: ScaleState,
  value: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const y = valToPos(value, yScale, plotBox.height, plotBox.top);

  ctx.beginPath();
  ctx.moveTo(plotBox.left, y);
  ctx.lineTo(plotBox.left + plotBox.width, y);
  applyStrokeStyle(ctx, style);
  ctx.stroke();
  resetDash(ctx, style);
}

/** Draw a vertical line at an x-value.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawVLine(
  dc: DrawContext,
  xScale: ScaleState,
  value: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const x = valToPos(value, xScale, plotBox.width, plotBox.left);

  ctx.beginPath();
  ctx.moveTo(x, plotBox.top);
  ctx.lineTo(x, plotBox.top + plotBox.height);
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
  const x = valToPos(xVal, xScale, plotBox.width, plotBox.left);
  const y = valToPos(yVal, yScale, plotBox.height, plotBox.top);

  ctx.font = style.font ?? '12px sans-serif';
  ctx.fillStyle = style.fill ?? '#000';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, x, y - LABEL_OFFSET_Y);
}

/** Draw a shaded region between two y-values.
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawRegion(
  dc: DrawContext,
  yScale: ScaleState,
  yMin: number,
  yMax: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const top = valToPos(yMax, yScale, plotBox.height, plotBox.top);
  const btm = valToPos(yMin, yScale, plotBox.height, plotBox.top);

  ctx.fillStyle = style.fill ?? 'rgba(255,0,0,0.1)';
  ctx.fillRect(plotBox.left, Math.min(top, btm), plotBox.width, Math.abs(btm - top));
  if (style.stroke) {
    applyStrokeStyle(ctx, style);
    ctx.strokeRect(plotBox.left, Math.min(top, btm), plotBox.width, Math.abs(btm - top));
    resetDash(ctx, style);
  }
}

/** Draw a shaded region between two x-values (vertical band).
 *  Assumes ctx is already pxRatio-scaled (handled by the library). */
export function drawVRegion(
  dc: DrawContext,
  xScale: ScaleState,
  xMin: number,
  xMax: number,
  style: AnnotationStyle = {},
): void {
  const { ctx, plotBox } = dc;
  const left = valToPos(xMin, xScale, plotBox.width, plotBox.left);
  const right = valToPos(xMax, xScale, plotBox.width, plotBox.left);

  ctx.fillStyle = style.fill ?? 'rgba(255,0,0,0.1)';
  ctx.fillRect(Math.min(left, right), plotBox.top, Math.abs(right - left), plotBox.height);
  if (style.stroke) {
    applyStrokeStyle(ctx, style);
    ctx.strokeRect(Math.min(left, right), plotBox.top, Math.abs(right - left), plotBox.height);
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
  const px1 = valToPos(x1, xScale, plotBox.width, plotBox.left);
  const py1 = valToPos(y1, yScale, plotBox.height, plotBox.top);
  const px2 = valToPos(x2, xScale, plotBox.width, plotBox.left);
  const py2 = valToPos(y2, yScale, plotBox.height, plotBox.top);

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
