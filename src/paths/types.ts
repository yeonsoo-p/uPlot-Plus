import type { ScaleState } from '../types';
import type { Direction } from '../types';
import type { SeriesConfig } from '../types/series';

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
  /** For grouped bars: this series' position in the group (0-based) */
  barGroupIdx?: number;
  /** For grouped bars: total number of series in the group */
  barGroupCount?: number;
  /** Per-point baseline values for stacked bars. When set, overrides fillTo per data point. */
  fillToData?: ArrayLike<number | null>;
}

/** Path builder function signature */
export type PathBuilderFn = (
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
) => SeriesPaths;

/** Path builder with optional default SeriesConfig overrides (e.g. bars set width=0) */
export type PathBuilder = PathBuilderFn & {
  defaults?: Partial<Pick<SeriesConfig, 'width' | 'fill' | 'fillTo' | 'points' | 'cursor'>>;
};

/** Shared default sets for path builder families */
export const LINE_DEFAULTS: PathBuilder['defaults'] = { width: 1 };
export const BAR_DEFAULTS: PathBuilder['defaults'] = { width: 0, fill: 'auto', fillTo: 0, points: { show: false }, cursor: { show: false } };
export const POINTS_DEFAULTS: PathBuilder['defaults'] = { width: 0, cursor: { show: false } };
