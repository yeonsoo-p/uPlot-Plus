import type { NumArray, NullableNumArray } from '../types/common';
import type { XGroup } from '../types/data';
import type { LttbResult } from '../types/downsample';
import { at } from '../utils/at';

/**
 * Largest Triangle Three Buckets (LTTB) downsampling.
 *
 * Reduces a dataset to `targetPoints` while preserving visual shape.
 * For each bucket, selects the point forming the largest triangle with
 * the previously selected point and the average of the next bucket.
 * First and last non-null points are always kept.
 *
 * Null values in yData create logical gaps. The data is split into
 * contiguous non-null runs, LTTB is applied to each run with
 * proportional bucket allocation, and results are reassembled with
 * null boundaries preserved.
 */
export function lttb(
  xData: ArrayLike<number>,
  yData: ArrayLike<number | null>,
  targetPoints: number,
): LttbResult {
  const len = xData.length;
  targetPoints = Math.max(2, Math.round(targetPoints));

  // No downsampling needed
  if (len <= targetPoints) {
    const indices = new Uint32Array(len);
    const x = new Float64Array(len);
    const y: (number | null)[] = new Array<number | null>(len);
    for (let i = 0; i < len; i++) {
      indices[i] = i;
      x[i] = at(xData, i);
      y[i] = yData[i] ?? null;
    }
    return { indices, x, y };
  }

  // Find contiguous non-null runs
  const runs: [number, number][] = [];
  let runStart = -1;
  let totalNonNull = 0;

  for (let i = 0; i < len; i++) {
    if (yData[i] != null) {
      if (runStart === -1) runStart = i;
      totalNonNull++;
    } else {
      if (runStart !== -1) {
        runs.push([runStart, i - 1]);
        runStart = -1;
      }
    }
  }
  if (runStart !== -1) {
    runs.push([runStart, len - 1]);
  }

  // Edge case: all nulls
  if (totalNonNull === 0) {
    return {
      indices: new Uint32Array(0),
      x: new Float64Array(0),
      y: [],
    };
  }

  // If total non-null points fit within target, keep them all
  if (totalNonNull <= targetPoints) {
    const indices = new Uint32Array(totalNonNull);
    const x = new Float64Array(totalNonNull);
    const y: (number | null)[] = new Array<number | null>(totalNonNull);
    let k = 0;
    for (let i = 0; i < len; i++) {
      if (yData[i] != null) {
        indices[k] = i;
        x[k] = at(xData, i);
        y[k] = at(yData, i);
        k++;
      }
    }
    return { indices, x, y };
  }

  // Allocate proportional buckets per run
  const selectedIndices: number[] = [];

  for (const [rStart, rEnd] of runs) {
    const runLen = rEnd - rStart + 1;
    const runTarget = Math.max(2, Math.round(targetPoints * (runLen / totalNonNull)));
    const runSelected = lttbCore(xData, yData, rStart, rEnd, runTarget);
    for (const idx of runSelected) {
      selectedIndices.push(idx);
    }
  }

  // Build result
  const n = selectedIndices.length;
  const indices = new Uint32Array(n);
  const x = new Float64Array(n);
  const y: (number | null)[] = new Array<number | null>(n);

  for (let i = 0; i < n; i++) {
    const idx = at(selectedIndices, i);
    indices[i] = idx;
    x[i] = at(xData, idx);
    y[i] = at(yData, idx);
  }

  return { indices, x, y };
}

/**
 * Core LTTB on a contiguous non-null range [i0, i1].
 * Returns array of selected indices in ascending order.
 */
function lttbCore(
  xData: ArrayLike<number>,
  yData: ArrayLike<number | null>,
  i0: number,
  i1: number,
  targetPoints: number,
): number[] {
  const rangeLen = i1 - i0 + 1;

  if (rangeLen <= targetPoints) {
    const result: number[] = [];
    for (let i = i0; i <= i1; i++) result.push(i);
    return result;
  }

  const selected: number[] = [];

  // Always select first point
  selected.push(i0);

  const bucketCount = targetPoints - 2;
  const bucketSize = (rangeLen - 2) / bucketCount;

  let prevSelectedIdx = i0;

  for (let b = 0; b < bucketCount; b++) {
    // Current bucket range
    const bucketStart = i0 + 1 + Math.floor(b * bucketSize);
    const bucketEnd = Math.min(i0 + 1 + Math.floor((b + 1) * bucketSize) - 1, i1 - 1);

    // Next bucket average (or last point for final bucket)
    let avgX = 0;
    let avgY = 0;
    let avgCount = 0;

    if (b < bucketCount - 1) {
      const nextStart = i0 + 1 + Math.floor((b + 1) * bucketSize);
      const nextEnd = Math.min(i0 + 1 + Math.floor((b + 2) * bucketSize) - 1, i1 - 1);
      for (let i = nextStart; i <= nextEnd; i++) {
        avgX += at(xData, i);
        avgY += (at(yData, i) ?? 0);
        avgCount++;
      }
    } else {
      // Last bucket: use the last point as the anchor
      avgX = at(xData, i1);
      avgY = at(yData, i1) ?? 0;
      avgCount = 1;
    }

    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    }

    // Find point in current bucket with largest triangle area
    const prevX = at(xData, prevSelectedIdx);
    const prevY = at(yData, prevSelectedIdx) ?? 0;

    let bestIdx = bucketStart;
    let bestArea = -1;

    for (let i = bucketStart; i <= bucketEnd; i++) {
      const cx = at(xData, i);
      const cy = at(yData, i) ?? 0;

      // Triangle area = 0.5 * |x_a(y_b - y_c) + x_b(y_c - y_a) + x_c(y_a - y_b)|
      // Since we only compare, skip the 0.5 multiplier
      const area = Math.abs(
        prevX * (cy - avgY) +
        cx * (avgY - prevY) +
        avgX * (prevY - cy),
      );

      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    }

    selected.push(bestIdx);
    prevSelectedIdx = bestIdx;
  }

  // Always select last point
  selected.push(i1);

  return selected;
}

/**
 * Downsample an entire XGroup, applying LTTB to each series against the
 * shared x-axis. Uses the union of selected indices across all series to
 * preserve x-alignment.
 */
export function lttbGroup(
  group: XGroup,
  targetPoints: number,
): XGroup {
  const len = group.x.length;
  targetPoints = Math.max(2, Math.round(targetPoints));

  if (len <= targetPoints) {
    return group;
  }

  // Collect union of selected indices across all series
  const indexSet = new Set<number>();

  for (const series of group.series) {
    const result = lttb(group.x, series, targetPoints);
    for (let i = 0; i < result.indices.length; i++) {
      indexSet.add(at(result.indices, i));
    }
  }

  // Sort indices
  const sortedIndices = Array.from(indexSet).sort((a, b) => a - b);
  const n = sortedIndices.length;

  // Build new XGroup
  const newX = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    newX[i] = at(group.x, at(sortedIndices, i));
  }

  const newSeries: (NumArray | NullableNumArray)[] = [];
  for (const series of group.series) {
    const hasNulls = Array.isArray(series) && series.some(v => v === null);
    if (hasNulls) {
      const arr: (number | null)[] = new Array<number | null>(n);
      for (let i = 0; i < n; i++) {
        arr[i] = series[at(sortedIndices, i)] ?? null;
      }
      newSeries.push(arr);
    } else {
      const arr = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        arr[i] = at(series, at(sortedIndices, i)) ?? 0;
      }
      newSeries.push(arr);
    }
  }

  return { x: newX, series: newSeries };
}
