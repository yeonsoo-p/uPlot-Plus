import type { CursorState, ScaleState, BBox } from '../types';
import type { ChartData } from '../types/data';
import type { SeriesConfig } from '../types/series';
import { valToPos, posToVal } from './Scale';
import { closestIdx } from '../math/utils';

/** Minimal store interface to avoid circular dependency with ChartStore. */
export interface SyncTarget {
  dataStore: { data: ChartData; getWindow(gi: number): [number, number] };
  scaleManager: { getGroupXScaleKey(gi: number): string | undefined; getScale(id: string): ScaleState | undefined };
  seriesConfigs: SeriesConfig[];
  plotBox: BBox;
}

/**
 * Manages cursor position and nearest-point snapping.
 * Computes the closest data point across all visible series/groups
 * using pixel-space Euclidean distance.
 */
export class CursorManager {
  state: CursorState = {
    left: -10,
    top: -10,
    activeGroup: -1,
    activeSeriesIdx: -1,
    activeDataIdx: -1,
  };

  /** Cached grouping of visible series configs by group index */
  private _groupedConfigs = new Map<number, SeriesConfig[]>();
  private _groupedConfigsSource: SeriesConfig[] | null = null;

  /** Rebuild grouped configs only when seriesConfigs array reference changes */
  private getGroupedConfigs(seriesConfigs: SeriesConfig[]): Map<number, SeriesConfig[]> {
    if (this._groupedConfigsSource !== seriesConfigs) {
      this._groupedConfigsSource = seriesConfigs;
      this._groupedConfigs.clear();
      for (const sc of seriesConfigs) {
        if (sc.show === false) continue;
        let arr = this._groupedConfigs.get(sc.group);
        if (arr == null) {
          arr = [];
          this._groupedConfigs.set(sc.group, arr);
        }
        arr.push(sc);
      }
    }
    return this._groupedConfigs;
  }

  /** Invalidate groupedConfigs cache (call after toggleSeries, etc.) */
  invalidateGroupedConfigs(): void {
    this._groupedConfigsSource = null;
  }

  /** Hide the cursor (move off-screen) */
  hide(): void {
    this.state.left = -10;
    this.state.top = -10;
    this.state.activeGroup = -1;
    this.state.activeSeriesIdx = -1;
    this.state.activeDataIdx = -1;
  }

