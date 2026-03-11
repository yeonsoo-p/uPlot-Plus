import type { ScaleConfig, ScaleState } from '../types';
import type { ChartData } from '../types';
import { createScaleState, invalidateScaleCache } from './Scale';
import { getMinMax, rangeNum, rangeLog, autoRangePart, inf } from '../math/utils';

/**
 * Manages all scales for a chart.
 * Handles auto-ranging from data, scale updates, and mapping between
 * xGroups and their x-scales.
 */
export class ScaleManager {
  scales: Map<string, ScaleState> = new Map();

  /**
   * Map from xGroup index to its x-scale key.
   * Set when series configs register which scale each group uses.
   */
  groupXScales: Map<number, string> = new Map();

  addScale(cfg: ScaleConfig): void {
    this.scales.set(cfg.id, createScaleState(cfg));
  }

  removeScale(id: string): void {
    this.scales.delete(id);
  }

  getScale(id: string): ScaleState | undefined {
    return this.scales.get(id);
  }

  /** Get all scale states (for zoom reset, iteration) */
  getAllScales(): IterableIterator<ScaleState> {
    return this.scales.values();
  }

  /** Assign a group index to an x-scale */
  setGroupXScale(groupIdx: number, scaleKey: string): void {
    this.groupXScales.set(groupIdx, scaleKey);
  }

  /** Get the x-scale key for a group */
  getGroupXScaleKey(groupIdx: number): string | undefined {
    return this.groupXScales.get(groupIdx);
  }

  /**
   * Set a scale's range directly (e.g., for zoom).
   */
  setRange(scaleKey: string, min: number, max: number): void {
    const scale = this.scales.get(scaleKey);
    if (scale) {
      scale.min = min;
      scale.max = max;
      invalidateScaleCache(scale);
    }
  }

  /**
   * Auto-range scales from data.
   * For each x-scale: range from its group's x values.
   * For each y-scale: range from all series that reference it, within the visible x-window.
   */
  autoRange(
    data: ChartData,
    seriesScaleMap: { group: number; index: number; yScale: string }[],
    windows: Map<number, [number, number]>,
  ): void {
    // Auto-range x-scales: compute union of all groups sharing the same scale
    const xRanges = new Map<string, { dataMin: number; dataMax: number }>();

    for (const [groupIdx, scaleKey] of this.groupXScales) {
      const scale = this.scales.get(scaleKey);
      if (!scale || !scale.auto) continue;

      const group = data[groupIdx];
      if (!group || group.x.length === 0) continue;

      const gMin = group.x[0] as number;
      const gMax = group.x[group.x.length - 1] as number;
      const existing = xRanges.get(scaleKey);

      if (existing) {
        existing.dataMin = Math.min(existing.dataMin, gMin);
        existing.dataMax = Math.max(existing.dataMax, gMax);
      } else {
        xRanges.set(scaleKey, { dataMin: gMin, dataMax: gMax });
      }
    }

    for (const [scaleKey, { dataMin, dataMax }] of xRanges) {
      const scale = this.scales.get(scaleKey);
      if (!scale) continue;

      if (scale.range) {
        const [rMin, rMax] = rangeNum(dataMin, dataMax, {
          min: { pad: scale.range.min?.pad ?? 0, soft: scale.range.min?.soft ?? null, mode: scale.range.min?.mode ?? 0 },
          max: { pad: scale.range.max?.pad ?? 0, soft: scale.range.max?.soft ?? null, mode: scale.range.max?.mode ?? 0 },
        });
        scale.min = rMin;
        scale.max = rMax;
      } else {
        scale.min = dataMin;
        scale.max = dataMax;
      }
      invalidateScaleCache(scale);
    }

    // Collect y-ranges per y-scale
    const yMins = new Map<string, number>();
    const yMaxs = new Map<string, number>();

    for (const { group, index, yScale } of seriesScaleMap) {
      const grp = data[group];
      if (!grp) continue;

      const yData = grp.series[index];
      if (!yData || yData.length === 0) continue;

      const window = windows.get(group);
      const i0 = window ? window[0] : 0;
      const i1 = window ? window[1] : yData.length - 1;

      const yScaleState = this.scales.get(yScale);
      const isLog = yScaleState?.distr === 3;
      const [sMin, sMax] = getMinMax(yData as ArrayLike<number | null>, i0, i1, 0, isLog);

      const curMin = yMins.get(yScale);
      const curMax = yMaxs.get(yScale);

      yMins.set(yScale, curMin != null ? Math.min(curMin, sMin) : sMin);
      yMaxs.set(yScale, curMax != null ? Math.max(curMax, sMax) : sMax);
    }

    // Apply y-scale ranges
    for (const [scaleKey, dataMin] of yMins) {
      const scale = this.scales.get(scaleKey);
      if (!scale || !scale.auto) continue;

      const dataMax = yMaxs.get(scaleKey) ?? -inf;

      if (dataMin === inf) continue; // no valid data

      let rMin: number;
      let rMax: number;

      if (scale.distr === 3) {
        [rMin, rMax] = rangeLog(dataMin, dataMax, scale.log, false);
      } else {
        const rangeCfg = scale.range ?? { min: autoRangePart, max: autoRangePart };
        [rMin, rMax] = rangeNum(dataMin, dataMax, {
          min: { pad: rangeCfg.min?.pad ?? autoRangePart.pad, soft: rangeCfg.min?.soft ?? autoRangePart.soft, mode: rangeCfg.min?.mode ?? autoRangePart.mode },
          max: { pad: rangeCfg.max?.pad ?? autoRangePart.pad, soft: rangeCfg.max?.soft ?? autoRangePart.soft, mode: rangeCfg.max?.mode ?? autoRangePart.mode },
        });
      }

      scale.min = rMin;
      scale.max = rMax;
      invalidateScaleCache(scale);
    }
  }
}
