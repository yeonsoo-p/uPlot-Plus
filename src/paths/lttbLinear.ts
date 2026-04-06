import { LINE_DEFAULTS } from './types';
import type { PathBuilder, PathBuilderOpts, SeriesPaths } from './types';
import type { ScaleState } from '../types';
import type { Direction } from '../types';
import { linear } from './linear';
import { lttb } from '../math/lttb';
import { at } from '../utils/at';

export interface LttbLinearOpts {
  /** Target points multiplier relative to pixel width. Default: 1 (one point per pixel) */
  factor?: number;
}

/**
 * Linear path builder with LTTB downsampling pre-pass.
 * When the number of visible points exceeds factor * xDim * 2,
 * applies LTTB before delegating to linear().
 */
export function lttbLinear(lttbOpts?: LttbLinearOpts): PathBuilder {
  const factor = lttbOpts?.factor ?? 1;
  const inner = linear();

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
    const pointCount = idx1 - idx0 + 1;
    const target = Math.round(xDim * factor);

    if (pointCount > target * 2 && opts?.fillToData == null) {
      // Extract the visible window and run LTTB
      const windowLen = idx1 - idx0 + 1;
      const windowX = new Float64Array(windowLen);
      const windowY: (number | null)[] = new Array<number | null>(windowLen);

      for (let i = 0; i < windowLen; i++) {
        windowX[i] = at(dataX, idx0 + i);
        windowY[i] = dataY[idx0 + i] ?? null;
      }

      const result = lttb(windowX, windowY, target);

      // Delegate to inner linear() with downsampled data
      return inner(
        result.x, result.y,
        scaleX, scaleY,
        xDim, yDim, xOff, yOff,
        0, result.x.length - 1,
        dir, pxRound, opts,
      );
    }

    return inner(
      dataX, dataY,
      scaleX, scaleY,
      xDim, yDim, xOff, yOff,
      idx0, idx1,
      dir, pxRound, opts,
    );
  };

  fn.defaults = LINE_DEFAULTS;
  return fn;
}
