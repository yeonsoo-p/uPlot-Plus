import { BAR_DEFAULTS, H_BAR_DEFAULTS } from './types';
import type { SeriesPaths, PathBuilder, PathBuilderOpts } from './types';
export type { PathBuilderOpts } from './types';
import type { ScaleState } from '../types';
import { Orientation, Direction } from '../types';
import { valToPos } from '../core/Scale';
import { at } from '../utils/at';

function withBarDefaults(fn: PathBuilder): PathBuilder {
  fn.defaults = BAR_DEFAULTS;
  return fn;
}

function withHBarDefaults(fn: PathBuilder): PathBuilder {
  fn.defaults = H_BAR_DEFAULTS;
  return fn;
}

/**
 * (col, val) → (canvasX, canvasY) projection.
 * Vertical bars: identity — column axis is canvas X, value axis is canvas Y.
 * Horizontal bars: swap — column axis is canvas Y, value axis is canvas X.
 *
 * Geometry math throughout this file is written in axis-neutral (col, val) terms;
 * the projection is the single point where orientation collapses to canvas coords.
 */
type Projection = (col: number, val: number) => [number, number];

/**
 * Bar/column chart path builder.
 * Draws bars at each data point. Direction follows scaleX.ori:
 *   Horizontal x-scale → vertical bars (default)
 *   Vertical x-scale → horizontal bars
 *
 * Ported from uPlot/src/paths/bars.js
 */
export function bars(): PathBuilder {
  const fn: PathBuilder = (
    dataX: ArrayLike<number>,
    dataY: ArrayLike<number | null>,
    scaleX: ScaleState,
    scaleY: ScaleState,
    xDim: number,
    yDim: number,
    xOff: number,
    yOff: number,
    idx0: number,
    idx1: number,
    dir: Direction,
    _pxRound: (v: number) => number,
    opts?: PathBuilderOpts,
  ): SeriesPaths => {
    const barWidthFrac = opts?.barWidth ?? 0.6;
    const extraGap = opts?.barGap ?? 0;
    const radiusFrac = opts?.barRadius ?? 0;
    const groupIdx = opts?.barGroupIdx ?? 0;
    const groupCount = opts?.barGroupCount ?? 1;

    // Column axis = scaleX (categories); value axis = scaleY (values).
    // Pixel mapping is the same in both orientations — the renderer feeds
    // the appropriate dim/off based on each scale's ori.
    const pixelForCol = (val: number) => Math.round(valToPos(val, scaleX, xDim, xOff));
    const pixelForVal = (val: number) => Math.round(valToPos(val, scaleY, yDim, yOff));

    // Find minimum column spacing from adjacent x-values
    let colWid = xDim;
    if (idx1 > idx0) {
      let minDelta = Infinity;
      let prevIdx = -1;

      for (let i = idx0; i <= idx1; i++) {
        if (dataY[i] != null) {
          if (prevIdx >= 0) {
            const dx = at(dataX, i);
            const dprev = at(dataX, prevIdx);
            const delta = Math.abs(pixelForCol(dx) - pixelForCol(dprev));
            if (delta < minDelta) minDelta = delta;
          }
          prevIdx = i;
        }
      }
      if (minDelta < Infinity) colWid = minDelta;
    }

    const gapWid = colWid * (1 - barWidthFrac);
    const fullGap = Math.max(0, gapWid + extraGap);
    const totalBarWid = Math.max(1, Math.round(colWid - fullGap));

    // For grouped bars, divide the total bar width by groupCount
    const barWid = groupCount > 1 ? Math.max(1, Math.round(totalBarWid / Math.max(1, groupCount))) : totalBarWid;

    const fillToVal = opts?.fillTo ?? scaleY.min ?? 0;
    const fillToValPx = pixelForVal(fillToVal);
    const fillToData = opts?.fillToData;

    const stroke = new Path2D();

    // Single orientation decision — all geometry below is axis-neutral.
    const project: Projection = scaleX.ori === Orientation.Horizontal
      ? (c, v) => [c, v]
      : (c, v) => [v, c];

    for (let i = dir === Direction.Forward ? idx0 : idx1; i >= idx0 && i <= idx1; i += dir) {
      const yVal = dataY[i];
      if (yVal == null) continue;

      const colPx = pixelForCol(at(dataX, i));
      const valPx = pixelForVal(yVal);

      // Per-point baseline for stacked bars, falling back to fixed fillTo
      const ptFillToVal = fillToData != null && fillToData[i] != null
        ? at(fillToData, i) ?? fillToVal
        : fillToVal;
      const ptFillToValPx = fillToData != null && fillToData[i] != null
        ? pixelForVal(ptFillToVal)
        : fillToValPx;

      // Offset for grouped bars: center the group, then shift by groupIdx
      const groupOffset = groupCount > 1
        ? (groupIdx - (groupCount - 1) / 2) * barWid
        : 0;

      // Bar in (col, val) space:
      //   - centered at colPx (with group offset) along the column axis
      //   - extends from ptFillToValPx to valPx along the value axis
      const colStart = Math.round(colPx - barWid / 2 + groupOffset);
      const valStart = Math.min(valPx, ptFillToValPx);
      const valEnd = Math.max(valPx, ptFillToValPx);
      const barLen = valEnd - valStart;

      if (barLen === 0) continue;

      if (radiusFrac > 0) {
        const rad = Math.min(radiusFrac * barWid, barLen / 2);
        // isNeg = bar's value-end is at valEnd (the larger pixel coord).
        // For positive bars, the value-end is at valStart (smaller pixel = "top" in vertical).
        drawRoundedRect(stroke, project, colStart, valStart, barWid, barLen, rad, yVal < ptFillToVal);
      } else {
        const [x, y] = project(colStart, valStart);
        const [w, h] = project(barWid, barLen);
        stroke.rect(x, y, w, h);
      }
    }

    return {
      stroke,
      fill: stroke, // bars are filled with the same path
      clip: null,
      band: null,
      gaps: null,
    };
  };
  return withBarDefaults(fn);
}

