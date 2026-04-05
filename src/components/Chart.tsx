import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import type { ChartProps, ChartData, DataInput } from '../types';
import { DEFAULT_ACTIONS } from '../types/interaction';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useChartStore } from '../hooks/useChartStore';
import { ChartContext } from '../hooks/useChart';
import { useInteraction } from '../hooks/useInteraction';
import { useSyncGroup } from '../sync/useSyncGroup';
import { normalizeData } from '../core/normalizeData';

/**
 * Root chart component.
 * Creates a canvas element, manages the chart store, and provides context to children.
 * Canvas drawing is completely decoupled from React's reconciliation cycle.
 */
export function Chart({
  width, height, data, children, className, pxRatio: pxRatioOverride, title, xlabel, ylabel,
  onDraw, onCursorDraw, syncKey, actions,
  onClick, onContextMenu, onDblClick, onCursorMove, onCursorLeave,
  onScaleChange, onSelect,
}: ChartProps) {
  const store = useChartStore();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // Merge user action overrides with defaults and sync to store
  useEffect(() => {
    store.actionMap = actions != null
      ? new Map([...DEFAULT_ACTIONS, ...actions])
      : new Map(DEFAULT_ACTIONS);
  }, [store, actions]);

  // Sync title and axis labels to store (in effect, not render)
  useEffect(() => {
    store.setLabels(title, xlabel, ylabel);
  }, [store, title, xlabel, ylabel]);

  // Sync event callback props — written during render, read only by imperative handlers
  const cbs = store.eventCallbacks;
  cbs.onClick = onClick;
  cbs.onContextMenu = onContextMenu;
  cbs.onDblClick = onDblClick;
  cbs.onCursorMove = onCursorMove;
  cbs.onCursorLeave = onCursorLeave;
  cbs.onScaleChange = onScaleChange;
  cbs.onSelect = onSelect;

  // Attach mouse/touch interaction handlers
  useInteraction(store, containerEl);

  // Cursor sync across charts with same key
  useSyncGroup(store, syncKey);

  // Ref-gated canvas callback — avoids useCallback, gates on identity
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = (node: HTMLCanvasElement | null) => {
    if (canvasElRef.current === node) return;
    canvasElRef.current = node;
    store.setCanvas(node);
    if (node) store.scheduleRedraw();
  };

  // Ref-gated container callback
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const containerRef = (node: HTMLDivElement | null) => {
    if (containerElRef.current === node) return;
    containerElRef.current = node;
    setContainerEl(node);
  };

  // Synchronous size update — useLayoutEffect runs before paint
  useLayoutEffect(() => {
    store.setSize(width, height, pxRatio);
    store.redrawSync();
  }, [store, width, height, pxRatio]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      store.setCanvas(null);
      store.scheduler.cancel();
      store.focusedSeries = null;
      store.eventCallbacks = {};
    };
  }, [store]);

  // ResizeObserver — depends on containerEl (state) so re-runs when DOM element changes
  useEffect(() => {
    if (containerEl == null || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0 && (w !== store.width || h !== store.height)) {
        store.setSize(Math.round(w), Math.round(h));
        store.scheduleRedraw();
      }
    });

    observer.observe(containerEl);
    return () => { observer.disconnect(); };
  }, [store, containerEl]);

  // Normalize flexible input → internal ChartData (ref-based identity check, no useMemo)
  const prevDataRef = useRef<DataInput | undefined>(undefined);
  const normalizedRef = useRef<ChartData>(normalizeData(data));
  if (data !== prevDataRef.current) {
    prevDataRef.current = data;
    normalizedRef.current = normalizeData(data);
  }
  const normalized = normalizedRef.current;

  // Update store data
  const prevStoreDataRef = useRef(data);
  useEffect(() => {
    if (data === prevStoreDataRef.current && store.dataStore.data.length > 0) return;
    prevStoreDataRef.current = data;

    store.setData(normalized);
    store.scheduleRedraw();
  }, [store, data, normalized]);

  // Ref wrapper for onDraw — register stable wrapper once, update ref on each render
  const onDrawRef = useRef<DrawCallback | undefined>(onDraw);
  onDrawRef.current = onDraw;

  useEffect(() => {
    const wrapper: DrawCallback = (dc) => { onDrawRef.current?.(dc); };
    store.drawHooks.add(wrapper);
    return () => { store.drawHooks.delete(wrapper); };
  }, [store]);

  // Ref wrapper for onCursorDraw
  const onCursorDrawRef = useRef<CursorDrawCallback | undefined>(onCursorDraw);
  onCursorDrawRef.current = onCursorDraw;

  useEffect(() => {
    const wrapper: CursorDrawCallback = (dc, cursor) => { onCursorDrawRef.current?.(dc, cursor); };
    store.cursorDrawHooks.add(wrapper);
    return () => { store.cursorDrawHooks.delete(wrapper); };
  }, [store]);

  return (
    <ChartContext.Provider value={store}>
      <div
        className={className}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: `${width}px`,
        }}
      >
        <div
          ref={containerRef}
          tabIndex={-1}
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            cursor: 'crosshair',
            outline: 'none',
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
