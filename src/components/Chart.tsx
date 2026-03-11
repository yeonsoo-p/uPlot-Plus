import React, { useRef, useEffect, useCallback } from 'react';
import type { ChartProps } from '../types';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useChartStore } from '../hooks/useChartStore';
import { ChartContext } from '../hooks/useChart';
import { useInteraction } from '../hooks/useInteraction';
import { useSyncGroup } from '../sync/useSyncGroup';

/**
 * Root chart component.
 * Creates a canvas element, manages the chart store, and provides context to children.
 * Canvas drawing is completely decoupled from React's reconciliation cycle.
 */
export function Chart({ width, height, data, children, className, pxRatio: pxRatioOverride, onDraw, onCursorDraw, syncKey }: ChartProps) {
  const store = useChartStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // Attach mouse/touch interaction handlers
  useInteraction(store, containerRef);

  // Cursor sync across charts with same key
  useSyncGroup(store, syncKey);

  // 6e: Callback ref for canvas — single assignment point, replaces two separate effects
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    store.canvas = node;
    if (node) store.scheduleRedraw();
  }, [store]);

  // Update store dimensions
  useEffect(() => {
    store.pxRatio = pxRatio;
    store.setSize(width, height);
  }, [store, width, height, pxRatio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      store.canvas = null;
      store.scheduler.cancel();
      store.focusedSeries = null;
    };
  }, [store]);

  // 6g: ResizeObserver without redundant rAF wrapper
  // store.setSize() already schedules via RenderScheduler which batches into a single RAF
  useEffect(() => {
    const el = containerRef.current;
    if (el == null || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0 && (w !== store.width || h !== store.height)) {
        store.setSize(Math.round(w), Math.round(h));
      }
    });

    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [store, containerRef]);

  // Update store data
  useEffect(() => {
    store.dataStore.setData(data);
    store.renderer.clearCache();

    // Auto-create a single shared x-scale for all groups
    const xScaleKey = 'x';
    if (!store.scaleManager.getScale(xScaleKey)) {
      store.registerScale({
        id: xScaleKey,
        ori: 0,
        dir: 1,
        auto: true,
      });
    }
    for (let i = 0; i < data.length; i++) {
      store.scaleManager.setGroupXScale(i, xScaleKey);
    }

    store.scheduleRedraw();
  }, [store, data]);

  // 6c: Ref wrapper for onDraw — register stable wrapper once, update ref on each render
  const onDrawRef = useRef<DrawCallback | undefined>(onDraw);
  onDrawRef.current = onDraw;

  useEffect(() => {
    const wrapper: DrawCallback = (dc) => { onDrawRef.current?.(dc); };
    store.drawHooks.push(wrapper);
    return () => { store.drawHooks = store.drawHooks.filter(h => h !== wrapper); };
  }, [store]);

  // 6c: Ref wrapper for onCursorDraw
  const onCursorDrawRef = useRef<CursorDrawCallback | undefined>(onCursorDraw);
  onCursorDrawRef.current = onCursorDraw;

  useEffect(() => {
    const wrapper: CursorDrawCallback = (dc, cursor) => { onCursorDrawRef.current?.(dc, cursor); };
    store.cursorDrawHooks.push(wrapper);
    return () => { store.cursorDrawHooks = store.cursorDrawHooks.filter(h => h !== wrapper); };
  }, [store]);

  return (
    <ChartContext.Provider value={store}>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: `${width}px`,
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            cursor: 'crosshair',
            order: 0,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
        </div>
        {children}
      </div>
    </ChartContext.Provider>
  );
}
