import type { ScaleState, BBox } from '../types';
import type { AxisState } from '../types/axes';
import { Side, Orientation, sideOrientation } from '../types';
import { valToPos, isScaleReady } from '../core/Scale';
import { round, PI } from '../math/utils';

const TOP = 'top';
const BOTTOM = 'bottom';
const LEFT = 'left';
const RIGHT = 'right';

/** Scale the px size in a CSS font string by pxRatio for HiDPI canvas rendering. */
function scaleFontPx(font: string, pxRatio: number): string {
  if (pxRatio === 1) return font;
  return font.replace(/(\d+(?:\.\d+)?)px/, (_, n) => `${Math.round(Number(n) * pxRatio)}px`);
}

/**
 * Draw a set of orthogonal lines (ticks or grid).
 * Ported from uPlot uPlot.js drawOrthoLines.
 */
function drawOrthoLines(
  ctx: CanvasRenderingContext2D,
  offs: number[],
  filts: (string | null)[],
  ori: Orientation,
  side: Side,
  pos0: number,
  len: number,
  width: number,
  stroke: string,
  dash: number[],
  _pxRatio: number,
): void {
  const offset = (width % 2) / 2;

  ctx.save();
  ctx.translate(offset, offset);

  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  if (dash.length > 0) ctx.setLineDash(dash);

  ctx.beginPath();

  let x0 = 0;
  let y0 = 0;
  let x1 = 0;
  let y1 = 0;
  const pos1 = pos0 + (side === Side.Top || side === Side.Left ? -len : len);

  if (ori === Orientation.Horizontal) {
    y0 = pos0;
    y1 = pos1;
  } else {
    x0 = pos0;
    x1 = pos1;
  }

  for (let i = 0; i < offs.length; i++) {
    if (filts[i] != null) {
      if (ori === Orientation.Horizontal) {
        x0 = x1 = offs[i] ?? 0;
      } else {
        y0 = y1 = offs[i] ?? 0;
      }

      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
  }

  ctx.stroke();

  ctx.restore();
}

/**
 * Draw all axes: grid lines, tick marks, tick labels, axis labels, borders.
 * Ported from uPlot uPlot.js drawAxesGrid.
 */
export function drawAxesGrid(
  ctx: CanvasRenderingContext2D,
  axisStates: AxisState[],
  getScale: (id: string) => ScaleState | undefined,
  plotBox: BBox,
  pxRatio: number,
  title?: string,
): void {
  // Read CSS custom properties for themeable defaults (set by e.g. a .dark class)
  const cs = ctx.canvas != null ? getComputedStyle(ctx.canvas) : null;
  const cssVar = (name: string) => cs?.getPropertyValue(name).trim() || '';

  const plotLft = round(plotBox.left * pxRatio);
  const plotTop = round(plotBox.top * pxRatio);
  const plotWid = round(plotBox.width * pxRatio);
  const plotHgt = round(plotBox.height * pxRatio);

  for (const axis of axisStates) {
    if (!axis._show)
      continue;

    const config = axis.config;
    const side = config.side;
    const ori = sideOrientation(side);

    const scale = getScale(config.scale);
    if (!scale || !isScaleReady(scale))
      continue;

    const fillStyle = config.stroke ?? (cssVar('--uplot-axis-stroke') || '#000');

    const shiftDir = side === Side.Top || side === Side.Left ? -1 : 1;

    const splits = axis._splits;
    const values = axis._values;

    if (!splits || !values || axis._space === 0)
      continue;

    const plotDim = ori === Orientation.Horizontal ? plotBox.width : plotBox.height;
    const plotOff = ori === Orientation.Horizontal ? plotBox.left : plotBox.top;

    // Compute pixel positions for each split
    const canOffs = splits.map(val => round(valToPos(val, scale, plotDim, plotOff) * pxRatio));

    // Filter values (non-null entries)
    const filts: (string | null)[] = values.map(v => v === '' ? null : v);

    // Draw grid lines
    const grid = config.grid;
    if (grid?.show !== false) {
      const gridStroke = grid?.stroke ?? (cssVar('--uplot-grid-stroke') || 'rgba(0,0,0,0.12)');
      const gridWidth = round((grid?.width ?? 2) * pxRatio);
      const gridDash = (grid?.dash ?? []).map(d => d * pxRatio);

      const gridPos = ori === Orientation.Horizontal ? plotTop : plotLft;
      const gridLen = ori === Orientation.Horizontal ? plotHgt : plotWid;

      drawOrthoLines(ctx, canOffs, filts, ori, 2, gridPos, gridLen, gridWidth, gridStroke, gridDash, pxRatio);
    }

    // Draw tick marks
    const ticks = config.ticks;
    if (ticks?.show !== false) {
      const tickStroke = ticks?.stroke ?? fillStyle;
      const tickWidth = round((ticks?.width ?? 1) * pxRatio);
      const tickSize = round((ticks?.size ?? 10) * pxRatio);
      const tickDash = (ticks?.dash ?? []).map(d => d * pxRatio);

      const tickPos = round(axis._pos * pxRatio);

      drawOrthoLines(ctx, canOffs, filts, ori, side, tickPos, tickSize, tickWidth, tickStroke, tickDash, pxRatio);
    }

    // Draw tick labels
    {
      const tickSize = ticks?.show !== false ? ((ticks?.size ?? 10) * pxRatio) : 0;
      const axisGap = round((config.gap ?? 5) * pxRatio);

      const basePos = round(axis._pos * pxRatio);
      const shiftAmt = (tickSize + axisGap) * shiftDir;
      const finalPos = basePos + shiftAmt;

      const font = scaleFontPx(config.font ?? '12px system-ui, sans-serif', pxRatio);
      const textAlign: CanvasTextAlign = ori === Orientation.Horizontal ? 'center' : (side === Side.Left ? RIGHT : LEFT) as CanvasTextAlign;
      const textBaseline: CanvasTextBaseline = ori === Orientation.Horizontal ? (side === Side.Bottom ? TOP : BOTTOM) as CanvasTextBaseline : 'middle';

      ctx.font = font;
      ctx.fillStyle = fillStyle;
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;

      const angle = axis._rotate * -PI / 180;

      if (angle !== 0) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        for (let i = 0; i < values.length; i++) {
          const val = values[i];

          if (val == null || val === '')
            continue;

          const off = canOffs[i] ?? 0;
          ctx.setTransform(cos, sin, -sin, cos, off, finalPos);
          ctx.fillText(val, 0, 0);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        for (let i = 0; i < values.length; i++) {
          const val = values[i];

          if (val == null || val === '')
            continue;

          const off = canOffs[i] ?? 0;
          const x = ori === Orientation.Horizontal ? off : finalPos;
          const y = ori === Orientation.Horizontal ? finalPos : off;
          ctx.fillText(val, x, y);
        }
      }
    }

    // Draw axis label
    if (config.label != null) {
      const labelFont = scaleFontPx(config.labelFont ?? 'bold 12px system-ui, sans-serif', pxRatio);

      ctx.font = labelFont;
      ctx.fillStyle = fillStyle;
      ctx.textAlign = 'center';
      ctx.textBaseline = side === Side.Bottom ? TOP as CanvasTextBaseline : BOTTOM as CanvasTextBaseline;

      const baseLpos = round((axis._lpos + (config.labelGap ?? 0) * shiftDir) * pxRatio);

      if (ori === Orientation.Vertical) {
        // Vertical axis label (rotated)
        ctx.save();
        ctx.translate(
          baseLpos,
          round((plotTop + plotHgt / 2)),
        );
        ctx.rotate((side === Side.Left ? -PI : PI) / 2);
        ctx.fillText(config.label, 0, 0);
        ctx.restore();
      } else {
        // Horizontal axis label
        ctx.fillText(config.label, round(plotLft + plotWid / 2), baseLpos);
      }
    }

    // Draw axis border
    const border = config.border;
    if (border?.show !== false && border != null) {
      const borderStroke = border.stroke ?? fillStyle;
      const borderWidth = round((border.width ?? 1) * pxRatio);
      const borderDash = (border.dash ?? []).map(d => d * pxRatio);

      const borderPos = round(axis._pos * pxRatio);

      ctx.strokeStyle = borderStroke;
      ctx.lineWidth = borderWidth;
      if (borderDash.length > 0) ctx.setLineDash(borderDash);

      ctx.beginPath();

      if (ori === Orientation.Horizontal) {
        ctx.moveTo(plotLft, borderPos);
        ctx.lineTo(plotLft + plotWid, borderPos);
      } else {
        ctx.moveTo(borderPos, plotTop);
        ctx.lineTo(borderPos, plotTop + plotHgt);
      }

      ctx.stroke();
      if (borderDash.length > 0) ctx.setLineDash([]);
    }
  }

  // Draw chart title centered over plot area
  if (title != null) {
    const titleFont = scaleFontPx('bold 14px system-ui, sans-serif', pxRatio);
    ctx.font = titleFont;
    ctx.fillStyle = cssVar('--uplot-title-fill') || '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, round(plotLft + plotWid / 2), round(4 * pxRatio));
  }
}
