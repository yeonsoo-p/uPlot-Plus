import type { DataInput, SimpleGroup, FullGroup, ChartData, XGroup } from '../types/data';
import type { NumArray, NullableNumArray } from '../types/common';

/**
 * Convert an x-value array to Float64Array for optimal binary search performance.
 * Pass-through if already a Float64Array.
 */
function normalizeX(arr: SimpleGroup['x']): NumArray {
  if (arr instanceof Float64Array) return arr;
  return new Float64Array(arr as number[]);
}

/**
 * Normalize a y-value array:
 * - Float64Array → pass through (already optimal, no nulls)
 * - number[] with no nulls → promote to Float64Array
 * - (number|null)[] with nulls → keep as-is (gaps)
 */
function normalizeY(arr: SimpleGroup['y']): NumArray | NullableNumArray {
  if (arr instanceof Float64Array) return arr;
  if ((arr as unknown[]).some(v => v == null)) return arr as NullableNumArray;
  return new Float64Array(arr as number[]);
}

function normalizeSimple(g: SimpleGroup): XGroup {
  return { x: normalizeX(g.x), series: [normalizeY(g.y)] };
}

function normalizeFull(g: FullGroup): XGroup {
  return { x: normalizeX(g.x), series: g.series.map(normalizeY) };
}

/**
 * Normalize flexible user input into the internal ChartData format.
 * Accepts three forms:
 * - `{ x, y }` — single series
 * - `[{ x, y }, ...]` — multiple single-series groups
 * - `[{ x, series: [...] }, ...]` — full multi-series groups
 *
 * Runs once per data change. Promotes plain arrays to Float64Array where possible.
 */
export function normalizeData(input: DataInput): ChartData {
  // Single SimpleGroup: { x, y }
  if (!Array.isArray(input)) {
    return [normalizeSimple(input)];
  }

  // Empty array
  if (input.length === 0) return [];

  const first = input[0];
  if (first == null) return [];

  // FullGroup[]: [{ x, series: [...] }]
  if ('series' in first) {
    return (input as FullGroup[]).map(normalizeFull);
  }

  // SimpleGroup[]: [{ x, y }]
  return (input as SimpleGroup[]).map(normalizeSimple);
}
