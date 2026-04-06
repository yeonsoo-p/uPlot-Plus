import { useRef, useEffect, useLayoutEffect, useState, useCallback, useContext, useMemo } from 'react';
import type { ChartProps } from '../types';
import { DEFAULT_ACTIONS } from '../types/interaction';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useChartStore } from '../hooks/useChartStore';
import { ChartContext } from '../hooks/useChart';
import { useInteraction } from '../hooks/useInteraction';
import { useSyncGroup } from '../sync/useSyncGroup';
import { normalizeData } from '../core/normalizeData';
import { themeToVars } from '../rendering/theme';
import { ThemeRevisionContext } from './ThemeProvider';

/**
 * Root chart component.
 * Creates a canvas element, manages the chart store, and provides context to children.
 * Canvas drawing is completely decoupled from React's reconciliation cycle.
 */
export function Chart({
  width, height, data, children, className, pxRatio: pxRatioOverride, title, xlabel, ylabel,
  minWidth, minHeight,
  onDraw, onCursorDraw, syncKey, actions, theme, locale, timezone,
  onClick, onContextMenu, onDblClick, onCursorMove, onCursorLeave,
  onScaleChange, onSelect,
}: ChartProps) {
  const store = useChartStore();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const autoW = width === 'auto';
  const autoH = height === 'auto';
  // When auto-sizing, we wait for the first ResizeObserver measurement before rendering the canvas.
  const [measured, setMeasured] = useState(!autoW && !autoH);

  // Convert theme prop to CSS custom properties for the wrapper div
  const themeStyle = useMemo(() => theme != null ? themeToVars(theme) : undefined, [theme]);

  // When the theme prop changes, invalidate the cached snapshot and trigger
  // a full redraw so the canvas re-resolves CSS custom properties.
  const themeStyleRef = useRef(themeStyle);
  useEffect(() => {
    if (themeStyleRef.current === themeStyle) return;
    themeStyleRef.current = themeStyle;
    store.renderer.invalidateSnapshot();
    store.scheduleRedraw();
  }, [store, themeStyle]);

  // When an ancestor ThemeProvider changes its theme, repaint the canvas
  // so it re-resolves the new CSS custom properties.
  const themeRevision = useContext(ThemeRevisionContext);
  const themeRevisionRef = useRef(themeRevision);
  useEffect(() => {
    if (themeRevisionRef.current === themeRevision) return;
    themeRevisionRef.current = themeRevision;
    store.renderer.invalidateSnapshot();
    store.scheduleRedraw();
  }, [store, themeRevision]);

  // Merge user action overrides with defaults and sync to store
  useEffect(() => {
    store.actionMap = actions != null
      ? new Map([...DEFAULT_ACTIONS, ...actions])
      : new Map(DEFAULT_ACTIONS);
  }, [store, actions]);

  // Sync title and axis labels to store — layout effect so labels are
  // current before redrawSync() fires on size changes.
  useLayoutEffect(() => {
    store.setLabels(title, xlabel, ylabel, locale, timezone);
  }, [store, title, xlabel, ylabel, locale, timezone]);

  // Sync event callback props — deferred to effect so render stays pure
  useEffect(() => {
    const cbs = store.eventCallbacks;
    cbs.onClick = onClick;
    cbs.onContextMenu = onContextMenu;
    cbs.onDblClick = onDblClick;
    cbs.onCursorMove = onCursorMove;
    cbs.onCursorLeave = onCursorLeave;
    cbs.onScaleChange = onScaleChange;
    cbs.onSelect = onSelect;
  }, [store, onClick, onContextMenu, onDblClick, onCursorMove, onCursorLeave, onScaleChange, onSelect]);

  // Attach mouse/touch interaction handlers
  useInteraction(store, containerEl);

  // Cursor sync across charts with same key
  useSyncGroup(store, syncKey);

  // Stable canvas callback ref — useCallback keeps identity stable so React
  // won't tear down (null) and re-set (node) on every render.
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (canvasElRef.current === node) return;
    canvasElRef.current = node;
    store.setCanvas(node);
    if (node) {
      Object.defineProperty(node, '__chartStore', { value: store, configurable: true });
      store.scheduleRedraw();
    }
  }, [store]);

  // Stable container callback ref
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (containerElRef.current === node) return;
    containerElRef.current = node;
    setContainerEl(node);
  }, []);

  // Ref wrapper for onDraw — layout effect so it's current before redrawSync
  const onDrawRef = useRef<DrawCallback | undefined>(onDraw);
  useLayoutEffect(() => { onDrawRef.current = onDraw; });

  // Ref wrapper for onCursorDraw — layout effect so it's current before redrawSync
  const onCursorDrawRef = useRef<CursorDrawCallback | undefined>(onCursorDraw);
  useLayoutEffect(() => { onCursorDrawRef.current = onCursorDraw; });

  // Tracks whether data has been loaded at least once — gates redrawSync
  // so the first mount doesn't paint an empty chart before data/configs register.
  const mountedRef = useRef(false);

  // Update store data — layout effect so data is current before redrawSync
  const prevStoreDataRef = useRef(data);
  useLayoutEffect(() => {
    if (data === prevStoreDataRef.current && store.dataStore.data.length > 0) return;
    prevStoreDataRef.current = data;
    mountedRef.current = true;
    store.setData(normalizeData(data));
    store.scheduleRedraw();
  }, [store, data]);

  // Synchronous size update — runs last among layout effects in this component,
  // after labels, data, and draw refs are all current.
  // When auto-sizing, the ResizeObserver handles size updates instead.
  useLayoutEffect(() => {
    if (typeof width !== 'number' || typeof height !== 'number') return;
    store.setSize(width, height, pxRatio);
    if (mountedRef.current) {
      store.redrawSync();
    }
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

  // ResizeObserver — depends on containerEl (state) so re-runs when DOM element changes.
  // In auto-sizing mode, this is the primary size driver.
  useEffect(() => {
    if (containerEl == null || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width: w, height: h } = entry.contentRect;
      // In mixed mode (one auto, one explicit), use the explicit prop for the fixed dimension
      const resolvedW = typeof width === 'number' ? width : Math.round(w);
      const resolvedH = typeof height === 'number' ? height : Math.round(h);
      if (resolvedW > 0 && resolvedH > 0 && (resolvedW !== store.width || resolvedH !== store.height)) {
        store.setSize(resolvedW, resolvedH, pxRatio);
        if (!measured) setMeasured(true);
        store.scheduleRedraw();
      } else if (!measured && resolvedW > 0 && resolvedH > 0) {
        setMeasured(true);
      }
    });

    observer.observe(containerEl);
    return () => { observer.disconnect(); };
  }, [store, containerEl, width, height, pxRatio, measured]);

  // Watch for CSS class changes on <html> (e.g. dark mode toggle) and repaint.
  // This avoids needing to remount charts when the theme class changes.
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      store.renderer.invalidateSnapshot();
      store.scheduleRedraw();
    });
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
    return () => { observer.disconnect(); };
  }, [store]);

  useLayoutEffect(() => {
    const wrapper: DrawCallback = (dc) => { onDrawRef.current?.(dc); };
    store.drawHooks.add(wrapper);
    return () => { store.drawHooks.delete(wrapper); };
  }, [store]);

  useLayoutEffect(() => {
    const wrapper: CursorDrawCallback = (dc, cursor) => { onCursorDrawRef.current?.(dc, cursor); };
    store.cursorDrawHooks.add(wrapper);
    return () => { store.cursorDrawHooks.delete(wrapper); };
  }, [store]);

  return (
    <ChartContext.Provider value={store}>
      <div
        className={className}
        style={{
          ...themeStyle,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: autoW ? '100%' : `${width}px`,
          height: autoH ? '100%' : undefined,
          minWidth: minWidth != null ? `${minWidth}px` : undefined,
          minHeight: minHeight != null ? `${minHeight}px` : undefined,
          isolation: 'isolate',
        }}
      >
        <div
          ref={containerRef}
          tabIndex={0}
          data-testid="chart-container"
          style={{
            position: 'relative',
            width: autoW ? '100%' : `${width}px`,
            height: autoH ? '100%' : `${height}px`,
            cursor: 'default',
            order: 0,
            outline: 'none',
          }}
        >
          {measured && (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          />
          )}
        </div>
        {children}
      </div>
    </ChartContext.Provider>
  );
}
