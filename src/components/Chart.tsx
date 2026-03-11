import React, { useRef, useEffect } from 'react';
import type { ChartProps } from '../types';
import { useChartStore } from '../hooks/useChartStore';
import { ChartContext } from '../hooks/useChart';
import { useInteraction } from '../hooks/useInteraction';

/**
 * Root chart component.
 * Creates a canvas element, manages the chart store, and provides context to children.
 * Canvas drawing is completely decoupled from React's reconciliation cycle.
 */
export function Chart({ width, height, data, children, className, pxRatio: pxRatioOverride }: ChartProps) {
  const store = useChartStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // Attach mouse/touch interaction handlers
  useInteraction(store, containerRef);

  // Update store dimensions
  useEffect(() => {
    store.width = width;
    store.height = height;
    store.pxRatio = pxRatio;

    if (canvasRef.current) {
      canvasRef.current.width = width * pxRatio;
      canvasRef.current.height = height * pxRatio;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
    }

    store.scheduleRedraw();
  }, [store, width, height, pxRatio]);

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

      canvasRef.current.width = width * pxRatio;
      canvasRef.current.height = height * pxRatio;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      store.scheduleRedraw();
    }

    return () => {
      store.canvas = null;
      if (store.rafId != null) {
        cancelAnimationFrame(store.rafId);
        store.rafId = null;
      }
    };
  }, [store, width, height, pxRatio]);

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
