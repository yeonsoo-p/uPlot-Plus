import type { BBox, ScaleState } from '../types';
import { Orientation } from '../types';
import type { BandConfig } from '../types/bands';
import { valToPos } from '../core/Scale';
import { hasData } from '../math/utils';
import type { ResolvedTheme } from './theme';

/** Per-point projection closure: takes (xVal, yVal) and writes screen (px, py). */
type Projector = (xv: number, yv: number) => { px: number; py: number };

/**
 * Build a per-point projection that maps (xVal, yVal) → screen (px, py),
 * orientation-aware. Hoists the orientation check and plot-box lookups out
 * of the per-point loop so the inner closure only reads primitives.
 */
function makeProjector(
  xScale: ScaleState,
  yScale: ScaleState,
  plotBox: BBox,
  pxRatio: number,
): Projector {
  const xHoriz = xScale.ori === Orientation.Horizontal;
  const xDim = xHoriz ? plotBox.width : plotBox.height;
  const xOff = xHoriz ? plotBox.left : plotBox.top;
  const yHoriz = yScale.ori === Orientation.Horizontal;
  const yDim = yHoriz ? plotBox.width : plotBox.height;
  const yOff = yHoriz ? plotBox.left : plotBox.top;

  if (xHoriz) {
    return (xv, yv) => ({
      px: valToPos(xv, xScale, xDim, xOff) * pxRatio,
      py: valToPos(yv, yScale, yDim, yOff) * pxRatio,
    });
  }
  return (xv, yv) => ({
    px: valToPos(yv, yScale, yDim, yOff) * pxRatio,
    py: valToPos(xv, xScale, xDim, xOff) * pxRatio,
  });
}

/**
 * Build a Path2D for the filled region between two series.
 * Returns null if no valid points exist.
 *
 * @param dir Band direction: 0 = full region (default), 1 = only where upper > lower, -1 = only where lower > upper
 */
export function buildBandPath(
  dataX: ArrayLike<number>,
  upperY: ArrayLike<number | null>,
  lowerY: ArrayLike<number | null>,
  xScale: ScaleState,
  yScale: ScaleState,
  plotBox: BBox,
  pxRatio: number,
  i0: number,
  i1: number,
  dir: -1 | 0 | 1 = 0,
): Path2D | null {
  if (i0 > i1 || i0 < 0) return null;

  // Skip if both series are all-null in the visible range
  if (!hasData(upperY, i0, i1) && !hasData(lowerY, i0, i1)) return null;

  const project = makeProjector(xScale, yScale, plotBox, pxRatio);

  if (dir === 0) {
    return buildFullBandPath(dataX, upperY, lowerY, i0, i1, project);
  }

  return buildDirectionalBandPath(dataX, upperY, lowerY, i0, i1, project, dir);
}

/** Full band: trace upper forward, lower backward, close.  Splits into
 *  separate sub-paths at indices where either series has a null value so the
 *  fill never bridges across missing data. */
function buildFullBandPath(
  dataX: ArrayLike<number>,
  upperY: ArrayLike<number | null>,
  lowerY: ArrayLike<number | null>,
  i0: number,
  i1: number,
  project: Projector,
): Path2D | null {
  const path = new Path2D();
  let hasSegment = false;

  let segStart = i0;
  while (segStart <= i1) {
    // Skip indices where either boundary is null
    if (dataX[segStart] == null || upperY[segStart] == null || lowerY[segStart] == null) {
      segStart++;
      continue;
    }

    // Find end of contiguous valid segment
    let segEnd = segStart;
    while (
      segEnd + 1 <= i1
      && dataX[segEnd + 1] != null
      && upperY[segEnd + 1] != null
      && lowerY[segEnd + 1] != null
    ) {
      segEnd++;
    }

    // Forward pass: upper boundary
    {
      const sx = dataX[segStart];
      const su = upperY[segStart];
      if (sx != null && su != null) {
        const p = project(sx, su);
        path.moveTo(p.px, p.py);
      }
    }
    for (let i = segStart + 1; i <= segEnd; i++) {
      const xv = dataX[i];
      const uv = upperY[i];
      if (xv != null && uv != null) {
        const p = project(xv, uv);
        path.lineTo(p.px, p.py);
      }
    }

    // Reverse pass: lower boundary
    for (let i = segEnd; i >= segStart; i--) {
      const xv = dataX[i];
      const lv = lowerY[i];
      if (xv != null && lv != null) {
        const p = project(xv, lv);
        path.lineTo(p.px, p.py);
      }
    }

    path.closePath();
    hasSegment = true;

    segStart = segEnd + 1;
  }

  return hasSegment ? path : null;
}

