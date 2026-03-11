import type { PathBuilder } from './types';
import type { SplineInterpFn } from './spline';
import { splineInterp } from './spline';

/**
 * Monotone cubic spline path builder (Fritsch-Carlson method).
 * Guarantees monotonicity — the interpolated curve never overshoots
 * the y-range of adjacent data points.
 *
 * Ported from uPlot/src/paths/monotoneCubic.js
 */
export function monotoneCubic(): PathBuilder {
  return splineInterp(_monotoneCubic);
}

const _monotoneCubic: SplineInterpFn = (
  xs: number[],
  ys: number[],
  isHoriz: boolean,
  _pxRound: (v: number) => number,
): Path2D | null => {
  const n = xs.length;

  if (n < 2) return null;

  const path = new Path2D();

  const x0 = xs[0] ?? 0;
  const y0 = ys[0] ?? 0;

  if (isHoriz)
    path.moveTo(x0, y0);
  else
    path.moveTo(y0, x0);

  if (n === 2) {
    const x1 = xs[1] ?? 0;
    const y1 = ys[1] ?? 0;
    if (isHoriz)
      path.lineTo(x1, y1);
    else
      path.lineTo(y1, x1);
    return path;
  }

  // Arrays for slopes and deltas
  const ms = new Array<number>(n);
  const ds = new Array<number>(n - 1);
  const dys = new Array<number>(n - 1);
  const dxs = new Array<number>(n - 1);

  // Calculate deltas and derivatives
  for (let i = 0; i < n - 1; i++) {
    dys[i] = (ys[i + 1] ?? 0) - (ys[i] ?? 0);
    dxs[i] = (xs[i + 1] ?? 0) - (xs[i] ?? 0);
    ds[i] = dxs[i] !== 0 ? (dys[i] ?? 0) / (dxs[i] ?? 1) : 0;
  }

  // Fritsch-Carlson method for monotone slopes
  ms[0] = ds[0] ?? 0;

  for (let i = 1; i < n - 1; i++) {
    const d = ds[i] ?? 0;
    const dp = ds[i - 1] ?? 0;

    if (d === 0 || dp === 0 || (dp > 0) !== (d > 0)) {
      ms[i] = 0;
    } else {
      const dx = dxs[i] ?? 1;
      const dxp = dxs[i - 1] ?? 1;
      ms[i] = 3 * (dxp + dx) / (
        (2 * dx + dxp) / dp +
        (dx + 2 * dxp) / d
      );

      if (!isFinite(ms[i] ?? 0))
        ms[i] = 0;
    }
  }

  ms[n - 1] = ds[n - 2] ?? 0;

  // Draw bezier curves
  for (let i = 0; i < n - 1; i++) {
    const dx = dxs[i] ?? 1;
    const xi = xs[i] ?? 0;
    const yi = ys[i] ?? 0;
    const xn = xs[i + 1] ?? 0;
    const yn = ys[i + 1] ?? 0;
    const mi = ms[i] ?? 0;
    const mn = ms[i + 1] ?? 0;

    const cp1x = xi + dx / 3;
    const cp1y = yi + mi * dx / 3;
    const cp2x = xn - dx / 3;
    const cp2y = yn - mn * dx / 3;

    if (isHoriz)
      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xn, yn);
    else
      path.bezierCurveTo(cp1y, cp1x, cp2y, cp2x, yn, xn);
  }

  return path;
};
