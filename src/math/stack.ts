import type { XGroup } from '../types/data';
import type { BandConfig } from '../types/bands';
import type { NumArray, NullableNumArray } from '../types/common';

/**
 * Stack series within a data group by computing cumulative sums.
 * Returns a new XGroup with stacked y-values and auto-generated band configs.
 *
 * @param group - The data group to stack
 * @param seriesIndices - Which series indices to include (default: all)
 * @param groupIdx - Group index for band configs (default: 0)
 * @returns Stacked group and band configs for fills between layers
 */
export function stackGroup(
  group: XGroup,
  seriesIndices?: number[],
  groupIdx = 0,
): { group: XGroup; bands: BandConfig[] } {
  const indices = seriesIndices ?? group.series.map((_, i) => i);
  const len = group.x.length;

  // Create cumulative arrays
  const stacked: NullableNumArray[] = [];
  const accumulator = new Float64Array(len);

  for (let si = 0; si < indices.length; si++) {
    const srcIdx = indices[si];
    if (srcIdx == null) continue;
    const src = group.series[srcIdx];
    if (src == null) continue;

    const dst: (number | null)[] = new Array<number | null>(len);
    for (let i = 0; i < len; i++) {
      const v = src[i];
      if (v != null) {
        accumulator[i] = (accumulator[i] as number) + v;
        dst[i] = accumulator[i] as number;
      } else {
        dst[i] = null;
      }
    }
    stacked.push(dst);
  }

  // Build new series array preserving original positions
  const indexToStackIdx = new Map<number, number>();
  for (let si = 0; si < indices.length; si++) {
    const idx = indices[si];
    if (idx != null) indexToStackIdx.set(idx, si);
  }
  const newSeries: (NumArray | NullableNumArray)[] = [];
  for (let i = 0; i < group.series.length; i++) {
    const stackIdx = indexToStackIdx.get(i) ?? -1;
    const stackedEntry = stackIdx >= 0 ? stacked[stackIdx] : undefined;
    if (stackedEntry != null) {
      newSeries.push(stackedEntry);
    } else {
      newSeries.push(group.series[i] ?? []);
    }
  }

  // Generate band configs: each layer fills down to the one below
  const bands: BandConfig[] = [];
  for (let i = indices.length - 1; i > 0; i--) {
    const upper = indices[i];
    const lower = indices[i - 1];
    if (upper != null && lower != null) {
      bands.push({
        group: groupIdx,
        series: [upper, lower],
      });
    }
  }

  return {
    group: { x: group.x, series: newSeries },
    bands,
  };
}
