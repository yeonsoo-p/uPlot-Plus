import type { CursorState, ScaleState, BBox } from '../types';
import type { ChartData } from '../types/data';
import type { SeriesConfig } from '../types/series';
import { valToPos } from '../core/Scale';
import { round } from '../math/utils';

export interface CursorDrawConfig {
  /** Crosshair line color */
  stroke?: string;
  /** Crosshair line width in CSS pixels */
  width?: number;
  /** Crosshair dash pattern */
  dash?: number[];
  /** Point indicator radius */
  pointRadius?: number;
  /** Whether to show X crosshair */
  showX?: boolean;
  /** Whether to show Y crosshair */
  showY?: boolean;
}

const defaultCursorConfig: Required<CursorDrawConfig> = {
  stroke: '#607D8B',
  width: 1,
  dash: [5, 3],
  pointRadius: 4,
  showX: true,
  showY: true,
};

/**
 * Draw cursor crosshairs and point indicator.
 */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  cursor: CursorState,
  plotBox: BBox,
  pxRatio: number,
  data: ChartData,
  seriesConfigs: SeriesConfig[],
  getScale: (id: string) => ScaleState | undefined,
  getGroupXScaleKey: (groupIdx: number) => string | undefined,
  config?: CursorDrawConfig,
): void {
  if (cursor.left < 0 || cursor.top < 0) return;

  const cfg = { ...defaultCursorConfig, ...config };
  const pr = pxRatio;

  const plotLft = round(plotBox.left * pr);
  const plotTop = round(plotBox.top * pr);
  const plotWid = round(plotBox.width * pr);
  const plotHgt = round(plotBox.height * pr);

  const lineW = round(cfg.width * pr);
  // Half-pixel offset for crisp odd-width lines
  const offset = (lineW % 2) / 2;

  const curX = round((plotBox.left + cursor.left) * pr) + offset;
  const curY = round((plotBox.top + cursor.top) * pr) + offset;

  ctx.save();

  ctx.strokeStyle = cfg.stroke;
  ctx.lineWidth = lineW;
  ctx.setLineDash(cfg.dash.map(d => d * pr));

  // Vertical crosshair
  if (cfg.showX) {
    ctx.beginPath();
    ctx.moveTo(curX, plotTop);
    ctx.lineTo(curX, plotTop + plotHgt);
    ctx.stroke();
  }

  // Horizontal crosshair
  if (cfg.showY) {
    ctx.beginPath();
    ctx.moveTo(plotLft, curY);
    ctx.lineTo(plotLft + plotWid, curY);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Draw point indicator at snapped data point
  if (cursor.activeGroup >= 0 && cursor.activeDataIdx >= 0) {
    const gi = cursor.activeGroup;
    const si = cursor.activeSeriesIdx;
    const di = cursor.activeDataIdx;

    const group = data[gi];
    if (group != null) {
      const xVal = group.x[di];
      const yData = group.series[si];
      const yVal = yData != null ? yData[di] : null;

      if (xVal != null && yVal != null) {
        // Find matching series config for stroke color
        let pointFill = cfg.stroke;
        for (const sc of seriesConfigs) {
          if (sc.group === gi && sc.index === si) {
            pointFill = sc.stroke ?? cfg.stroke;
            break;
          }
        }

        const xScaleId = getGroupXScaleKey(gi);
        const xScale = xScaleId != null ? getScale(xScaleId) : undefined;
        const yScaleId = findYScaleId(seriesConfigs, gi, si);
        const yScale = yScaleId != null ? getScale(yScaleId) : undefined;

        if (xScale != null && yScale != null) {
          const px = round(valToPos(xVal, xScale, plotBox.width, plotBox.left) * pr);
          const py = round(valToPos(yVal, yScale, plotBox.height, plotBox.top) * pr);
          const r = cfg.pointRadius * pr;

          const strokeW = round(2 * pr);
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = pointFill;
          ctx.lineWidth = strokeW;
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
}

function findYScaleId(seriesConfigs: SeriesConfig[], group: number, index: number): string | undefined {
  for (const sc of seriesConfigs) {
    if (sc.group === group && sc.index === index) {
      return sc.yScale;
    }
  }
  return undefined;
}
