import { drawVRegion } from '../../annotations';
import { useAnnotationDraw } from './useAnnotationDraw';
import { useStore } from '../../hooks/useChart';

export interface VRegionProps {
  /** Left x data value */
  xMin: number;
  /** Right x data value */
  xMax: number;
  /** Scale id for the x-axis (default: 'x') */
  xScale?: string;
  /** Fill color (default: theme annotationFill) */
  fill?: string;
  /** Border stroke color */
  stroke?: string;
  /** Border stroke width */
  strokeWidth?: number;
  /** Border dash pattern */
  dash?: number[];
}

/**
 * Declarative vertical region annotation.
 * Fills the area between two x-data-values. Place inside `<Chart>`.
 */
export function VRegion(props: VRegionProps): null {
  const store = useStore();
  useAnnotationDraw(props, props.xScale ?? 'x', (dc, scale, p) => {
    drawVRegion(dc, scale, p.xMin, p.xMax, {
      fill: p.fill ?? store.theme.annotationFill,
      stroke: p.stroke,
      width: p.strokeWidth,
      dash: p.dash,
    });
  });

  return null;
}
