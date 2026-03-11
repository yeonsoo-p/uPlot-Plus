import type { CursorState, ScaleState, BBox } from '../types';
import type { ChartData } from '../types/data';
import type { SeriesConfig } from '../types/series';
import { valToPos } from './Scale';
import { closestIdx } from '../math/utils';

/**
 * Manages cursor position and nearest-point snapping.
 * Computes the closest data point across all visible series/groups
 * using pixel-space Euclidean distance.
 */
export class CursorManager {
  readonly state: CursorState = {
    left: -10,
    top: -10,
    activeGroup: -1,
    activeSeriesIdx: -1,
    activeDataIdx: -1,
  };

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
      const cursorXVal = posToValFromPixel(cssX + xOff, xScale, xDim, xOff);
      const dataIdx = closestIdx(cursorXVal, xData, wi0, wi1);

      const xVal = xData[dataIdx];
      if (xVal == null) continue;

      const pxX = valToPos(xVal, xScale, xDim, xOff);

      // Check each series in this group
      for (const sc of seriesConfigs) {
        if (sc.group !== gi || sc.show === false) continue;

        const yData = group.series[sc.index];
        if (yData == null) continue;

        const yVal = yData[dataIdx];
        if (yVal == null) continue;

        const yScaleState = getScale(sc.yScale);
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
          bestIdx = dataIdx;
        }
      }
    }

    this.state.activeGroup = bestGroup;
    this.state.activeSeriesIdx = bestSeries;
    this.state.activeDataIdx = bestIdx;
  }
}

/** Convert a CSS pixel position to a data value (inline to avoid circular deps) */
function posToValFromPixel(pos: number, scale: ScaleState, dim: number, off: number): number {
  let pct = (pos - off) / dim;
  if (scale.dir === -1) pct = 1 - pct;

  if (scale.min == null || scale.max == null) return 0;
  // Linear only for cursor snapping (log/asinh cursor handled by valToPos already)
  return scale.min + pct * (scale.max - scale.min);
}
