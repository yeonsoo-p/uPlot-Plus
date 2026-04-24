import { drawVLine } from '../../annotations';
import { useAnnotationDraw } from './useAnnotationDraw';
import { useStore } from '../../hooks/useChart';
import { valToPx } from '../../core/Scale';
import { Orientation } from '../../types';

export interface VLineProps {
  /** X data value where the line is drawn */
  value: number;
  /** Scale id for the x-axis (default: 'x') */
  xScale?: string;
  /** Line color (default: 'red') */
  stroke?: string;
  /** Line width in CSS pixels (default: 1) */
  width?: number;
  /** Dash pattern */
  dash?: number[];
  /** Optional text label drawn at the top */
  label?: string;
  /** Font for the label */
  labelFont?: string;
}

/**
 * Declarative vertical line annotation.
 * Renders a vertical line at an x-data-value. Place inside `<Chart>`.
 */
export function VLine(props: VLineProps): null {
  const store = useStore();
  useAnnotationDraw(props, props.xScale ?? 'x', (dc, scale, p) => {
    const t = store.theme;
    drawVLine(dc, scale, p.value, {
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
        // Line is vertical on screen — label above the top edge.
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, pos, plotBox.top - 4);
      } else {
        // Transposed: line is horizontal on screen — label at the right edge.
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, plotBox.left + plotBox.width - 4, pos - 4);
      }
    }
  });

  return null;
}
