import type { Side } from './common';

/** Configuration for an axis */
export interface AxisConfig {
  /** Which scale this axis displays */
  scale: string;
  /** Which side: 0=top, 1=right, 2=bottom, 3=left */
  side: Side;
  /** Whether to show this axis */
  show?: boolean;
  /** Axis label text */
  label?: string;
  /** Label font */
  labelFont?: string;
  /** Label size in CSS pixels */
  labelSize?: number;
  /** Label gap from axis edge */
  labelGap?: number;
  /** Tick/label font */
  font?: string;
  /** Stroke color for labels */
  stroke?: string;
  /** Minimum space between ticks in CSS pixels */
  space?: number;
  /** Gap between ticks and labels */
  gap?: number;
  /** Axis size (height for horizontal, width for vertical) */
  size?: number;
  /** Tick label rotation in degrees */
  rotate?: number;
  /** Custom tick increment array */
  incrs?: number[];
  /** Custom tick value formatter */
  values?: (splits: number[], space: number, incr: number) => string[];
  /** Custom tick split generator */
  splits?: (min: number, max: number, incr: number, space: number) => number[];
  /** Grid line config */
  grid?: GridConfig;
  /** Tick mark config */
  ticks?: TickConfig;
  /** Border config */
  border?: BorderConfig;
}

export interface GridConfig {
  show?: boolean;
  stroke?: string;
  width?: number;
  dash?: number[];
}

export interface TickConfig {
  show?: boolean;
  stroke?: string;
  width?: number;
  size?: number;
  dash?: number[];
}

export interface BorderConfig {
  show?: boolean;
  stroke?: string;
  width?: number;
  dash?: number[];
}

/** Runtime axis state (internal) */
export interface AxisState {
  config: AxisConfig;
  /** Whether currently visible (has valid scale range) */
  _show: boolean;
  /** Computed size in CSS pixels */
  _size: number;
  /** Position of axis line (CSS pixels from chart origin) */
  _pos: number;
  /** Position of axis label (CSS pixels from chart origin) */
  _lpos: number;
  /** Computed tick splits */
  _splits: number[] | null;
  /** Computed tick labels */
  _values: string[] | null;
  /** Computed tick increment */
  _incr: number;
  /** Computed tick spacing */
  _space: number;
  /** Label rotation */
  _rotate: number;
}
