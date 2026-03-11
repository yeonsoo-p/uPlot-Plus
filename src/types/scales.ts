import type { Orientation, Direction, Distribution } from './common';

/** Configuration for a scale */
export interface ScaleConfig {
  /** Unique scale identifier */
  id: string;
  /** Whether this is a time-based scale */
  time?: boolean;
  /** Auto-range from data */
  auto?: boolean;
  /** Distribution type */
  distr?: Distribution;
  /** Log base (when distr=3) */
  log?: number;
  /** Asinh linear threshold (when distr=4) */
  asinh?: number;
  /** Fixed min value (overrides auto) */
  min?: number | null;
  /** Fixed max value (overrides auto) */
  max?: number | null;
  /** Direction */
  dir?: Direction;
  /** Orientation: Horizontal (x), Vertical (y) */
  ori?: Orientation;
  /** Range configuration for auto-ranging */
  range?: RangeConfig;
}

/** Range padding/bounds configuration */
export interface RangeConfig {
  min?: RangePart;
  max?: RangePart;
}

export interface RangePart {
  /** Padding as fraction of data range */
  pad?: number;
  /** Hard limit */
  hard?: number;
  /** Soft limit */
  soft?: number;
  /** Soft mode: 0=off, 1=always, 2=inside, 3=outside */
  mode?: 0 | 1 | 2 | 3;
}

/** Runtime scale state */
export interface ScaleState {
  id: string;
  min: number | null;
  max: number | null;
  distr: Distribution;
  log: number;
  asinh: number;
  ori: Orientation;
  dir: Direction;
  time: boolean;
  auto: boolean;
  range: RangeConfig | null;
  /** Cached transformed min (for log/asinh distributions) */
  _min: number | null;
  /** Cached transformed max (for log/asinh distributions) */
  _max: number | null;
}
