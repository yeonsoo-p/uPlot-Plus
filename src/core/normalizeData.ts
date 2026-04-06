import type { DataInput, SimpleGroup, FullGroup, ChartData, XGroup } from '../types/data';
import type { NumArray, NullableNumArray } from '../types/common';

/**
 * Analyse an x-value array and return both the Float64Array (nulls removed)
 * and the set of indices that were kept.  When no nulls are present
 * `validIndices` is null — callers can skip the per-series filter.
 */
function filterNullX(arr: SimpleGroup['x']): { x: NumArray; validIndices: number[] | null } {
  if (arr instanceof Float64Array) return { x: arr, validIndices: null };

  const wide: (number | null)[] = arr;
  let hasNull = false;
  for (let i = 0; i < wide.length; i++) {
    if (wide[i] == null) { hasNull = true; break; }
  }

  if (!hasNull) {
    const clean: number[] = [];
    for (const v of wide) { if (v != null) clean.push(v); }
    return { x: new Float64Array(clean), validIndices: null };
  }

  const validIndices: number[] = [];
  const nums: number[] = [];
  for (let i = 0; i < wide.length; i++) {
    const v = wide[i];
    if (v != null) {
      validIndices.push(i);
      nums.push(v);
    }
  }
  return { x: new Float64Array(nums), validIndices };
}

/** Keep only the entries at `validIndices` from a y-series array. */
function filterByIndices(arr: NumArray | NullableNumArray, validIndices: number[]): NumArray | NullableNumArray {
  if (arr instanceof Float64Array) {
    const out = new Float64Array(validIndices.length);
    for (let i = 0; i < validIndices.length; i++) {
      const idx = validIndices[i];
      if (idx != null) out[i] = arr[idx] ?? 0;
    }
    return out;
  }
  const src: (number | null)[] = arr;
  return validIndices.map(idx => src[idx] ?? null);
}

/**
 * Normalize a y-value array:
 * - Float64Array → pass through (already optimal, no nulls)
 * - number[] with no nulls → promote to Float64Array
 * - (number|null)[] with nulls → keep as-is (gaps)
 */
function isAllNumbers(arr: number[] | (number | null)[]): arr is number[] {
  return arr.every(v => v != null);
}

function normalizeY(arr: SimpleGroup['y']): NumArray | NullableNumArray {
  if (arr instanceof Float64Array) return arr;
  if (isAllNumbers(arr)) return new Float64Array(arr);
  return arr;
}

function normalizeSimple(g: SimpleGroup): XGroup {
  const { x, validIndices } = filterNullX(g.x);
  const y = normalizeY(g.y);
  return { x, series: [validIndices != null ? filterByIndices(y, validIndices) : y] };
}

function normalizeFull(g: FullGroup): XGroup {
  const { x, validIndices } = filterNullX(g.x);
  const series = g.series.map(s => {
    const y = normalizeY(s);
    return validIndices != null ? filterByIndices(y, validIndices) : y;
  });
  return { x, series };
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
    return input
      .filter((item): item is FullGroup => 'series' in item)
      .map(normalizeFull);
  }

  // SimpleGroup[]: [{ x, y }]
  return input
    .filter((item): item is SimpleGroup => 'y' in item)
    .map(normalizeSimple);
}
