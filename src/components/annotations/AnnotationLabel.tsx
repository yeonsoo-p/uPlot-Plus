import { useDrawHook } from '../../hooks/useDrawHook';
import { useLayoutEffect, useRef } from 'react';
import { useStore } from '../../hooks/useChart';

export interface AnnotationLabelProps {
  /** X data value */
  x: number;
  /** Y data value */
  y: number;
  /** Label text */
  text: string;
  /** Scale id for the x-axis (default: 'x') */
  xScale?: string;
  /** Scale id for the y-axis (default: 'y') */
  yScale?: string;
  /** Text color (default: '#000') */
  fill?: string;
  /** Font (default: '12px sans-serif') */
  font?: string;
  /** Text alignment (default: 'left') */
  align?: CanvasTextAlign;
  /** Text baseline (default: 'bottom') */
  baseline?: CanvasTextBaseline;
}

/**
 * Declarative text label annotation at data coordinates.
 * Place inside `<Chart>`.
 */
export function AnnotationLabel(props: AnnotationLabelProps): null {
  const store = useStore();
  const propsRef = useRef(props);
  useLayoutEffect(() => { propsRef.current = props; });

  useDrawHook((dc) => {
    const p = propsRef.current;
    const pos = dc.project(p.x, p.y, p.xScale ?? 'x', p.yScale ?? 'y');
    if (pos == null) return;

    const t = store.theme;
    const { ctx } = dc;
    ctx.font = p.font ?? t.annotationFont;
    ctx.fillStyle = p.fill ?? t.annotationLabelFill;
    ctx.textAlign = p.align ?? 'left';
    ctx.textBaseline = p.baseline ?? 'bottom';
    ctx.fillText(p.text, pos.px, pos.py - 4);
  });

  return null;
}