/** Directional band: only fill segments where upper > lower (dir=1) or lower > upper (dir=-1). */
function buildDirectionalBandPath(
  dataX: ArrayLike<number>,
  upperY: ArrayLike<number | null>,
  lowerY: ArrayLike<number | null>,
  i0: number,
  i1: number,
  project: Projector,
  dir: 1 | -1,
): Path2D | null {
  // Collect valid points where both series have data
  const pts: { x: number; u: number; l: number }[] = [];
  for (let i = i0; i <= i1; i++) {
    const xv = dataX[i];
    const uv = upperY[i];
    const lv = lowerY[i];
    if (xv == null || uv == null || lv == null) continue;
    pts.push({ x: xv, u: uv, l: lv });
  }

  if (pts.length < 2) return null;

  const path = new Path2D();
  let hasSegment = false;

  // Test whether a point satisfies the direction condition
  const satisfies = (u: number, l: number) => dir === 1 ? u > l : l > u;

  // Find contiguous segments and interpolate crossings
  let segStart = 0;
  while (segStart < pts.length) {
    const p = pts[segStart];
    if (p == null) break;

    // Skip points that don't satisfy the condition
    if (!satisfies(p.u, p.l)) {
      segStart++;
      continue;
    }

    // Collect the segment of consecutive satisfying points
    const upperPts: { px: number; py: number }[] = [];
    const lowerPts: { px: number; py: number }[] = [];

    // Check if there's a crossing before this point (interpolate entry)
    const prev = segStart > 0 ? pts[segStart - 1] : undefined;
    if (prev != null) {
      const crossX = interpolateCrossing(prev.x, prev.u, prev.l, p.x, p.u, p.l);
      const crossY = lerp(prev.u, p.u, (crossX - prev.x) / (p.x - prev.x));
      const cp = project(crossX, crossY);
      upperPts.push({ px: cp.px, py: cp.py });
      lowerPts.push({ px: cp.px, py: cp.py });
    }

    let segEnd = segStart;
    for (let pt = pts[segEnd]; pt != null && satisfies(pt.u, pt.l); pt = pts[++segEnd]) {
      const up = project(pt.x, pt.u);
      const lp = project(pt.x, pt.l);
      upperPts.push({ px: up.px, py: up.py });
      lowerPts.push({ px: lp.px, py: lp.py });
    }

    // Check if there's a crossing after the last satisfying point (interpolate exit)
    const exitCur = pts[segEnd];
    const exitPrev = segEnd > 0 ? pts[segEnd - 1] : undefined;
    if (exitCur != null && exitPrev != null) {
      const crossX = interpolateCrossing(exitPrev.x, exitPrev.u, exitPrev.l, exitCur.x, exitCur.u, exitCur.l);
      const crossY = lerp(exitPrev.u, exitCur.u, (crossX - exitPrev.x) / (exitCur.x - exitPrev.x));
      const cp = project(crossX, crossY);
      upperPts.push({ px: cp.px, py: cp.py });
      lowerPts.push({ px: cp.px, py: cp.py });
    }

    // Build sub-path: upper forward, lower backward
    const first = upperPts[0];
    if (upperPts.length >= 2 && first != null) {
      path.moveTo(first.px, first.py);
      for (let i = 1; i < upperPts.length; i++) {
        const up = upperPts[i];
        if (up != null) path.lineTo(up.px, up.py);
      }
      for (let i = lowerPts.length - 1; i >= 0; i--) {
        const lp = lowerPts[i];
        if (lp != null) path.lineTo(lp.px, lp.py);
      }
      path.closePath();
      hasSegment = true;
    }

    segStart = segEnd;
  }

  return hasSegment ? path : null;
}

/** Find the x-value where (upper - lower) crosses zero between two points. */
function interpolateCrossing(
  x0: number, u0: number, l0: number,
  x1: number, u1: number, l1: number,
): number {
  const d0 = u0 - l0;
  const d1 = u1 - l1;
  const t = d0 / (d0 - d1);
  return x0 + t * (x1 - x0);
}

/** Linear interpolation. */
function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/**
 * Draw a pre-built band path onto the canvas.
 */
export function drawBandPath(
  ctx: CanvasRenderingContext2D,
  band: BandConfig,
  path: Path2D,
  theme?: ResolvedTheme,
): void {
  ctx.save();
  ctx.fillStyle = band.fill ?? theme?.bandFill ?? 'rgba(0, 120, 255, 0.1)';
  ctx.fill(path);
  ctx.restore();
}
