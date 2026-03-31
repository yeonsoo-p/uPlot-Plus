import { useEffect, useRef } from 'react';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useStore } from './useChart';

/**
 * Register a draw callback that fires after all series are drawn
 * but before the snapshot (persistent layer).
 * Uses a ref wrapper so the callback can be an inline function.
 */
export function useDrawHook(fn: DrawCallback): void {
  const store = useStore();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const wrapper: DrawCallback = (dc) => fnRef.current(dc);
    store.drawHooks.add(wrapper);
    return () => {
      store.drawHooks.delete(wrapper);
    };
  }, [store]);
}

/**
 * Register a draw callback that fires on the cursor overlay
 * (redrawn every frame, including cursor-only fast path).
 * Uses a ref wrapper so the callback can be an inline function.
 *
 * **Performance note:** This callback fires on *every* cursor move frame
 * (60-120 Hz). Keep the callback cheap. If your drawing is expensive,
 * cache previous cursor state and skip redundant work:
 * ```ts
 * const lastIdx = useRef(-1);
 * useCursorDrawHook((dc, cursor) => {
 *   if (cursor.activeDataIdx === lastIdx.current) return;
 *   lastIdx.current = cursor.activeDataIdx;
 *   // expensive drawing here
 * });
 * ```
 */
export function useCursorDrawHook(fn: CursorDrawCallback): void {
  const store = useStore();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const wrapper: CursorDrawCallback = (dc, cursor) => fnRef.current(dc, cursor);
    store.cursorDrawHooks.add(wrapper);
    return () => {
      store.cursorDrawHooks.delete(wrapper);
    };
  }, [store]);
}
