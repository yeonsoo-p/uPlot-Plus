import type { SelectState, BBox } from '../types';
import { round } from '../math/utils';

export interface SelectDrawConfig {
  /** Fill color for selection rectangle */
  fill?: string;
  /** Stroke color for selection border */
  stroke?: string;
  /** Stroke width */
  width?: number;
}

const defaultSelectConfig: Required<SelectDrawConfig> = {
  fill: 'rgba(0,0,0,0.07)',
  stroke: 'rgba(0,0,0,0.15)',
  width: 1,
};

/**
 * Draw the drag-to-zoom selection rectangle.
 */
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  select: SelectState,
  plotBox: BBox,
  pxRatio: number,
  config?: SelectDrawConfig,
): void {
  if (!select.show || select.width <= 0) return;

  // Read CSS custom properties for themeable defaults (set by e.g. a .dark class)
  const cs = ctx.canvas != null ? getComputedStyle(ctx.canvas) : null;
  const cssVar = (name: string) => cs?.getPropertyValue(name).trim() || '';

  const themedDefaults: SelectDrawConfig = {
    fill: cssVar('--uplot-select-fill') || defaultSelectConfig.fill,
    stroke: cssVar('--uplot-select-stroke') || defaultSelectConfig.stroke,
  };
  const cfg = { ...defaultSelectConfig, ...themedDefaults, ...config };
  const pr = pxRatio;

  const x = round((plotBox.left + select.left) * pr);
  const y = round((plotBox.top + select.top) * pr);
  const w = round(select.width * pr);
  const h = round(select.height * pr);

  ctx.save();

  ctx.fillStyle = cfg.fill;
  ctx.fillRect(x, y, w, h);

  if (cfg.width > 0) {
    ctx.strokeStyle = cfg.stroke;
    ctx.lineWidth = round(cfg.width * pr);
    ctx.strokeRect(x, y, w, h);
  }

  ctx.restore();
}
