import { Orientation, Direction } from '../types';
import { clamp } from '../math/utils';

/** Line-to for horizontal orientation */
export function lineToH(path: Path2D, x: number, y: number): void {
  path.lineTo(x, y);
}

/** Line-to for vertical orientation */
export function lineToV(path: Path2D, y: number, x: number): void {
  path.lineTo(x, y);
}

/**
 * Find gaps (null regions) in data for clip path generation.
 */
export function findGaps(
  dataX: ArrayLike<number>,
  dataY: ArrayLike<number | null>,
  idx0: number,
  idx1: number,
  dir: Direction,
  pixelForX: (val: number) => number,
): [number, number][] {
  const gaps: [number, number][] = [];
  let gapStart = -1;

  const start = dir === Direction.Forward ? idx0 : idx1;
  const end = dir === Direction.Forward ? idx1 : idx0;
  const step = dir;

  for (let i = start; dir === Direction.Forward ? i <= end : i >= end; i += step) {
    if (dataY[i] === null || dataY[i] === undefined) {
      if (gapStart === -1) {
        // Use the previous non-null point's x pixel as gap start.
        // i - dir gives the previous index in iteration order; clamp to [idx0, idx1].
        const prevI = clamp(i - dir, idx0, idx1);
        gapStart = pixelForX(dataX[prevI] as number);
      }
    } else {
      if (gapStart !== -1) {
        gaps.push([gapStart, pixelForX(dataX[i] as number)]);
        gapStart = -1;
      }
    }
  }

  if (gapStart !== -1) {
    gaps.push([gapStart, pixelForX(dataX[idx1] as number)]);
  }

  return gaps;
}

/**
 * Create a clip path that excludes gap regions.
 */
export function clipGaps(
  gaps: [number, number][],
  ori: Orientation,
  xOff: number,
  yOff: number,
  xDim: number,
  yDim: number,
): Path2D {
  const clip = new Path2D();

  let prevEnd = ori === Orientation.Horizontal ? xOff : yOff;
  const dimEnd = ori === Orientation.Horizontal ? xOff + xDim : yOff + yDim;
  const crossOff = ori === Orientation.Horizontal ? yOff : xOff;
  const crossDim = ori === Orientation.Horizontal ? yDim : xDim;

  for (const [gapStart, gapEnd] of gaps) {
    if (gapStart > prevEnd) {
      if (ori === Orientation.Horizontal)
        clip.rect(prevEnd, crossOff, gapStart - prevEnd, crossDim);
      else
        clip.rect(crossOff, prevEnd, crossDim, gapStart - prevEnd);
    }
    prevEnd = gapEnd;
  }

  if (prevEnd < dimEnd) {
    if (ori === Orientation.Horizontal)
      clip.rect(prevEnd, crossOff, dimEnd - prevEnd, crossDim);
    else
      clip.rect(crossOff, prevEnd, crossDim, dimEnd - prevEnd);
  }

  return clip;
}
