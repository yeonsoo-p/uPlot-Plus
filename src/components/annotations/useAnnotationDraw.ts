import { useLayoutEffect, useRef } from 'react';
import { useDrawHook } from '../../hooks/useDrawHook';
import type { DrawContext } from '../../types/hooks';
import type { ScaleState } from '../../types';

/**
 * Shared hook for annotation components.
 * Handles props ref syncing and scale lookup, then calls the draw function.
 */
export function useAnnotationDraw<T>(
  props: T,
  scaleId: string,
  draw: (dc: DrawContext, scale: ScaleState, props: T) => void,
): void {
  const propsRef = useRef(props);
  useLayoutEffect(() => { propsRef.current = props; }, [props]);

  useDrawHook((dc) => {
    const scale = dc.getScale(scaleId);
    if (scale == null) return;
    draw(dc, scale, propsRef.current);
  });
}
