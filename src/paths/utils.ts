import type { ScaleState } from '../types';
import { valToPos, posToVal } from '../core/Scale';

/** Line-to for horizontal orientation */
export function lineToH(path: Path2D, x: number, y: number): void {
  path.lineTo(x, y);
}

/** Line-to for vertical orientation */
export function lineToV(path: Path2D, y: number, x: number): void {
  path.lineTo(x, y);
}

/** Create a valToPos function for a given scale, dimension, and offset */
export function makeValToPos(scale: ScaleState, dim: number, off: number): (val: number) => number {
  return (val: number) => valToPos(val, scale, dim, off);
}

/** Create a posToVal function for a given scale, dimension, and offset */
export function makePosToVal(scale: ScaleState, dim: number, off: number): (pos: number) => number {
  return (pos: number) => posToVal(pos, scale, dim, off);
}

/**
 * Find gaps (null regions) in data for clip path generation.
 */
export function findGaps(
  dataX: ArrayLike<number>,
  dataY: ArrayLike<number | null>,
  idx0: number,
  idx1: number,
  dir: 1 | -1,
  pixelForX: (val: number) => number,
): [number, number][] {
  const gaps: [number, number][] = [];
  let gapStart = -1;

  const start = dir === 1 ? idx0 : idx1;
  const end = dir === 1 ? idx1 : idx0;
  const step = dir;

  for (let i = start; dir === 1 ? i <= end : i >= end; i += step) {
    if (dataY[i] === null || dataY[i] === undefined) {
      if (gapStart === -1)
        gapStart = i > idx0 ? pixelForX(dataX[i - dir] as number) : pixelForX(dataX[idx0] as number);
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
  ori: 0 | 1,
  xOff: number,
  yOff: number,
  xDim: number,
  yDim: number,
): Path2D {
  const clip = new Path2D();

  let prevEnd = ori === 0 ? xOff : yOff;
  const dimEnd = ori === 0 ? xOff + xDim : yOff + yDim;
  const crossOff = ori === 0 ? yOff : xOff;
  const crossDim = ori === 0 ? yDim : xDim;

  for (const [gapStart, gapEnd] of gaps) {
    if (gapStart > prevEnd) {
      if (ori === 0)
        clip.rect(prevEnd, crossOff, gapStart - prevEnd, crossDim);
      else
        clip.rect(crossOff, prevEnd, crossDim, gapStart - prevEnd);
    }
    prevEnd = gapEnd;
  }

  if (prevEnd < dimEnd) {
    if (ori === 0)
      clip.rect(prevEnd, crossOff, dimEnd - prevEnd, crossDim);
    else
      clip.rect(crossOff, prevEnd, crossDim, dimEnd - prevEnd);
  }

  return clip;
}
