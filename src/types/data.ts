import type { NumArray, NullableNumArray } from './common';

// ---------------------------------------------------------------------------
// Internal normalized types (used throughout the core after normalization)
// ---------------------------------------------------------------------------

/**
 * An XGroup: a set of series sharing a single x-value array.
 * The x array provides the x-coordinates, and each entry in series
 * is a y-value array plotted against those x-coordinates.
 */
export interface XGroup {
  x: NumArray;
  series: (NumArray | NullableNumArray)[];
}

/**
 * Chart data is a list of XGroups.
 * Each group has its own x-values and one or more y-series.
 *
 * Example - single x-axis:
 *   [{ x: [1,2,3], series: [[10,20,30], [40,50,60]] }]
 *
 * Example - two independent x-axes:
 *   [
 *     { x: [t0,t1,t2], series: [[temp0,temp1,temp2]] },
 *     { x: [f0,f1,f2], series: [[spectrum0,spectrum1,spectrum2]] },
 *   ]
 */
export type ChartData = XGroup[];

/**
 * Identifies a specific series by its group index and series index within that group.
 */
export interface SeriesRef {
  group: number;
  index: number;
}

// ---------------------------------------------------------------------------
// Public input types (user-facing, accepted by Chart/Sparkline/ZoomRanger)
// ---------------------------------------------------------------------------

/** User-facing array type: pass whatever you have. */
export type DataArray = number[] | Float64Array | (number | null)[];

/** Simple single-series group: one x array, one y array. */
export interface SimpleGroup {
  x: DataArray;
  y: DataArray;
}

/** Full multi-series group: one x array, multiple y-series arrays. */
export interface FullGroup {
  x: DataArray;
  series: DataArray[];
}

/**
 * Flexible data input — Chart accepts all three forms:
 *
 * - `{ x, y }` — single series (simplest)
 * - `[{ x, y }, ...]` — multiple single-series groups
 * - `[{ x, series: [...] }, ...]` — full multi-series form
 */
export type DataInput = SimpleGroup | SimpleGroup[] | FullGroup[];
