import type { SeriesPaths, PathBuilder, PathBuilderOpts } from './types';
import type { ScaleState } from '../types';
import { valToPos } from '../core/Scale';

/**
 * Bar/column chart path builder.
 * Draws vertical (or horizontal) bars at each data point.
 *
 * Ported from uPlot/src/paths/bars.js
 */
export function bars(): PathBuilder {
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
    const barWidthFrac = opts?.barWidth ?? 0.6;
    const extraGap = opts?.barGap ?? 0;
    const radiusFrac = opts?.barRadius ?? 0;

    const pixelForX = (val: number) => pxRound(valToPos(val, scaleX, xDim, xOff));
    const pixelForY = (val: number) => pxRound(valToPos(val, scaleY, yDim, yOff));

    // Find minimum column width from adjacent x-values
    let colWid = xDim;
    if (idx1 > idx0) {
      let minDelta = Infinity;
      let prevIdx = -1;

      for (let i = idx0; i <= idx1; i++) {
        if (dataY[i] != null) {
          if (prevIdx >= 0) {
            const dx = dataX[i] as number;
            const dprev = dataX[prevIdx] as number;
            const delta = Math.abs(pixelForX(dx) - pixelForX(dprev));
            if (delta < minDelta) minDelta = delta;
          }
          prevIdx = i;
        }
      }
      if (minDelta < Infinity) colWid = minDelta;
    }

    const gapWid = colWid * (1 - barWidthFrac);
    const fullGap = Math.max(0, gapWid + extraGap);
    const barWid = Math.max(1, pxRound(colWid - fullGap));

    const fillToVal = opts?.fillTo ?? scaleY.min ?? 0;
    const fillToY = pixelForY(fillToVal);

    const stroke = new Path2D();
    const isHorizontal = scaleX.ori === 0;

    for (let i = dir === 1 ? idx0 : idx1; i >= idx0 && i <= idx1; i += dir) {
      const yVal = dataY[i];
      if (yVal == null) continue;

      const xPos = pixelForX(dataX[i] as number);
      const yPos = pixelForY(yVal);

      const lft = pxRound(xPos - barWid / 2);
      const top = Math.min(yPos, fillToY);
      const btm = Math.max(yPos, fillToY);
      const barHgt = btm - top;

      if (barHgt === 0) continue;

      if (radiusFrac > 0) {
        const rad = Math.min(radiusFrac * barWid, barHgt / 2);
        drawRoundedRect(stroke, isHorizontal, lft, top, barWid, barHgt, rad, yVal < fillToVal);
      } else {
        if (isHorizontal)
          stroke.rect(lft, top, barWid, barHgt);
        else
          stroke.rect(top, lft, barHgt, barWid);
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
}

/** Draw a rounded rectangle with radius only on the value end (top for positive, bottom for negative). */
function drawRoundedRect(
  path: Path2D,
  isHorizontal: boolean,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  isNeg: boolean,
): void {
  r = Math.min(r, w / 2, h / 2);

  if (isHorizontal) {
    if (isNeg) {
      // Radius on bottom
      path.moveTo(x, y);
      path.lineTo(x + w, y);
      path.lineTo(x + w, y + h - r);
      path.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
      path.lineTo(x + r, y + h);
      path.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
      path.closePath();
    } else {
      // Radius on top
      path.moveTo(x, y + h);
      path.lineTo(x, y + r);
      path.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
      path.lineTo(x + w - r, y);
      path.arc(x + w - r, y + r, r, Math.PI * 1.5, 0);
      path.lineTo(x + w, y + h);
      path.closePath();
    }
  } else {
    // Vertical orientation — swap x/y semantics
    if (isNeg) {
      path.moveTo(y, x);
      path.lineTo(y, x + w);
      path.lineTo(y + h - r, x + w);
      path.arc(y + h - r, x + w - r, r, Math.PI / 2, 0, true);
      path.lineTo(y + h, x + r);
      path.arc(y + h - r, x + r, r, 0, -Math.PI / 2, true);
      path.closePath();
    } else {
      path.moveTo(y + h, x);
      path.lineTo(y + r, x);
      path.arc(y + r, x + r, r, -Math.PI / 2, Math.PI, true);
      path.lineTo(y, x + w - r);
      path.arc(y + r, x + w - r, r, Math.PI, Math.PI / 2, true);
      path.lineTo(y + h, x + w);
      path.closePath();
    }
  }
}
