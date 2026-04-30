import type { SortOrder } from './common';
import type { PathBuilder } from '../paths/types';

/** Gradient configuration for fills/strokes */
export interface GradientConfig {
  type: 'linear';
  /** Gradient stops: [offset 0-1, css color string] */
  stops: [number, string][];
}

/** Color value: plain CSS string or gradient config */
export type ColorValue = string | GradientConfig;

/** Configuration for a data series */
export interface SeriesConfig {
  /** Which data group this series belongs to (index into ChartData[]) */
  group: number;
  /** Which series within the group (index into XGroup.series[]) */
  index: number;
  /** Y-axis scale id */
  yScaleId: string;
  /** Whether to show this series */
  show?: boolean;
  /** Label for legend/tooltip */
  label?: string;
  /** Whether to show this series in legend/tooltip (default: true) */
  legend?: boolean;
  /** Stroke color (string or gradient config) */
  stroke?: ColorValue;
  /** Fill color (string or gradient config) */
  fill?: ColorValue;
  /** Stroke width in CSS pixels */
  strokeWidth?: number;
  /** Opacity 0-1 */
  alpha?: number;
  /** Whether data is sorted */
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
  /** Fill-to value or function. Defaults to scaleY.min for line builders, 0 for bars. */
  fillTo?: number | ((min: number, max: number) => number);
  /** Per-point baseline data for stacked fills. Overrides fillTo per data point. */
  fillToData?: ArrayLike<number | null>;
  /** Cursor behavior for this series */
  cursor?: {
    /** Whether to draw the point indicator on hover (default: true) */
    show?: boolean;
  };
  /** Render this series transposed: x-scale becomes vertical, y-scale becomes horizontal. Set automatically by horizontal path builders. */
  transposed?: boolean;
}

/** @internal Resolved series config with auto-assignment tracking fields. */
export interface ResolvedSeriesConfig extends SeriesConfig {
  _autoStroke?: boolean;
  _autoFill?: boolean;
  /**
   * Provenance of this config:
   *  - `'internal'` — auto-registered by a specialized component (Candlestick, BoxWhisker).
   *    Hidden from Legend/Tooltip; yields to explicit user series at the same slot.
   *  - `'fill'` — auto-injected by `fillSeries()` to occupy an unclaimed data slot.
   *    Cleared and rebuilt by `applyDefaults()` whenever data shape or explicit configs change.
   *  - `undefined` — user-declared.
   */
  _source?: 'internal' | 'fill';
}

/** Check if a CSS color string is effectively fully transparent. */
function isTransparent(color: string): boolean {
  if (color === 'transparent') return true;
  // rgba/hsla with alpha 0
  const alphaMatch = color.match(/,\s*([\d.]+)\s*\)$/);
  if (alphaMatch != null && alphaMatch[1] != null && parseFloat(alphaMatch[1]) === 0) return true;
  // #RGBA with 0 alpha or #RRGGBBAA with 00 alpha
  if (color.startsWith('#')) {
    if (color.length === 5 && color[4] === '0') return true;
    if (color.length === 9 && color.slice(7) === '00') return true;
  }
  return false;
}

/**
 * Resolve the representative color for a series config (used by Legend/Tooltip swatches).
 * Bars: use fill. Lines with transparent stroke + fill: use fill. Otherwise: use stroke.
 */
function extractColor(value: ColorValue | undefined): string | null {
  if (typeof value === 'string') return value;
  if (value != null && value.stops.length > 0) {
    const first = value.stops[0];
    if (first != null) return first[1];
  }
  return null;
}

export function getSeriesColor(cfg: SeriesConfig): string {
  const stroke = extractColor(cfg.stroke);
  const fill = extractColor(cfg.fill);
  const hasStroke = stroke != null && !isTransparent(stroke);
  const hasFill = fill != null && !isTransparent(fill);
  const isBar = cfg.paths?.defaults?.strokeWidth === 0;
  if (isBar && hasFill) return fill;
  if (!hasStroke && hasFill) return fill;
  return stroke ?? '#000';
}

export interface PointsConfig {
  show?: boolean | ((groupIdx: number, seriesIdx: number, i0: number, i1: number, dim: number) => boolean);
  size?: number;
  space?: number;
  strokeWidth?: number;
  stroke?: string;
  fill?: string;
  dash?: number[];
}

/** Runtime series state (internal) */
export interface SeriesState {
  config: SeriesConfig;
  /** X-scale id (derived from group) */
  xScaleId: string;
  /** Cached min y-value in current window */
  min: number;
  /** Cached max y-value in current window */
  max: number;
  /** Visible index range within this series's xGroup */
  idxs: [number, number];
}