/**
 * Grouped bar chart path builder.
 * Wraps bars() to inject barGroupIdx and barGroupCount for side-by-side grouped bars.
 */
export function groupedBars(groupIdx: number, groupCount: number): PathBuilder {
  const inner = bars();
  const fn: PathBuilder = (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    const merged: PathBuilderOpts = {
      ...opts,
      barGroupIdx: groupIdx,
      barGroupCount: groupCount,
    };
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, merged);
  };
  return withBarDefaults(fn);
}

/**
 * Stacked bar chart path builder.
 * Draws wider bars (80% column width) suited for stacking.
 * Use with stackGroup() to transform data into cumulative values.
 * Pass the previous layer's stacked data as `baselineData` so bars draw from the correct baseline.
 *
 * @param baselineData - Optional cumulative data of the layer below (previous series in the stack).
 *   When provided, bars draw from the baseline to the current cumulative value instead of from 0.
 *   First (bottom) series should omit this; subsequent series pass the previous layer's stacked data.
 */
export function stackedBars(baselineData?: ArrayLike<number | null>): PathBuilder {
  const inner = bars();
  const fn: PathBuilder = (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    const merged: PathBuilderOpts = {
      barWidth: 0.8,
      ...opts,
      ...(baselineData != null ? { fillToData: baselineData } : {}),
    };
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, merged);
  };
  return withBarDefaults(fn);
}

/**
 * Horizontal bar chart path builder.
 * Identical to bars() except declares `transposed: true` via defaults, which causes
 * the chart to flip xScale.ori → Vertical and yScale.ori → Horizontal. The same
 * geometry math then produces horizontal bars via the (col, val) projection.
 */
export function horizontalBars(): PathBuilder {
  const inner = bars();
  const fn: PathBuilder = (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts);
  };
  return withHBarDefaults(fn);
}

/** Horizontal grouped bars: side-by-side bars within each category, drawn horizontally. */
export function horizontalGroupedBars(groupIdx: number, groupCount: number): PathBuilder {
  const inner = groupedBars(groupIdx, groupCount);
  const fn: PathBuilder = (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts);
  };
  return withHBarDefaults(fn);
}

/** Horizontal stacked bars: cumulative values stacked along the value axis, drawn horizontally. */
export function horizontalStackedBars(baselineData?: ArrayLike<number | null>): PathBuilder {
  const inner = stackedBars(baselineData);
  const fn: PathBuilder = (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts);
  };
  return withHBarDefaults(fn);
}

/**
 * Draw a rounded rectangle in (col, val) space with the radius on the value-end of the bar.
 * Uses arcTo (geometric, no angle math) so the drawing reflects correctly under any projection.
 *
 * @param isNeg - True if the bar's value-end is at val+valSpan (negative bar). False if at val.
 */
function drawRoundedRect(
  path: Path2D,
  project: Projection,
  col: number,
  val: number,
  colSpan: number,
  valSpan: number,
  r: number,
  isNeg: boolean,
): void {
  r = Math.min(r, colSpan / 2, valSpan / 2);

  const moveTo = (c: number, v: number): void => {
    const [x, y] = project(c, v);
    path.moveTo(x, y);
  };
  const lineTo = (c: number, v: number): void => {
    const [x, y] = project(c, v);
    path.lineTo(x, y);
  };
  const arcTo = (c1: number, v1: number, c2: number, v2: number, radius: number): void => {
    const [x1, y1] = project(c1, v1);
    const [x2, y2] = project(c2, v2);
    path.arcTo(x1, y1, x2, y2, radius);
  };

  if (!isNeg) {
    // Positive bar: round corners at val=val (the value-end)
    moveTo(col, val + valSpan);
    lineTo(col, val + r);
    arcTo(col, val, col + r, val, r);
    lineTo(col + colSpan - r, val);
    arcTo(col + colSpan, val, col + colSpan, val + r, r);
    lineTo(col + colSpan, val + valSpan);
    path.closePath();
  } else {
    // Negative bar: round corners at val=val+valSpan (the value-end)
    moveTo(col, val);
    lineTo(col + colSpan, val);
    lineTo(col + colSpan, val + valSpan - r);
    arcTo(col + colSpan, val + valSpan, col + colSpan - r, val + valSpan, r);
    lineTo(col + r, val + valSpan);
    arcTo(col, val + valSpan, col, val + valSpan - r, r);
    path.closePath();
  }
}
