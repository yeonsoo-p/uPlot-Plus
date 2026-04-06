import { POINTS_DEFAULTS } from './types';
import type { SeriesPaths, PathBuilder, PathBuilderOpts } from './types';
import type { ScaleState } from '../types';
import { Orientation, Direction } from '../types';
import { valToPos } from '../core/Scale';
import { at } from '../utils/at';

/**
 * Points-only path builder.
 * Produces circle arcs at each data point — no connecting lines.
 * The resulting path is used as both stroke and fill.
 *
 * Ported from uPlot/src/paths/points.js
 */
export function points(ptSize = 4): PathBuilder {
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
    _opts?: PathBuilderOpts,
  ): SeriesPaths => {
    const pixelForX = (val: number) => pxRound(valToPos(val, scaleX, xDim, xOff));
    const pixelForY = (val: number) => pxRound(valToPos(val, scaleY, yDim, yOff));

    const rad = ptSize / 2;
    const fill = new Path2D();
    const isHoriz = scaleX.ori === Orientation.Horizontal;

    for (let i = dir === Direction.Forward ? idx0 : idx1; i >= idx0 && i <= idx1; i += dir) {
      const yVal = dataY[i];
      if (yVal == null) continue;

      const x = pixelForX(at(dataX, i));
      const y = pixelForY(yVal);

      if (isHoriz) {
        fill.moveTo(x + rad, y);
        fill.arc(x, y, rad, 0, Math.PI * 2);
      } else {
        fill.moveTo(y + rad, x);
        fill.arc(y, x, rad, 0, Math.PI * 2);
      }
    }

    return {
      stroke: fill,
      fill,
      clip: null,
      band: null,
      gaps: null,
    };
  };
  fn.defaults = POINTS_DEFAULTS;
  return fn;
}
