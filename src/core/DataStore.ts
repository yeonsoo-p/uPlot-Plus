import type { ChartData } from '../types';
import type { ScaleState } from '../types';
import { closestIdx, getMinMax } from '../math/utils';

/**
 * Manages chart data and per-xGroup visible windows.
 * The window for each group is the index range [i0, i1] of x-values
 * that fall within the group's x-scale range.
 */
export class DataStore {
  data: ChartData = [];

  /** Per-group visible window: groupIdx -> [i0, i1] */
  windows: Map<number, [number, number]> = new Map();

  /** Cached min/max per series within a window: "group:index:i0:i1" -> [min, max] */
  private minMaxCache: Map<string, [number, number]> = new Map();

  setData(data: ChartData): void {
    this.data = data;
    this.windows.clear();
    this.minMaxCache.clear();
  }

  /**
   * Update the visible window for each xGroup based on its x-scale range.
   * @param getXScale - function to look up the x-scale for a group index
   */
  /** Update windows and return true if any window actually changed */
  updateWindows(getXScale: (groupIdx: number) => ScaleState | undefined): boolean {
    let changed = false;

    for (let gi = 0; gi < this.data.length; gi++) {
      const group = this.data[gi];
      const xScale = getXScale(gi);
      const prev = this.windows.get(gi);

      let i0: number;
      let i1: number;

      if (!group || !xScale || xScale.min == null || xScale.max == null) {
        i0 = 0;
        i1 = (group?.x.length || 1) - 1;
      } else {
        const x = group.x;
        if (x.length === 0) {
          i0 = 0;
          i1 = 0;
        } else {
          i0 = closestIdx(xScale.min, x);
          i1 = closestIdx(xScale.max, x);

          // Include boundary points just outside visible range
          const xi0 = x[i0];
          const xi1 = x[i1];
          if (i0 > 0 && xi0 != null && xi0 > xScale.min) i0--;
          if (i1 < x.length - 1 && xi1 != null && xi1 < xScale.max) i1++;
        }
      }

      if (!prev || prev[0] !== i0 || prev[1] !== i1) {
        changed = true;
      }

      this.windows.set(gi, [i0, i1]);
    }

    if (changed) {
      this.minMaxCache.clear();
    }

    return changed;
  }

  /** Get the visible window for a group */
  getWindow(groupIdx: number): [number, number] {
    return this.windows.get(groupIdx) ?? [0, (this.data[groupIdx]?.x.length || 1) - 1];
  }

  /** Get x values for a group */
  getXValues(groupIdx: number): ArrayLike<number> {
    return this.data[groupIdx]?.x ?? [];
  }

  /** Get y values for a specific series */
  getYValues(groupIdx: number, seriesIdx: number): ArrayLike<number | null> {
    return (this.data[groupIdx]?.series[seriesIdx] ?? []) as ArrayLike<number | null>;
  }

  /** Get cached min/max for a series within a window range */
  getCachedMinMax(
    group: number,
    index: number,
    i0: number,
    i1: number,
    sorted: 0 | 1 | -1,
    isLog: boolean,
  ): [number, number] {
    const key = `${group}:${index}:${i0}:${i1}`;
    const cached = this.minMaxCache.get(key);
    if (cached != null) return cached;

    const grp = this.data[group];
    if (!grp) return [Infinity, -Infinity];

    const yData = grp.series[index];
    if (!yData || yData.length === 0) return [Infinity, -Infinity];

    const result = getMinMax(yData as ArrayLike<number | null>, i0, i1, sorted, isLog);
    this.minMaxCache.set(key, result);
    return result;
  }
}
