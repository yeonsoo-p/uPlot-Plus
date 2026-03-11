import React, { useRef, useEffect } from 'react';
import type { ChartProps } from '../types';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // Attach mouse/touch interaction handlers
  useInteraction(store, containerRef);

  // Cursor sync across charts with same key
  useSyncGroup(store, syncKey);

  // Update store dimensions (assign canvas from ref before sizing,
  // since the canvas-ref effect may not have run yet on first mount)
  useEffect(() => {
    if (canvasRef.current && store.canvas !== canvasRef.current) {
      store.canvas = canvasRef.current;
    }
    store.pxRatio = pxRatio;
    store.setSize(width, height);
  }, [store, width, height, pxRatio]);

  // ResizeObserver: auto-detect container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (el == null || typeof ResizeObserver === 'undefined') return;

    let rafId = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width: w, height: h } = entry.contentRect;
      // Debounce via rAF to avoid layout thrashing
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (w > 0 && h > 0 && (w !== store.width || h !== store.height)) {
          store.setSize(Math.round(w), Math.round(h));
        }
      });
    });

    observer.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [store, containerRef]);

  // Update store data
  useEffect(() => {
    store.dataStore.setData(data);

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

  // Set canvas ref on mount
  useEffect(() => {
    if (canvasRef.current) {
      store.canvas = canvasRef.current;
      store.scheduleRedraw();
    }

    return () => {
      store.canvas = null;
      store.scheduler.cancel();
    };
  }, [store]);

  // Register onDraw callback prop
  useEffect(() => {
    if (onDraw == null) return;
    store.drawHooks.push(onDraw);
    return () => { store.drawHooks = store.drawHooks.filter(h => h !== onDraw); };
  }, [store, onDraw]);

  // Register onCursorDraw callback prop
  useEffect(() => {
    if (onCursorDraw == null) return;
    store.cursorDrawHooks.push(onCursorDraw);
    return () => { store.cursorDrawHooks = store.cursorDrawHooks.filter(h => h !== onCursorDraw); };
  }, [store, onCursorDraw]);

  return (
    <ChartContext.Provider value={store}>
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          cursor: 'crosshair',
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
        {children}
      </div>
    </ChartContext.Provider>
  );
}
