import type { ChartData } from '../types';
import type { ScaleState } from '../types';
import { SortOrder } from '../types';
import { closestIdx, getMinMax } from '../math/utils';
import { isScaleReady } from './Scale';
import { BlockMinMaxTree } from './BlockMinMax';

/**
 * Manages chart data and per-xGroup visible windows.
 * The window for each group is the index range [i0, i1] of x-values
 * that fall within the group's x-scale range.
 */
export class DataStore {
  data: ChartData = [];

  /** Per-group visible window: groupIdx -> [i0, i1] */
  windows: Map<number, [number, number]> = new Map();

  /** Per-group min/max cache: groupIdx -> ("index:i0:i1" -> [min, max]) */
  private minMaxCache: Map<number, Map<string, [number, number]>> = new Map();

  /** Block min-max trees for fast range queries: "group:seriesIndex" -> tree */
  private blockTrees: Map<string, BlockMinMaxTree> = new Map();

  setData(data: ChartData): void {
    this.data = data;
    this.windows.clear();
    for (const sub of this.minMaxCache.values()) sub.clear();
    this.minMaxCache.clear();
    this.blockTrees.clear();
  }

  /** Get or lazily build a block min-max tree for a series */
  private getOrBuildTree(group: number, index: number): BlockMinMaxTree | undefined {
    const key = `${group}:${index}`;
    let tree = this.blockTrees.get(key);
    if (tree) return tree;

    const grp = this.data[group];
    if (!grp) return undefined;
    const yData = grp.series[index];
    if (!yData || yData.length === 0) return undefined;

    tree = new BlockMinMaxTree(yData as ArrayLike<number | null>);
    this.blockTrees.set(key, tree);
    return tree;
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

      if (!group || !xScale || !isScaleReady(xScale)) {
        i0 = 0;
        i1 = Math.max(0, (group?.x.length ?? 1) - 1);
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
        // Only invalidate this group's min/max cache
        this.minMaxCache.get(gi)?.clear();
      }

      this.windows.set(gi, [i0, i1]);
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
    sorted: SortOrder,
    isLog: boolean,
  ): [number, number] {
    let groupCache = this.minMaxCache.get(group);
    const key = `${index}:${i0}:${i1}`;
    if (groupCache) {
      const cached = groupCache.get(key);
      if (cached != null) return cached;
    } else {
      groupCache = new Map();
      this.minMaxCache.set(group, groupCache);
    }

    const grp = this.data[group];
    if (!grp) return [Infinity, -Infinity];

    const yData = grp.series[index];
    if (!yData || yData.length === 0) return [Infinity, -Infinity];

    let result: [number, number];

    // Use block tree for unsorted, non-log data (the common case)
    // Sorted data and log scales need special handling in getMinMax
    const tree = (!isLog && sorted === SortOrder.Unsorted) ? this.getOrBuildTree(group, index) : undefined;
    if (tree) {
      result = tree.rangeMinMax(i0, i1);
    } else {
      result = getMinMax(yData as ArrayLike<number | null>, i0, i1, sorted, isLog);
    }

    groupCache.set(key, result);
    return result;
  }

  /** Get block tree for a series (exposed for incremental append) */
  getBlockTree(group: number, index: number): BlockMinMaxTree | undefined {
    return this.getOrBuildTree(group, index);
  }

  /**
   * Append new data points to an existing group.
   * Much cheaper than setData() for streaming scenarios — O(newPoints) instead of O(totalPoints).
   *
   * On first append, Float64Array x/y values are silently converted to regular
   * arrays so they can grow. This is a one-time O(n) cost — subsequent appends
   * are O(newPoints) only.
   * Block trees are incrementally updated, and only the affected group's cache is invalidated.
   */
  appendData(
    groupIdx: number,
    newX: number[],
    newSeries: (number | null)[][],
  ): void {
    const group = this.data[groupIdx];
    if (!group) return;

    // Convert typed x-array → growable regular array on first append
    let xArr: number[];
    if (!Array.isArray(group.x)) {
      xArr = Array.from(group.x);
      group.x = xArr;
    } else {
      xArr = group.x;
    }

    // Append x values
    for (let i = 0; i < newX.length; i++) {
      const v = newX[i];
      if (v != null) xArr.push(v);
    }

    // Append y values for each series
    for (let si = 0; si < group.series.length; si++) {
      let yArr = group.series[si];
      if (!yArr) continue;

      // Convert typed y-array → growable regular array on first append
      if (!Array.isArray(yArr)) {
        yArr = Array.from(yArr) as (number | null)[];
        group.series[si] = yArr;
      }

      const newY = newSeries[si];
      if (newY) {
        const mutableY = yArr as (number | null)[];
        for (let i = 0; i < newY.length; i++) {
          mutableY.push(newY[i] ?? null);
        }
      }

      // Update block tree incrementally
      const tree = this.blockTrees.get(`${groupIdx}:${si}`);
      if (tree) {
        tree.setData(yArr as ArrayLike<number | null>);
        tree.grow(yArr.length);
      }
    }

    // Invalidate only this group's min/max cache
    this.minMaxCache.get(groupIdx)?.clear();
  }

  /**
   * Convert x-arrays in chart data to Float64Array for optimal memory layout.
   * Call before setData() when not using appendData() (Float64Array is fixed-length).
   */
  static toTypedX(data: ChartData): ChartData {
    for (const group of data) {
      if (Array.isArray(group.x)) {
        group.x = Float64Array.from(group.x);
      }
    }
    return data;
  }
}
