import type { PathBuilder } from './types';
import type { SplineInterpFn } from './spline';
import { splineInterp } from './spline';

/**
 * Centripetal Catmull-Rom spline path builder (alpha=0.5).
 * Avoids cusps and self-intersections common with uniform Catmull-Rom.
 *
 * Ported from uPlot/src/paths/catmullRomCentrip.js
 */
export function catmullRom(): PathBuilder {
  return splineInterp(_catmullRomFitting);
}

const _catmullRomFitting: SplineInterpFn = (
  xCoords: number[],
  yCoords: number[],
  isHoriz: boolean,
  pxRound: (v: number) => number,
): Path2D | null => {
  const n = xCoords.length;

  if (n < 2) return null;

  const alpha = 0.5;
  const path = new Path2D();

  const x0 = pxRound(xCoords[0] ?? 0);
  const y0 = pxRound(yCoords[0] ?? 0);

  if (isHoriz)
    path.moveTo(x0, y0);
  else
    path.moveTo(y0, x0);

  if (n === 2) {
    const x1 = pxRound(xCoords[1] ?? 0);
    const y1 = pxRound(yCoords[1] ?? 0);
    if (isHoriz)
      path.lineTo(x1, y1);
    else
      path.lineTo(y1, x1);
    return path;
  }

  for (let i = 0; i < n - 1; i++) {
    const p0i = i === 0 ? 0 : i - 1;

    const p0x = xCoords[p0i] ?? 0;
    const p0y = yCoords[p0i] ?? 0;
    const p1x = xCoords[i] ?? 0;
    const p1y = yCoords[i] ?? 0;
    const p2x = xCoords[i + 1] ?? 0;
    const p2y = yCoords[i + 1] ?? 0;
    const p3x = i + 2 < n ? (xCoords[i + 2] ?? 0) : p2x;
    const p3y = i + 2 < n ? (yCoords[i + 2] ?? 0) : p2y;

    const d1 = Math.sqrt(Math.pow(p0x - p1x, 2) + Math.pow(p0y - p1y, 2));
    const d2 = Math.sqrt(Math.pow(p1x - p2x, 2) + Math.pow(p1y - p2y, 2));
    const d3 = Math.sqrt(Math.pow(p2x - p3x, 2) + Math.pow(p2y - p3y, 2));

    const d3powA = Math.pow(d3, alpha);
    const d3pow2A = Math.pow(d3, alpha * 2);
    const d2powA = Math.pow(d2, alpha);
    const d2pow2A = Math.pow(d2, alpha * 2);
    const d1powA = Math.pow(d1, alpha);
    const d1pow2A = Math.pow(d1, alpha * 2);

    const A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A;
    const B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;

    let N = 3 * d1powA * (d1powA + d2powA);
    if (N > 0) N = 1 / N;

    let M = 3 * d3powA * (d3powA + d2powA);
    if (M > 0) M = 1 / M;

    let bp1x = (-d2pow2A * p0x + A * p1x + d1pow2A * p2x) * N;
    let bp1y = (-d2pow2A * p0y + A * p1y + d1pow2A * p2y) * N;

    let bp2x = (d3pow2A * p1x + B * p2x - d2pow2A * p3x) * M;
    let bp2y = (d3pow2A * p1y + B * p2y - d2pow2A * p3y) * M;

    if (bp1x === 0 && bp1y === 0) { bp1x = p1x; bp1y = p1y; }
    if (bp2x === 0 && bp2y === 0) { bp2x = p2x; bp2y = p2y; }

    if (isHoriz)
      path.bezierCurveTo(bp1x, bp1y, bp2x, bp2y, p2x, p2y);
    else
      path.bezierCurveTo(bp1y, bp1x, bp2y, bp2x, p2y, p2x);
  }

  return path;
};
