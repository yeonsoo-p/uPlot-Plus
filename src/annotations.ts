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
