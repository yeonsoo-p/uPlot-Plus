import type { ScaleState } from '../types';

/** Result of a path builder */
export interface SeriesPaths {
  stroke: Path2D;
  fill: Path2D | null;
  clip: Path2D | null;
  band: Path2D | null;
  gaps: [number, number][] | null;
}

/** Options passed to path builders beyond positional data */
export interface PathBuilderOpts {
  /** Value to fill down to (default: scaleY.min) */
  fillTo?: number;
  /** Whether to connect across null gaps */
  spanGaps?: boolean;
  /** Step alignment: -1=before (step after point), 1=after (step before), 0=mid */
  align?: -1 | 0 | 1;
  /** Bar width as fraction of available column space (0-1, default 0.6) */
  barWidth?: number;
  /** Extra gap between bars in pixels (default 0) */
  barGap?: number;
  /** Corner radius for bars as fraction of bar width (0-1, default 0) */
  barRadius?: number;
}

/** Path builder function signature */
export type PathBuilder = (
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
) => SeriesPaths;
