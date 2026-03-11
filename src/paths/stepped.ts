import type { SeriesPaths, PathBuilder, PathBuilderOpts } from './types';
import type { ScaleState } from '../types';
import { valToPos } from '../core/Scale';
import { nonNullIdxs } from '../math/utils';
import { lineToH, lineToV, findGaps, clipGaps } from './utils';

/**
 * Stepped (staircase) path builder.
 * Supports align: 1 (step after), -1 (step before), 0 (mid-step).
 *
 * Ported from uPlot/src/paths/stepped.js
 */
export function stepped(): PathBuilder {
  return (
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
    dir: 1 | -1,
    pxRound: (v: number) => number,
    opts?: PathBuilderOpts,
  ): SeriesPaths => {
    const align = opts?.align ?? 1;
    const spanGaps = opts?.spanGaps ?? false;

    [idx0, idx1] = nonNullIdxs(dataY, idx0, idx1);

    if (idx0 === -1) {
      return { stroke: new Path2D(), fill: null, clip: null, band: null, gaps: null };
    }

    const pixelForX = (val: number) => pxRound(valToPos(val, scaleX, xDim, xOff));
    const pixelForY = (val: number) => pxRound(valToPos(val, scaleY, yDim, yOff));

    const lineTo = scaleX.ori === 0 ? lineToH : lineToV;

    const _paths: SeriesPaths = { stroke: new Path2D(), fill: null, clip: null, band: null, gaps: null };
    const stroke = _paths.stroke;

    let hasGap = false;

    const startIdx = dir === 1 ? idx0 : idx1;
    let prevYPos = pixelForY(dataY[startIdx] as number);
    let prevXPos = pixelForX(dataX[startIdx] as number);

    lineTo(stroke, prevXPos, prevYPos);

    for (let i = startIdx; i >= idx0 && i <= idx1; i += dir) {
      const yVal = dataY[i];

      if (yVal == null) {
        if (yVal === null && !spanGaps)
          hasGap = true;
        continue;
      }

      const x1 = pixelForX(dataX[i] as number);
      const y1 = pixelForY(yVal);

      if (align === 1) {
        // Step after: horizontal to new x at old y, then vertical to new y
        lineTo(stroke, x1, prevYPos);
      } else if (align === -1) {
        // Step before: vertical to new y at old x, then horizontal to new x
        lineTo(stroke, prevXPos, y1);
      } else {
        // Mid-step: step at midpoint between old and new x
        const midX = pxRound((prevXPos + x1) / 2);
        lineTo(stroke, midX, prevYPos);
        lineTo(stroke, midX, y1);
      }

      lineTo(stroke, x1, y1);

      prevYPos = y1;
      prevXPos = x1;
    }

    // Build fill path
    {
      const fill = _paths.fill = new Path2D(stroke);
      const fillToVal = opts?.fillTo ?? scaleY.min ?? 0;
      const fillToY = pixelForY(fillToVal);

      let frX = xOff;
      let toX = xOff + xDim;
      if (dir === -1) [toX, frX] = [frX, toX];

      lineTo(fill, toX, fillToY);
      lineTo(fill, frX, fillToY);
    }

    // Build clip path for gaps
    if (hasGap) {
      const gaps = findGaps(dataX, dataY, idx0, idx1, dir, pixelForX);
      _paths.gaps = gaps;
      _paths.clip = clipGaps(gaps, scaleX.ori, xOff, yOff, xDim, yDim);
    }

    return _paths;
  };
}
