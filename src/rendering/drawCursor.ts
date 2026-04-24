import type { CursorState, ScaleState, BBox } from '../types';
import type { ChartData } from '../types/data';
import type { SeriesConfig } from '../types/series';
import { projectPoint, isScaleReady } from '../core/Scale';
import { round } from '../math/utils';
import type { ResolvedTheme } from './theme';
import { THEME_DEFAULTS } from './theme';

/** Stroke width for the point indicator outline (CSS pixels) */
const POINT_STROKE_WIDTH = 2;

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
  stroke: THEME_DEFAULTS.cursorStroke,
  width: THEME_DEFAULTS.cursorWidth,
  dash: THEME_DEFAULTS.cursorDash,
  pointRadius: THEME_DEFAULTS.cursorPointRadius,
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
  seriesConfigMap?: Map<string, SeriesConfig>,
  theme?: ResolvedTheme,
): void {
  if (cursor.left < 0 || cursor.top < 0) return;

  const t = theme ?? THEME_DEFAULTS;
  const themedDefaults: CursorDrawConfig = {
    stroke: t.cursorStroke,
    width: t.cursorWidth,
    dash: t.cursorDash,
    pointRadius: t.cursorPointRadius,
  };
  const cfg = { ...defaultCursorConfig, ...themedDefaults, ...config };
  const pr = pxRatio;

  const plotLft = round(plotBox.left * pr);
  const plotTop = round(plotBox.top * pr);
  const plotWid = round(plotBox.width * pr);
  const plotHgt = round(plotBox.height * pr);

  const lineW = round(cfg.width * pr);
  // Canvas strokes are centered on coordinates; for odd-width lines,
  // a 0.5px offset aligns to physical pixels, preventing anti-aliased blur.
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
    if (group != null && si >= 0 && si < (group.series.length) && di < group.x.length) {
      const xVal = group.x[di];
      const yData = group.series[si];
      const yVal = yData != null ? yData[di] : null;

      if (xVal != null && yVal != null) {
        // Find matching series config for stroke color and cursor opt-out
        let pointFill = cfg.stroke;
        let showPoint = true;
        const matchedCfg = seriesConfigMap?.get(`${gi}:${si}`);
        if (matchedCfg != null) {
          const scStroke = matchedCfg.stroke;
          pointFill = (typeof scStroke === 'string' ? scStroke : undefined) ?? cfg.stroke;
          showPoint = matchedCfg.cursor?.show !== false;
        }

        if (showPoint) {
          const xScaleId = getGroupXScaleKey(gi);
          const xScale = xScaleId != null ? getScale(xScaleId) : undefined;
          const yScaleId = matchedCfg?.yScale ?? findYScaleId(seriesConfigs, gi, si);
          const yScale = yScaleId != null ? getScale(yScaleId) : undefined;

          if (xScale != null && yScale != null && isScaleReady(xScale) && isScaleReady(yScale)) {
            const { px: pxCss, py: pyCss } = projectPoint(xScale, yScale, xVal, yVal, plotBox);
            const px = round(pxCss * pr);
            const py = round(pyCss * pr);
            const r = cfg.pointRadius * pr;

            const strokeW = round(POINT_STROKE_WIDTH * pr);
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fillStyle = t.pointFill;
            ctx.fill();
            ctx.strokeStyle = pointFill;
            ctx.lineWidth = strokeW;
            ctx.stroke();
          }
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
