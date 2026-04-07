import { useDrawHook } from '../../hooks/useDrawHook';
import { useLayoutEffect, useRef } from 'react';
import { useStore } from '../../hooks/useChart';
import { drawDiagonalLine, drawSlopeInterceptLine } from '../../annotations';

interface DiagonalLineCommonProps {
  /** Scale id for the x-axis (default: 'x') */
  xScale?: string;
  /** Scale id for the y-axis (default: 'y') */
  yScale?: string;
  /** Line color (default: theme annotationStroke) */
  stroke?: string;
  /** Line width in CSS pixels (default: 1) */
  width?: number;
  /** Dash pattern */
  dash?: number[];
  /** Optional text label drawn at midpoint */
  label?: string;
  /** Font for the label */
  labelFont?: string;
  /** Extend line to plot box edges */
  extend?: boolean;
}

interface DiagonalLineTwoPointProps extends DiagonalLineCommonProps {
  /** Start x data value */
  x1: number;
  /** Start y data value */
  y1: number;
  /** End x data value */
  x2: number;
  /** End y data value */
  y2: number;
  slope?: never;
  intercept?: never;
}

interface DiagonalLineSlopeProps extends DiagonalLineCommonProps {
  /** Slope of the line (y = slope * x + intercept) */
  slope: number;
  /** Y-intercept of the line (y = slope * x + intercept) */
  intercept: number;
  x1?: never;
  y1?: never;
  x2?: never;
  y2?: never;
}

export type DiagonalLineProps = DiagonalLineTwoPointProps | DiagonalLineSlopeProps;

/**
 * Declarative diagonal line annotation.
 * Accepts either two data points (`x1,y1,x2,y2`) or a `slope` and `intercept`.
 * When `extend` is true the line is extrapolated to the plot-box edges.
 * Slope/intercept lines default to `extend: true`.
 * Place inside `<Chart>`.
 */
export function DiagonalLine(props: DiagonalLineProps): null {
  const store = useStore();
  const propsRef = useRef(props);
  useLayoutEffect(() => { propsRef.current = props; });

  useDrawHook((dc) => {
    const p = propsRef.current;
    const xScale = dc.getScale(p.xScale ?? 'x');
    const yScale = dc.getScale(p.yScale ?? 'y');
    if (xScale == null || yScale == null) return;

    const t = store.theme;
    const style = {
      stroke: p.stroke ?? t.annotationStroke,
      width: p.width,
      dash: p.dash,
      extend: p.extend,
      label: p.label,
      labelFont: p.labelFont,
      font: t.annotationFont,
    };

    if ('slope' in p && p.slope !== undefined) {
      drawSlopeInterceptLine(dc, xScale, yScale, p.slope, p.intercept, style);
    } else {
      drawDiagonalLine(dc, xScale, yScale, p.x1, p.y1, p.x2, p.y2, style);
    }
  });

  return null;
}
