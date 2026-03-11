import { useEffect, useRef } from 'react';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useChart } from './useChart';

/**
 * Register a draw callback that fires after all series are drawn
 * but before the snapshot (persistent layer).
 * Uses a ref wrapper so the callback can be an inline function.
 */
export function useDrawHook(fn: DrawCallback): void {
  const store = useChart();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const wrapper: DrawCallback = (dc) => fnRef.current(dc);
    store.drawHooks.push(wrapper);
    return () => {
      store.drawHooks = store.drawHooks.filter(h => h !== wrapper);
    };
  }, [store]);
}

/**
 * Register a draw callback that fires on the cursor overlay
 * (redrawn every frame, including cursor-only fast path).
 * Uses a ref wrapper so the callback can be an inline function.
 */
export function useCursorDrawHook(fn: CursorDrawCallback): void {
  const store = useChart();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const wrapper: CursorDrawCallback = (dc, cursor) => fnRef.current(dc, cursor);
    store.cursorDrawHooks.push(wrapper);
    return () => {
      store.cursorDrawHooks = store.cursorDrawHooks.filter(h => h !== wrapper);
    };
  }, [store]);
}
