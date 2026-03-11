import type { ChartData } from '../types';
import type { ScaleState } from '../types';
import { closestIdx } from '../math/utils';

/**
 * Manages chart data and per-xGroup visible windows.
 * The window for each group is the index range [i0, i1] of x-values
 * that fall within the group's x-scale range.
 */
export class DataStore {
  data: ChartData = [];

  /** Per-group visible window: groupIdx -> [i0, i1] */
  windows: Map<number, [number, number]> = new Map();

  setData(data: ChartData): void {
    this.data = data;
    this.windows.clear();
  }

  /**
   * Update the visible window for each xGroup based on its x-scale range.
   * @param getXScale - function to look up the x-scale for a group index
   */
  updateWindows(getXScale: (groupIdx: number) => ScaleState | undefined): void {
    for (let gi = 0; gi < this.data.length; gi++) {
      const group = this.data[gi];
      const xScale = getXScale(gi);

      if (!group || !xScale || xScale.min == null || xScale.max == null) {
        this.windows.set(gi, [0, (group?.x.length ?? 1) - 1]);
        continue;
      }

      const x = group.x;
      if (x.length === 0) {
        this.windows.set(gi, [0, 0]);
        continue;
      }

      let i0 = closestIdx(xScale.min, x);
      let i1 = closestIdx(xScale.max, x);

      // Include boundary points just outside visible range so series
      // lines/fills extend to the plot edges when clipped
      if (i0 > 0 && (x[i0] as number) > xScale.min) i0--;
      if (i1 < x.length - 1 && (x[i1] as number) < xScale.max) i1++;

      this.windows.set(gi, [i0, i1]);
    }
  }

  /** Get the visible window for a group */
  getWindow(groupIdx: number): [number, number] {
    return this.windows.get(groupIdx) ?? [0, (this.data[groupIdx]?.x.length ?? 1) - 1];
  }

  /** Get x values for a group */
  getXValues(groupIdx: number): ArrayLike<number> {
    return this.data[groupIdx]?.x ?? [];
  }

  /** Get y values for a specific series */
  getYValues(groupIdx: number, seriesIdx: number): ArrayLike<number | null> {
    return (this.data[groupIdx]?.series[seriesIdx] ?? []) as ArrayLike<number | null>;
  }
}