  /**
   * Update cursor position and snap to nearest data point.
   *
   * @param cssX - cursor X in CSS pixels relative to plot area left
   * @param cssY - cursor Y in CSS pixels relative to plot area top
   * @param plotBox - current plot bounding box
   * @param data - chart data groups
   * @param seriesConfigs - all series configs
   * @param getScale - scale lookup
   */
  update(
    cssX: number,
    cssY: number,
    plotBox: BBox,
    data: ChartData,
    seriesConfigs: SeriesConfig[],
    getScale: (id: string) => ScaleState | undefined,
    getWindow: (groupIdx: number) => [number, number],
    getGroupXScaleKey: (groupIdx: number) => string | undefined,
  ): void {
    this.state.left = cssX;
    this.state.top = cssY;

    let bestDist = Infinity;
    let bestGroup = -1;
    let bestSeries = -1;
    let bestIdx = -1;

    // Use cached grouped configs (rebuilt only when seriesConfigs reference changes)
    const groupedConfigs = this.getGroupedConfigs(seriesConfigs);

    for (let gi = 0; gi < data.length; gi++) {
      const group = data[gi];
      if (group == null) continue;

      const xData = group.x;
      if (xData.length === 0) continue;

      // Determine x-scale for this group
      const xScaleId = getGroupXScaleKey(gi);
      if (xScaleId == null) continue;
      const xScale = getScale(xScaleId);
      if (xScale == null || xScale.min == null || xScale.max == null) continue;

      const [wi0, wi1] = getWindow(gi);

      // Find closest x-index to cursor position
      // Convert cursor CSS X to data value, then find closest index
      const xDim = plotBox.width;
      const xOff = plotBox.left;

      // closestIdx on the x data within the visible window
      const cursorXVal = posToVal(cssX + xOff, xScale, xDim, xOff);
      const dataIdx = closestIdx(cursorXVal, xData, wi0, wi1);

      // Check adjacent x-indices for better snapping accuracy
      // The nearest point in pixel space may be at dataIdx ± 1 due to y-value proximity
      const candidates = [dataIdx];
      if (dataIdx > wi0) candidates.push(dataIdx - 1);
      if (dataIdx < wi1) candidates.push(dataIdx + 1);

      // Cache y-scale lookups to avoid redundant calls when multiple series share the same y-scale
      const yScaleCache = new Map<string, ScaleState | undefined>();

      for (const di of candidates) {
        const xVal = xData[di];
        if (xVal == null) continue;

        const pxX = valToPos(xVal, xScale, xDim, xOff);

        // Check each series in this group
        for (const sc of groupedConfigs.get(gi) ?? []) {

          const yData = group.series[sc.index];
          if (yData == null) continue;

          const yVal = yData[di];
          if (yVal == null) continue;

          let yScaleState = yScaleCache.get(sc.yScale);
          if (yScaleState == null && !yScaleCache.has(sc.yScale)) {
            yScaleState = getScale(sc.yScale);
            yScaleCache.set(sc.yScale, yScaleState);
          }
          if (yScaleState == null || yScaleState.min == null || yScaleState.max == null) continue;

          const yDim = plotBox.height;
          const yOff = plotBox.top;
          const pxY = valToPos(yVal, yScaleState, yDim, yOff);

          // Euclidean distance in CSS pixel space
          const dx = (cssX + xOff) - pxX;
          const dy = (cssY + yOff) - pxY;
          const dist = dx * dx + dy * dy; // skip sqrt for comparison

          if (dist < bestDist) {
            bestDist = dist;
            bestGroup = gi;
            bestSeries = sc.index;
            bestIdx = di;

            // Early exit on exact hit
            if (dist === 0) break;
          }
        }

        if (bestDist === 0) break;
      }
    }

    this.state.activeGroup = bestGroup;
    this.state.activeSeriesIdx = bestSeries;
    this.state.activeDataIdx = bestIdx;
  }

  /**
   * Sync cursor to a specific x-value (from another chart in a sync group).
   * Finds the closest data index and positions the cursor there.
   */
  syncToValue(xVal: number, store: SyncTarget): void {
    const data = store.dataStore.data;
    if (data.length === 0) return;

    // Find closest x-index in group 0 (primary)
    const group = data[0];
    if (group == null) return;

    const xScaleKey = store.scaleManager.getGroupXScaleKey(0);
    if (xScaleKey == null) return;
    const xScale = store.scaleManager.getScale(xScaleKey);
    if (xScale == null || xScale.min == null || xScale.max == null) return;

    const [wi0, wi1] = store.dataStore.getWindow(0);
    const dataIdx = closestIdx(xVal, group.x, wi0, wi1);
    const foundX = group.x[dataIdx];
    if (foundX == null) return;

    // Convert to pixel position
    const pxX = valToPos(foundX, xScale, store.plotBox.width, store.plotBox.left);
    this.state.left = pxX - store.plotBox.left;
    this.state.activeGroup = 0;
    this.state.activeDataIdx = dataIdx;

    // Find first visible series to compute proper y position
    let bestSeriesIdx = 0;
    let yPos = store.plotBox.height / 2; // fallback to center

    for (const sc of store.seriesConfigs) {
      if (sc.group !== 0 || sc.show === false) continue;
      const yData = group.series[sc.index];
      if (yData == null) continue;
      const yVal = yData[dataIdx];
      if (yVal == null) continue;
      const yScale = store.scaleManager.getScale(sc.yScale);
      if (yScale == null || yScale.min == null || yScale.max == null) continue;

      yPos = valToPos(yVal, yScale, store.plotBox.height, store.plotBox.top) - store.plotBox.top;
      bestSeriesIdx = sc.index;
      break;
    }

    this.state.top = yPos;
    this.state.activeSeriesIdx = bestSeriesIdx;
  }
}
