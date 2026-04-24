import { useRef, useEffect, useLayoutEffect, useState, useCallback, useContext, useMemo } from 'react';
import type { ChartProps } from '../types';
import { DEFAULT_ACTIONS } from '../types/interaction';
import type { DrawCallback, CursorDrawCallback } from '../types/hooks';
import { useChartStore } from '../hooks/useChartStore';
import { ChartContext, OverlayHostContext } from '../hooks/useChart';
import { useInteraction } from '../hooks/useInteraction';
import { useCursorSyncGroup } from '../sync/useCursorSyncGroup';
import { useScaleSyncGroup } from '../sync/useScaleSyncGroup';
import { normalizeData } from '../core/normalizeData';
import { themeToVars } from '../rendering/theme';
import { ThemeRevisionContext } from './ThemeProvider';

/**
 * Root chart component.
 * Creates a canvas element, manages the chart store, and provides context to children.
 * Canvas drawing is completely decoupled from React's reconciliation cycle.
 */
export function Chart({
  width, height, data, children, className, pxRatio: pxRatioOverride, title, xlabel, ylabel, ariaLabel,
  minWidth, minHeight,
  onDraw, onCursorDraw, syncCursorKey, syncScaleKey, actions, theme, locale, timezone,
  onClick, onContextMenu, onDblClick, onCursorMove, onCursorLeave,
  onScaleChange, onSelect,
  autoFillSeries = true,
}: ChartProps) {
  const store = useChartStore();
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [overlayHostEl, setOverlayHostEl] = useState<HTMLDivElement | null>(null);

  const pxRatio = pxRatioOverride ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const ariaDesc = useMemo(() => {
    const parts: string[] = [];
    if (xlabel) parts.push(`X: ${xlabel}`);
    if (ylabel) parts.push(`Y: ${ylabel}`);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }, [xlabel, ylabel]);

  const autoW = width === 'auto';
  const autoH = height === 'auto';
  // When auto-sizing, we wait for the first ResizeObserver measurement before rendering the canvas.
  const [measured, setMeasured] = useState(!autoW && !autoH);

  // Refs for values accessed inside ResizeObserver callback — avoids
  // disconnecting/reconnecting the observer when only the explicit
  // dimension or pxRatio changes.
  const measuredRef = useRef(measured);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const pxRatioRef = useRef(pxRatio);
  useLayoutEffect(() => { measuredRef.current = measured; }, [measured]);
  useLayoutEffect(() => { widthRef.current = width; }, [width]);
  useLayoutEffect(() => { heightRef.current = height; }, [height]);
  useLayoutEffect(() => { pxRatioRef.current = pxRatio; }, [pxRatio]);

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
  useCursorSyncGroup(store, syncCursorKey);
  // Scale-range sync (charts + ZoomRangers with the same key)
  useScaleSyncGroup(store, syncScaleKey);

  // Stable canvas callback ref — useCallback keeps identity stable so React
  // won't tear down (null) and re-set (node) on every render.
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (canvasElRef.current === node) return;
    canvasElRef.current = node;
    store.setCanvas(node);
    if (node) {
      Object.defineProperty(node, '__chartStore', { value: store, configurable: true });
      // If setSize already ran before canvas mounted (auto-sizing), apply
      // stored dimensions now — setSize() would no-op (values unchanged).
      if (store.width > 0 && store.height > 0) {
        node.width = store.width * store.pxRatio;
        node.height = store.height * store.pxRatio;
        node.style.width = `${store.width}px`;
        node.style.height = `${store.height}px`;
      }
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

  // Stable overlay-host callback ref — overlays portal here so their
  // positioned ancestor is the canvas container, not the outer wrapper.
  const overlayHostElRef = useRef<HTMLDivElement | null>(null);
  const overlayHostRef = useCallback((node: HTMLDivElement | null) => {
    if (overlayHostElRef.current === node) return;
    overlayHostElRef.current = node;
    setOverlayHostEl(node);
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

  // Sync the autoFillSeries flag *before* the data layout effect runs so that
  // the first applyDefaults(Data) call sees the user's intended flag value.
  useLayoutEffect(() => {
    store.setAutoFillSeries(autoFillSeries);
  }, [store, autoFillSeries]);

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

  // Mixed mode: one dimension is auto, the other is explicit.
  // When the explicit dimension changes (e.g. height during drag-resize),
  // apply it synchronously so the chart redraws every frame.
  useLayoutEffect(() => {
    if (!measured) return;
    const hasAutoW = typeof width !== 'number';
    const hasAutoH = typeof height !== 'number';
    if (hasAutoW === hasAutoH) return; // both auto or both explicit — skip
    const resolvedW = typeof width === 'number' ? width : store.width;
    const resolvedH = typeof height === 'number' ? height : store.height;
    if (resolvedW <= 0 || resolvedH <= 0) return;
    store.setSize(resolvedW, resolvedH, pxRatio);
    if (mountedRef.current) {
      store.redrawSync();
    }
  }, [store, width, height, pxRatio, measured]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      store.setCanvas(null);
      store.scheduler.cancel();
      store.focusedSeries = null;
      store.eventCallbacks = {};
    };
  }, [store]);

  // ResizeObserver — primary size driver for auto-sizing mode.
  // Uses refs for width/height/pxRatio/measured so the observer stays
  // connected when only the explicit dimension or pxRatio changes.
  useEffect(() => {
    if (containerEl == null || typeof ResizeObserver === 'undefined') return;
    if (!autoW && !autoH) return; // no auto dimensions — skip observer

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width: w, height: h } = entry.contentRect;
      const curWidth = widthRef.current;
      const curHeight = heightRef.current;
      const curPxRatio = pxRatioRef.current;
      // In mixed mode (one auto, one explicit), use the explicit prop for the fixed dimension
      const resolvedW = typeof curWidth === 'number' ? curWidth : Math.round(w);
      const resolvedH = typeof curHeight === 'number' ? curHeight : Math.round(h);
      if (resolvedW > 0 && resolvedH > 0 && (resolvedW !== store.width || resolvedH !== store.height)) {
        store.setSize(resolvedW, resolvedH, curPxRatio);
        if (!measuredRef.current) {
          measuredRef.current = true;
          setMeasured(true);
        }
        // Redraw synchronously — setSize clears the canvas bitmap,
        // so deferring to RAF would flash a blank frame.
        store.redrawSync();
      } else if (!measuredRef.current && resolvedW > 0 && resolvedH > 0) {
        measuredRef.current = true;
        setMeasured(true);
      }
    });

    observer.observe(containerEl);
    return () => { observer.disconnect(); };
  }, [store, containerEl, autoW, autoH]);

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
          role="img"
          aria-label={ariaLabel ?? title ?? 'Chart'}
          aria-roledescription="interactive chart"
          aria-description={ariaDesc}
          data-testid="chart-container"
          style={{
            position: 'relative',
            width: autoW ? '100%' : `${width}px`,
            height: autoH ? '100%' : `${height}px`,
            cursor: 'default',
            order: 0,
            outline: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
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
          <div ref={overlayHostRef} data-testid="chart-overlay-host" />
        </div>
        <OverlayHostContext.Provider value={overlayHostEl}>
          {children}
        </OverlayHostContext.Provider>
      </div>
    </ChartContext.Provider>
  );
}
