import type { SortOrder } from './common';
import type { PathBuilder } from '../paths/types';

/** Configuration for a data series */
export interface SeriesConfig {
  /** Which data group this series belongs to (index into ChartData[]) */
  group: number;
  /** Which series within the group (index into XGroup.series[]) */
  index: number;
  /** Y-axis scale key */
  yScale: string;
  /** Whether to show this series */
  show?: boolean;
  /** Label for legend/tooltip */
  label?: string;
  /** Stroke color */
  stroke?: string;
  /** Fill color (area under curve) */
  fill?: string;
  /** Stroke width in CSS pixels */
  width?: number;
  /** Opacity 0-1 */
  alpha?: number;
  /** Whether data is sorted: 1=asc, -1=desc, 0=unsorted */
  sorted?: SortOrder;
  /** Whether to connect across null gaps */
  spanGaps?: boolean;
  /** Path builder function */
  paths?: PathBuilder;
  /** Points configuration */
  points?: PointsConfig;
  /** Dash pattern */
  dash?: number[];
  /** Line cap */
  cap?: CanvasLineCap;
  /** Line join */
  join?: CanvasLineJoin;
  /** Pixel alignment: 0=none, 1=round to pixel (default), other=snap to increment */
  pxAlign?: number;
  /** Fill-to value or function */
  fillTo?: number | ((min: number, max: number) => number);
}

export interface PointsConfig {
  show?: boolean | ((groupIdx: number, seriesIdx: number, i0: number, i1: number, dim: number) => boolean);
  size?: number;
  space?: number;
  width?: number;
  stroke?: string;
  fill?: string;
  dash?: number[];
}

/** Runtime series state (internal) */
export interface SeriesState {
  config: SeriesConfig;
  /** X-scale key (derived from group) */
  xScale: string;
  /** Cached min y-value in current window */
  min: number;
  /** Cached max y-value in current window */
  max: number;
  /** Visible index range within this series's xGroup */
  idxs: [number, number];
  /** Cached path data */
  path: Path2D | null;
  /** Cached clip path */
  clip: Path2D | null;
  /** Cached fill path */
  fillPath: Path2D | null;
}
