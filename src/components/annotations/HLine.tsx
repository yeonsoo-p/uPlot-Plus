import { drawHLine } from '../../annotations';
import { useAnnotationDraw } from './useAnnotationDraw';
import { useStore } from '../../hooks/useChart';
import { valToPx } from '../../core/Scale';
import { Orientation } from '../../types';

export interface HLineProps {
  /** Y data value where the line is drawn */
  value: number;
  /** Scale id for the y-axis (default: 'y') */
  yScale?: string;
  /** Line color (default: 'red') */
  stroke?: string;
  /** Line width in CSS pixels (default: 1) */
  width?: number;
  /** Dash pattern */
  dash?: number[];
  /** Optional text label drawn at the left edge */
  label?: string;
  /** Font for the label */
  labelFont?: string;
}

/**
 * Declarative horizontal line annotation.
 * Renders a horizontal line at a y-data-value. Place inside `<Chart>`.
 */
export function HLine(props: HLineProps): null {
  const store = useStore();
  useAnnotationDraw(props, props.yScale ?? 'y', (dc, scale, p) => {
    const t = store.theme;
    drawHLine(dc, scale, p.value, {
      stroke: p.stroke ?? t.annotationStroke,
      width: p.width,
      dash: p.dash,
    });

    if (p.label != null) {
      const { ctx, plotBox } = dc;
      const pos = valToPx(p.value, scale, plotBox);
      ctx.font = p.labelFont ?? t.annotationFont;
      ctx.fillStyle = p.stroke ?? t.annotationStroke;
      if (scale.ori === Orientation.Horizontal) {
        // Transposed: line is vertical on screen — label above the top edge.
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, pos, plotBox.top - 4);
      } else {
        // Line is horizontal on screen — label at the left edge.
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, plotBox.left + 4, pos - 4);
      }
    }
  });

  return null;
}
