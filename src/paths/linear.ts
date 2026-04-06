import { LINE_DEFAULTS } from './types';
import type { SeriesPaths, PathBuilder, PathBuilderOpts } from './types';
import type { ScaleState } from '../types';
import { Orientation, Direction, Distribution } from '../types';
import { valToPos, posToVal } from '../core/Scale';
import { nonNullIdxs, positiveIdxs } from '../math/utils';
import { lineToH, lineToV, findGaps, clipGaps } from './utils';
import { at } from '../utils/at';

/**
 * Accumulator drawing helper: when multiple data points map to the same
 * pixel column, draw the min/max/in/out vertical range.
 */
function _drawAcc(lineTo: typeof lineToH) {
  return (stroke: Path2D, accX: number, minY: number, maxY: number, inY: number, outY: number) => {
    if (minY !== maxY) {
      if (inY !== minY && outY !== minY)
        lineTo(stroke, accX, minY);
      if (inY !== maxY && outY !== maxY)
        lineTo(stroke, accX, maxY);
      lineTo(stroke, accX, outY);
    }
  };
}

const drawAccH = _drawAcc(lineToH);
const drawAccV = _drawAcc(lineToV);

/**
 * Linear path builder with pixel-level decimation.
 * When the number of data points exceeds 4x the pixel width,
 * collapses multiple points per pixel into min/max/in/out representation.
 *
 * Ported from uPlot/src/paths/linear.js
 */
export function linear(): PathBuilder {
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
    pxRound: (v: number) => number,
    opts?: PathBuilderOpts,
  ): SeriesPaths => {
    const spanGaps = opts?.spanGaps ?? false;
    const getIdxs = scaleY.distr === Distribution.Log ? positiveIdxs : nonNullIdxs;
    [idx0, idx1] = getIdxs(dataY, idx0, idx1);

    if (idx0 === -1) {
      return {
        stroke: new Path2D(),
        fill: null,
        clip: null,
        band: null,
        gaps: null,
      };
    }

    const pixelForX = (val: number) => pxRound(valToPos(val, scaleX, xDim, xOff));
    const pixelForY = (val: number) => pxRound(valToPos(val, scaleY, yDim, yOff));

    let lineTo: typeof lineToH;
    let drawAcc: ReturnType<typeof _drawAcc>;

    if (scaleX.ori === Orientation.Horizontal) {
      lineTo = lineToH;
      drawAcc = drawAccH;
    } else {
      lineTo = lineToV;
      drawAcc = drawAccV;
    }

    const _paths: SeriesPaths = {
      stroke: new Path2D(),
      fill: null,
      clip: null,
      band: null,
      gaps: null,
    };
    const stroke = _paths.stroke;

    let hasGap = false;

    // decimate when number of points >= 4x available pixels
    const decimate = idx1 - idx0 >= xDim * 4;

    if (decimate) {
      const xForPixel = (pos: number) => posToVal(pos, scaleX, xDim, xOff);

      let minY: number | null = null;
      let maxY = 0;
      let inY = 0;
      let outY = 0;

      let accX = pixelForX(at(dataX, dir === Direction.Forward ? idx0 : idx1));

      const idx0px = pixelForX(at(dataX, idx0));
      const idx1px = pixelForX(at(dataX, idx1));

      // tracks limit of current x bucket
      let nextAccXVal = xForPixel(dir === Direction.Forward ? idx0px + 1 : idx1px - 1);

      for (let i = dir === Direction.Forward ? idx0 : idx1; i >= idx0 && i <= idx1; i += dir) {
        const xVal = at(dataX, i);
        const reuseAccX = dir === Direction.Forward ? (xVal < nextAccXVal) : (xVal > nextAccXVal);
        const x = reuseAccX ? accX : pixelForX(xVal);

        const yVal = dataY[i];

        if (x === accX) {
          if (yVal != null) {
            outY = yVal;

            if (minY == null) {
              lineTo(stroke, x, pixelForY(outY));
              inY = minY = maxY = outY;
            } else {
              if (outY < minY)
                minY = outY;
              else if (outY > maxY)
                maxY = outY;
            }
          } else {
            if (yVal === null && !spanGaps)
              hasGap = true;
          }
        } else {
          if (minY != null)
            drawAcc(stroke, accX, pixelForY(minY), pixelForY(maxY), pixelForY(inY), pixelForY(outY));

          if (yVal != null) {
            outY = yVal;
            lineTo(stroke, x, pixelForY(outY));
            minY = maxY = inY = outY;
          } else {
            minY = null;
            maxY = 0;

            if (yVal === null && !spanGaps)
              hasGap = true;
          }

          accX = x;
          nextAccXVal = xForPixel(accX + dir);
        }
      }

      if (minY != null) {
        if (minY !== maxY)
          drawAcc(stroke, accX, pixelForY(minY), pixelForY(maxY), pixelForY(inY), pixelForY(outY));
        else
          lineTo(stroke, accX, pixelForY(outY));
      }
    } else {
      for (let i = dir === Direction.Forward ? idx0 : idx1; i >= idx0 && i <= idx1; i += dir) {
        const yVal = dataY[i];

        if (yVal === null && !spanGaps)
          hasGap = true;
        else if (yVal != null)
          lineTo(stroke, pixelForX(at(dataX, i)), pixelForY(yVal));
      }
    }

    // Build fill path
    {
      const fill = _paths.fill = new Path2D(stroke);
      const fillToData = opts?.fillToData;

      if (fillToData != null) {
        // Per-point baseline: trace backwards along baseline data
        for (let i = dir === Direction.Forward ? idx1 : idx0; i >= idx0 && i <= idx1; i -= dir) {
          const bv = fillToData[i];
          const xv = dataX[i];
          if (bv != null && xv != null)
            lineTo(fill, pixelForX(xv), pixelForY(bv));
        }
      } else {
        const fillToVal = opts?.fillTo ?? scaleY.min ?? 0;
        const fillToY = pixelForY(fillToVal);

        // Close fill to data extent (not plot edges) to avoid triangular overshoots
        let frX = pixelForX(at(dataX, idx0));
        let toX = pixelForX(at(dataX, idx1));

        if (dir === Direction.Backward)
          [toX, frX] = [frX, toX];

        lineTo(fill, toX, fillToY);
        lineTo(fill, frX, fillToY);
      }
    }

    // Build clip path for gaps
    if (hasGap) {
      const gaps = findGaps(dataX, dataY, idx0, idx1, dir, pixelForX);
      _paths.gaps = gaps;
      _paths.clip = clipGaps(gaps, scaleX.ori, xOff, yOff, xDim, yDim);
    }

    return _paths;
  };
  fn.defaults = LINE_DEFAULTS;
  return fn;
}
