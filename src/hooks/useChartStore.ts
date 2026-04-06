import { useRef } from 'react';
import type { ScaleConfig, SeriesConfig, ResolvedSeriesConfig, BBox, ChartData } from '../types';
import type { ActionKey, ReactionValue } from '../types/interaction';
import { DEFAULT_ACTIONS } from '../types/interaction';
import type { AxisConfig, AxisState } from '../types/axes';
import type { SelectState } from '../types/cursor';
import { ScaleManager } from '../core/ScaleManager';
import { DataStore } from '../core/DataStore';
import { CursorManager } from '../core/CursorManager';
import { RenderScheduler } from '../core/RenderScheduler';
import { CanvasRenderer, type RenderableSeriesInfo } from '../rendering/CanvasRenderer';
import { convergeSize } from '../axes/layout';
import { createAxisState, parseFontSizePx } from '../axes/ticks';
import { drawAxesGrid } from '../rendering/drawAxes';
import { drawCursor } from '../rendering/drawCursor';
import { drawSelection } from '../rendering/drawSelect';
import { resolveTheme } from '../rendering/theme';
import type { ResolvedTheme } from '../rendering/theme';
import { drawPoints, shouldShowPoints } from '../rendering/drawPoints';
import { buildBandPath, drawBandPath } from '../rendering/drawBands';
import type { BandConfig } from '../types/bands';
import { Side, DirtyFlag } from '../types/common';
import type { DrawContext, DrawCallback, CursorDrawCallback } from '../types/hooks';
import { valToPos, isScaleReady } from '../core/Scale';
import type { EventCallbacks } from '../types/events';
import { withAlpha } from '../colors';

/**
 * Inject sensible defaults for missing y-scales, series, and axes.
 * Called at the top of the full redraw path so users can render charts
 * without explicitly declaring Scale/Axis/Series children.
 *
 * Each check is independent — users can provide any subset of children
 * and only the missing pieces get auto-generated.
 */
function injectDefaults(store: ChartStore): void {
  const data = store.dataStore.data;
  if (data.length === 0) return;

  // 1. Default x-scale (if none registered)
  if (!store.scaleManager.getScale('x')) {
    const cfg: ScaleConfig = { id: 'x', auto: true };
    store.scaleConfigs.push(cfg);
    store.scaleManager.addScale(cfg);
  }

  // Map unmapped data groups to the 'x' scale
  for (let i = 0; i < data.length; i++) {
    if (!store.scaleManager.getGroupXScaleKey(i)) {
      store.scaleManager.setGroupXScale(i, 'x');
    }
  }

  // 2. Ensure every y-scale referenced by a series exists
  const registeredScales = new Set(store.scaleConfigs.map(s => s.id));
  const referencedYScales = new Set<string>();
  for (const s of store.seriesConfigs) {
    referencedYScales.add(s.yScale);
  }
  // If no series registered yet, ensure at least a default 'y' scale
  if (referencedYScales.size === 0 && !registeredScales.has('y')) {
    referencedYScales.add('y');
  }
  for (const yId of referencedYScales) {
    if (!registeredScales.has(yId)) {
      const cfg: ScaleConfig = { id: yId, auto: true };
      store.scaleConfigs.push(cfg);
      store.scaleManager.addScale(cfg);
      registeredScales.add(yId);
    }
  }

  // 3. Default x-axis (if no x-axis registered)
  const hasXAxis = store.axisConfigs.some(a => a.scale === 'x');
  if (!hasXAxis) {
    store.axisConfigs.push({
      scale: 'x', side: Side.Bottom, show: true,
      label: store.xlabel ?? 'X Axis',
      _default: true,
    });
  } else {
    // Update label on existing default x-axis
    const defXAxis = store.axisConfigs.find(a => a.scale === 'x' && a._default === true);
    if (defXAxis != null) {
      defXAxis.label = store.xlabel ?? 'X Axis';
    }
  }

  // 4. Ensure every y-scale has at least one axis
  const axisScales = new Set(store.axisConfigs.map(a => a.scale));
  for (const yId of referencedYScales) {
    if (!axisScales.has(yId)) {
      store.axisConfigs.push({
        scale: yId, side: Side.Left, show: true,
        label: store.ylabel ?? 'Y Axis',
        _default: true,
      });
      axisScales.add(yId);
    } else {
      // Update label on existing default y-axis
      const defYAxis = store.axisConfigs.find(a => a.scale === yId && a._default === true);
      if (defYAxis != null) {
        defYAxis.label = store.ylabel ?? 'Y Axis';
      }
    }
  }
}

/** Build a DrawContext with valToX/valToY helpers bound to current scales. */
function buildDrawContext(
  ctx: CanvasRenderingContext2D,
  plotBox: BBox,
  pxRatio: number,
  getScale: (id: string) => ReturnType<ScaleManager['getScale']>,
): DrawContext {
  const valToX = (val: number, scaleId = 'x'): number | null => {
    const s = getScale(scaleId);
    if (s == null || !isScaleReady(s)) return null;
    return valToPos(val, s, plotBox.width, plotBox.left);
  };
  const valToY = (val: number, scaleId: string): number | null => {
    const s = getScale(scaleId);
    if (s == null || !isScaleReady(s)) return null;
    return valToPos(val, s, plotBox.height, plotBox.top);
  };
  return { ctx, plotBox, pxRatio, getScale, valToX, valToY };
}

/**
 * Immutable snapshot of the chart state fields that UI subscribers need.
 * Rebuilt by the store before notifying listeners; the reference only
 * changes when at least one field differs from the previous snapshot.
 */
export interface ChartSnapshot {
  // Cursor
  left: number;
  top: number;
  activeGroup: number;
  activeSeriesIdx: number;
  activeDataIdx: number;
  // Layout
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
  // Metadata
  seriesCount: number;
  revision: number;
}

const EMPTY_SNAPSHOT: ChartSnapshot = {
  left: -10, top: -10, activeGroup: -1, activeSeriesIdx: -1, activeDataIdx: -1,
  plotLeft: 0, plotTop: 0, plotWidth: 0, plotHeight: 0,
  seriesCount: 0, revision: -1,
};

/** Rebuild store.snapshot if any tracked field changed. */
export function rebuildSnapshot(store: ChartStore): void {
  const { left, top, activeGroup, activeSeriesIdx, activeDataIdx } = store.cursorManager.state;
  const { left: plotLeft, top: plotTop, width: plotWidth, height: plotHeight } = store.plotBox;
  const seriesCount = store.seriesConfigs.length;
  const { revision } = store;
  const prev = store.snapshot;
  if (
    prev.left === left && prev.top === top &&
    prev.activeGroup === activeGroup && prev.activeSeriesIdx === activeSeriesIdx &&
    prev.activeDataIdx === activeDataIdx &&
    prev.plotLeft === plotLeft && prev.plotTop === plotTop &&
    prev.plotWidth === plotWidth && prev.plotHeight === plotHeight &&
    prev.seriesCount === seriesCount && prev.revision === revision
  ) return;
  store.snapshot = {
    left, top, activeGroup, activeSeriesIdx, activeDataIdx,
    plotLeft, plotTop, plotWidth, plotHeight,
    seriesCount, revision,
  };
}

/**
 * Mutable chart store — holds all chart state outside of React state.
 * Canvas operations subscribe to this store and are triggered imperatively,
 * not through React re-renders.
 */
export interface ChartStore {
  // Core managers
  scaleManager: ScaleManager;
  dataStore: DataStore;
  renderer: CanvasRenderer;
  cursorManager: CursorManager;

  // Interaction state
  selectState: SelectState;

  // Registered configs (mutated by renderless child components)
  scaleConfigs: ScaleConfig[];
  seriesConfigs: ResolvedSeriesConfig[];
  axisConfigs: AxisConfig[];
  bandConfigs: BandConfig[];

  // Runtime axis states (rebuilt from axisConfigs)
  axisStates: AxisState[];

  // Layout
  width: number;
  height: number;
  pxRatio: number;
  plotBox: BBox;

  // Canvas ref
  canvas: HTMLCanvasElement | null;

  // Subscribers (for useSyncExternalStore — Legend, Tooltip, etc.)
  listeners: Set<() => void>;
  /** Cursor-only subscribers — fired on cursor redraws without full redraw overhead */
  cursorListeners: Set<() => void>;

  // Render scheduler with dirty flags
  scheduler: RenderScheduler;

  // Draw callbacks (registered via useDrawHook / useCursorDrawHook / Chart props)
  drawHooks: Set<DrawCallback>;
  unclippedDrawHooks: Set<DrawCallback>;
  cursorDrawHooks: Set<CursorDrawCallback>;

  // Focus mode: index of focused series, or null for none
  focusedSeries: number | null;
  /** Alpha for non-focused series (0-1, default 1 = disabled) */
  focusAlpha: number;
  /** Action map: maps user gestures to chart reactions */
  actionMap: Map<ActionKey, ReactionValue>;
  /** Chart title drawn on canvas */
  title: string | undefined;
  /** X-axis label for default axis */
  xlabel: string | undefined;
  /** Y-axis label for default axis */
  ylabel: string | undefined;
  /** BCP 47 locale for number/date formatting */
  locale: string | undefined;
  /** IANA timezone for time axis labels */
  timezone: string | undefined;

  // Immutable snapshot for UI subscribers (rebuilt before notifications)
  snapshot: ChartSnapshot;

  // Revision counter — incremented on visibility toggles to trigger subscriber re-renders
  revision: number;

  // Event callbacks (synced from Chart props via refs)
  eventCallbacks: EventCallbacks;

  // Cached CSS theme vars (populated during full redraws, reused on cursor fast path)
  theme: ResolvedTheme;

  // Previous scale ranges for change detection
  _prevScaleRanges: Map<string, { min: number; max: number }>;
  // Previous plotBox for cache invalidation when layout changes
  _prevPlotBox: BBox | null;

  // Methods
  registerScale: (cfg: ScaleConfig) => void;
  unregisterScale: (id: string) => void;
  registerSeries: (cfg: ResolvedSeriesConfig) => void;
  unregisterSeries: (group: number, index: number) => void;
  toggleSeries: (group: number, index: number) => void;
  setFocus: (seriesIdx: number | null) => void;
  setSize: (w: number, h: number, dpr?: number) => void;
  scheduleRedraw: () => void;
  scheduleCursorRedraw: () => void;
  subscribe: (fn: () => void) => () => void;
  subscribeCursor: (fn: () => void) => () => void;
  /** Pre-built lookup map for series config by "group:index" key */
  seriesConfigMap: Map<string, ResolvedSeriesConfig>;
  redraw: () => void;
  /** Stable snapshot getter for useSyncExternalStore (no useCallback needed) */
  getSnapshot: () => ChartSnapshot;
  /** Synchronous redraw — cancels pending RAF, draws immediately */
  redrawSync: () => void;

  // --- Config facade methods ---
  /** Update a scale config in-place (replaces scaleConfigs entry + syncs manager + clears cache) */
  updateScale: (cfg: ScaleConfig) => void;
  /** Update a series config in-place (replaces seriesConfigs entry + rebuilds map + invalidates render) */
  updateSeries: (cfg: ResolvedSeriesConfig) => void;
  /** Register an axis config (deduplicates by scale+side) */
  registerAxis: (cfg: AxisConfig) => void;
  /** Unregister an axis config by scale+side */
  unregisterAxis: (scale: string, side: Side) => void;
  /** Update an axis config in-place */
  updateAxis: (cfg: AxisConfig) => void;
  /** Register a band config */
  registerBand: (cfg: BandConfig) => void;
  /** Unregister a band config by reference identity */
  unregisterBand: (cfg: BandConfig) => void;
  /** Set chart data (syncs DataStore + clears render cache) */
  setData: (data: ChartData) => void;
  /** Set the canvas element */
  setCanvas: (node: HTMLCanvasElement | null) => void;
  /** Set title, axis labels, locale, and timezone */
  setLabels: (title?: string, xlabel?: string, ylabel?: string, locale?: string, timezone?: string) => void;
}

/** Rebuild the series config lookup map from the current seriesConfigs array. */
function rebuildSeriesConfigMap(store: ChartStore): void {
  store.seriesConfigMap.clear();
  for (const cfg of store.seriesConfigs) {
    store.seriesConfigMap.set(`${cfg.group}:${cfg.index}`, cfg);
  }
}

/**
 * Creates a mutable ChartStore. Called once per Chart component instance.
 * This is NOT React state — it's a plain mutable object to avoid re-renders.
 */
export function createChartStore(): ChartStore {
  const store: ChartStore = {
    scaleManager: new ScaleManager(),
    dataStore: new DataStore(),
    renderer: new CanvasRenderer(),
    cursorManager: new CursorManager(),

    selectState: { show: false, left: 0, top: 0, width: 0, height: 0 },

    scaleConfigs: [],
    seriesConfigs: [],
    axisConfigs: [],
    bandConfigs: [],
    axisStates: [],

    width: 0,
    height: 0,
    pxRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    plotBox: { left: 0, top: 0, width: 0, height: 0 },

    canvas: null,
    listeners: new Set(),
    cursorListeners: new Set(),
    scheduler: new RenderScheduler(),
    drawHooks: new Set(),
    unclippedDrawHooks: new Set(),
    cursorDrawHooks: new Set(),
    focusedSeries: null,
    focusAlpha: 1,
    actionMap: new Map(DEFAULT_ACTIONS),
    title: undefined,
    xlabel: undefined,
    ylabel: undefined,
    locale: undefined,
    timezone: undefined,
    snapshot: EMPTY_SNAPSHOT,
    revision: 0,
    eventCallbacks: {},
    theme: resolveTheme(null),
    _prevScaleRanges: new Map(),
    _prevPlotBox: null,
    seriesConfigMap: new Map(),

    registerScale(cfg: ScaleConfig) {
      store.scaleConfigs = store.scaleConfigs.filter(s => s.id !== cfg.id);
      store.scaleConfigs.push(cfg);
      store.scaleManager.addScale(cfg);
    },

    unregisterScale(id: string) {
      store.scaleConfigs = store.scaleConfigs.filter(s => s.id !== id);
      store.scaleManager.removeScale(id);
    },

    registerSeries(cfg: ResolvedSeriesConfig) {
      const existing = store.seriesConfigs.find(
        s => s.group === cfg.group && s.index === cfg.index,
      );
      // Internal helper series never overwrite explicit user series
      if (cfg._internal && existing != null && !existing._internal) return;

      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === cfg.group && s.index === cfg.index),
      );
      store.seriesConfigs.push(cfg);
      rebuildSeriesConfigMap(store);
      store.renderer.clearGroupCache(cfg.group);
    },

    unregisterSeries(group: number, index: number) {
      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === group && s.index === index),
      );
      rebuildSeriesConfigMap(store);
      store.renderer.clearGroupCache(group);
    },

    toggleSeries(group: number, index: number) {
      const cfg = store.seriesConfigMap.get(`${group}:${index}`);
      if (cfg != null) {
        cfg.show = cfg.show === false ? true : false;
        store.revision++;
        store.cursorManager.invalidateGroupedConfigs();
        store.renderer.invalidateSeries(group, index);
        store.renderer.invalidateSnapshot();
        store.scheduleRedraw();
      }
    },

    setFocus(seriesIdx: number | null) {
      store.focusedSeries = seriesIdx;
      store.scheduleRedraw();
    },

    setSize(w: number, h: number, dpr?: number) {
      const ratio = dpr ?? store.pxRatio;
      if (store.width === w && store.height === h && store.pxRatio === ratio) return;
      store.pxRatio = ratio;
      store.width = w;
      store.height = h;
      if (store.canvas) {
        store.canvas.width = w * store.pxRatio;
        store.canvas.height = h * store.pxRatio;
        store.canvas.style.width = `${w}px`;
        store.canvas.style.height = `${h}px`;
      }
      store.renderer.clearCache();
    },

    scheduleRedraw() {
      store.scheduler.mark(DirtyFlag.Full);
    },

    scheduleCursorRedraw() {
      store.scheduler.mark(DirtyFlag.Cursor);
    },

    subscribe(fn: () => void) {
      store.listeners.add(fn);
      return () => { store.listeners.delete(fn); };
    },

    subscribeCursor(fn: () => void) {
      store.cursorListeners.add(fn);
      return () => { store.cursorListeners.delete(fn); };
    },

    redraw() {
      const { scaleManager, dataStore, renderer, seriesConfigs, width, height, pxRatio, canvas, scheduler } = store;

      if (canvas == null || width === 0 || height === 0) return;

      const ctx = canvas.getContext('2d');
      if (ctx == null) return;

      renderer.setContext(ctx, pxRatio);

      const dirty = scheduler.dirty;
      const cursorOnly = (dirty & ~(DirtyFlag.Cursor | DirtyFlag.Select)) === 0;

      const getScale = (id: string) => scaleManager.getScale(id);

      // --- Fast path: cursor/select only — restore snapshot and redraw overlay ---
      if (cursorOnly && renderer.restoreSnapshot(ctx)) {
        drawCursor(
          ctx,
          store.cursorManager.state,
          store.plotBox,
          pxRatio,
          dataStore.data,
          seriesConfigs,
          getScale,
          (gi) => scaleManager.getGroupXScaleKey(gi),
          undefined,
          store.seriesConfigMap,
          store.theme,
        );
        drawSelection(ctx, store.selectState, store.plotBox, pxRatio, undefined, store.theme);
        // Fire cursor draw hooks on the overlay (pxRatio-scaled)
        if (store.cursorDrawHooks.size > 0) {
          ctx.save();
          ctx.scale(pxRatio, pxRatio);
          const dc = buildDrawContext(ctx, store.plotBox, pxRatio, getScale);
          for (const fn of store.cursorDrawHooks) {
            try { fn(dc, store.cursorManager.state); } catch (err) { console.warn('[uPlot+] draw hook error:', err); }
          }
          ctx.restore();
        }
        rebuildSnapshot(store);
        for (const fn of store.cursorListeners) fn();
        return;
      }

      // --- Full redraw path ---

      // Refresh cached CSS theme vars (one getComputedStyle call per full redraw)
      store.theme = resolveTheme(canvas);

      // Re-apply palette colors for series with auto-assigned strokes
      const palette = store.theme.seriesColors;
      for (let i = 0; i < seriesConfigs.length; i++) {
        const cfg = seriesConfigs[i];
        if (cfg == null || !cfg._autoStroke) continue;
        const newStroke = palette[i % palette.length] ?? '#000';
        if (cfg.stroke === newStroke) continue;
        const newFill = cfg._autoFill && typeof newStroke === 'string'
          ? withAlpha(newStroke, 0.5) : cfg.fill;
        seriesConfigs[i] = { ...cfg, stroke: newStroke, fill: newFill };
      }
      rebuildSeriesConfigMap(store);

      // 0. Inject defaults for missing y-scales, series, and axes
      injectDefaults(store);

      // 1. Auto-range x-scales (cheap: reads first/last x values only)
      scaleManager.autoRangeX(dataStore.data);

      // 2. Update data windows from x-scale ranges
      dataStore.updateWindows((groupIdx) => {
        const scaleKey = scaleManager.getGroupXScaleKey(groupIdx);
        return scaleKey != null ? scaleManager.getScale(scaleKey) : undefined;
      });

      // 3. Auto-range all scales (single pass — windows already set)
      // Use visible series for ranging. If a y-scale has NO visible series
      // (e.g. Candlestick where helper series are show=false, or BoxWhisker
      // which uses internal-only series), fall back to including hidden
      // series so the scale still gets a range.
      const visible = seriesConfigs.filter(s => s.show !== false);
      const visibleScales = new Set(visible.map(s => s.yScale));
      const seriesScaleMap = seriesConfigs
        .filter(s => s.show !== false || !visibleScales.has(s.yScale))
        .map(s => ({
          group: s.group,
          index: s.index,
          yScale: s.yScale,
        }));

      scaleManager.autoRange(dataStore.data, seriesScaleMap, dataStore);

      // 4. Rebuild axis states from configs
      syncAxisStates(store);

      // 5. Convergence loop: calculate axis sizes → compute plot rect
      if (store.axisStates.length > 0) {
        const titleFontSize = parseFontSizePx(store.theme.titleFont);
        const titleHeight = store.title != null ? Math.ceil(titleFontSize * 1.5) + 4 : 0;
        store.plotBox = convergeSize(width, height, store.axisStates, getScale, titleHeight, store.theme, store.locale, store.timezone);
      } else {
        const margin = 10;
        store.plotBox = {
          left: margin,
          top: margin,
          width: width - margin * 2,
          height: height - margin * 2,
        };
      }

      // 5b. Invalidate path cache if plotBox changed (axis/title/label updates)
      const prev = store._prevPlotBox;
      const cur = store.plotBox;
      if (prev != null && (prev.left !== cur.left || prev.top !== cur.top || prev.width !== cur.width || prev.height !== cur.height)) {
        renderer.clearCache();
      }
      store._prevPlotBox = { ...cur };

      // 6. Clear canvas
      ctx.clearRect(0, 0, width * pxRatio, height * pxRatio);

      // 7. Draw grid lines (behind series)
      if (store.axisStates.length > 0) {
        drawAxesGrid(ctx, store.axisStates, getScale, store.plotBox, pxRatio, store.title, store.theme);
      }

      // 8. Draw series (clipped to plot area)
      const renderList: RenderableSeriesInfo[] = [];
      for (const cfg of seriesConfigs) {
        const xScaleKey = scaleManager.getGroupXScaleKey(cfg.group);
        const xScale = xScaleKey != null ? scaleManager.getScale(xScaleKey) : undefined;
        const yScale = scaleManager.getScale(cfg.yScale);

        if (xScale == null || yScale == null) continue;

        renderList.push({
          config: cfg,
          dataX: dataStore.getXValues(cfg.group),
          dataY: dataStore.getYValues(cfg.group, cfg.index),
          xScale,
          yScale,
          window: dataStore.getWindow(cfg.group),
        });
      }

      // Auto-invalidate path cache if scale ranges changed (zoom)
      renderer.checkScaleStamp(renderList);

      ctx.save();
      ctx.scale(pxRatio, pxRatio);
      ctx.beginPath();
      ctx.rect(store.plotBox.left, store.plotBox.top, store.plotBox.width, store.plotBox.height);
      ctx.clip();

      for (let i = 0; i < renderList.length; i++) {
        const info = renderList[i];
        if (info == null) continue;
        // Focus mode: dim non-focused series via canvas globalAlpha
        if (store.focusedSeries != null && i !== store.focusedSeries) {
          ctx.globalAlpha = store.focusAlpha;
          renderer.drawSeries(info, store.plotBox, 1);
          ctx.globalAlpha = 1;
        } else {
          renderer.drawSeries(info, store.plotBox, 1);
        }
      }

      // 8b. Draw bands (shaded area between series, inside clip)
      const seriesCfgMap = new Map<string, SeriesConfig>();
      for (const cfg of seriesConfigs) {
        seriesCfgMap.set(`${cfg.group}-${cfg.index}`, cfg);
      }

      for (const band of store.bandConfigs) {
        const xScaleKey = scaleManager.getGroupXScaleKey(band.group);
        const xScale = xScaleKey != null ? scaleManager.getScale(xScaleKey) : undefined;
        const upperCfg = seriesCfgMap.get(`${band.group}-${band.series[0]}`);
        const lowerCfg = seriesCfgMap.get(`${band.group}-${band.series[1]}`);

        if (xScale == null || upperCfg == null || lowerCfg == null) continue;

        const yScale = scaleManager.getScale(upperCfg.yScale);
        if (yScale == null) continue;

        const [i0, i1] = dataStore.getWindow(band.group);
        const upper = band.series[0];
        const lower = band.series[1];

        const bandDir = band.dir ?? 0;
        let bandPath = renderer.getCachedBandPath(band.group, upper, lower, i0, i1, bandDir);
        if (bandPath == null) {
          bandPath = buildBandPath(
            dataStore.getXValues(band.group),
            dataStore.getYValues(band.group, upper),
            dataStore.getYValues(band.group, lower),
            xScale, yScale, store.plotBox, pxRatio, i0, i1,
            band.dir,
          ) ?? undefined;
          if (bandPath != null) {
            renderer.setCachedBandPath(band.group, upper, lower, i0, i1, bandDir, bandPath);
          }
        }
        if (bandPath != null) {
          drawBandPath(ctx, band, bandPath, store.theme);
        }
      }

      // 8c. Draw data points (inside clip)
      for (const info of renderList) {
        const cfg = info.config;
        if (cfg.show === false) continue;
        const ptsCfg = cfg.points;
        const seriesWidth = cfg.width ?? 1;
        const ptDia = ptsCfg?.size ?? (3 + seriesWidth * 2);
        const ptSpace = ptsCfg?.space ?? (ptDia * 2);
        const [wi0, wi1] = info.window;

        if (shouldShowPoints(ptsCfg?.show, cfg.group, cfg.index, wi0, wi1, store.plotBox.width, ptSpace)) {
          drawPoints(
            ctx, info.dataX, info.dataY,
            info.xScale, info.yScale,
            store.plotBox, pxRatio,
            wi0, wi1,
            ptsCfg, ptDia, (typeof cfg.stroke === 'string' ? cfg.stroke : null) ?? '#000',
          );
        }
      }

      ctx.restore();

      // 9. Fire draw hooks (persistent layer, clipped to plot area + pxRatio-scaled)
      if (store.drawHooks.size > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          store.plotBox.left * pxRatio,
          store.plotBox.top * pxRatio,
          store.plotBox.width * pxRatio,
          store.plotBox.height * pxRatio,
        );
        ctx.clip();
        ctx.scale(pxRatio, pxRatio);
        const dc = buildDrawContext(ctx, store.plotBox, pxRatio, getScale);
        for (const fn of store.drawHooks) {
          try { fn(dc); } catch (err) { console.warn('[uPlot+] draw hook error:', err); }
        }
        ctx.restore();
      }
      // 9b. Fire unclipped draw hooks (persistent layer, pxRatio-scaled but not clipped)
      if (store.unclippedDrawHooks.size > 0) {
        ctx.save();
        ctx.scale(pxRatio, pxRatio);
        const dc = buildDrawContext(ctx, store.plotBox, pxRatio, getScale);
        for (const fn of store.unclippedDrawHooks) {
          try { fn(dc); } catch (err) { console.warn('[uPlot+] draw hook error:', err); }
        }
        ctx.restore();
      }
      // 10. Re-snap cursor to current data (handles zoom restore and streaming data shifts)
      if (store.cursorManager.state.left >= 0) {
        // Only save snapshot when cursor is active (skip on initial render)
        renderer.saveSnapshot(ctx, width * pxRatio, height * pxRatio);
        store.cursorManager.update(
          store.cursorManager.state.left,
          store.cursorManager.state.top,
          store.plotBox,
          dataStore.data,
          seriesConfigs,
          getScale,
          (gi) => dataStore.getWindow(gi),
          (gi) => scaleManager.getGroupXScaleKey(gi),
        );
      }

      // 11. Draw cursor crosshair + point
      drawCursor(
        ctx,
        store.cursorManager.state,
        store.plotBox,
        pxRatio,
        dataStore.data,
        seriesConfigs,
        getScale,
        (gi) => scaleManager.getGroupXScaleKey(gi),
        undefined,
        store.seriesConfigMap,
        store.theme,
      );

      // 12. Draw selection rectangle
      drawSelection(ctx, store.selectState, store.plotBox, pxRatio, undefined, store.theme);

      // 13. Fire cursor draw hooks (overlay layer, pxRatio-scaled)
      if (store.cursorDrawHooks.size > 0) {
        ctx.save();
        ctx.scale(pxRatio, pxRatio);
        const dc = buildDrawContext(ctx, store.plotBox, pxRatio, getScale);
        for (const fn of store.cursorDrawHooks) {
          try { fn(dc, store.cursorManager.state); } catch (err) { console.warn('[uPlot+] draw hook error:', err); }
        }
        ctx.restore();
      }

      // 13. Notify subscribers (Legend, Tooltip, etc.)
      rebuildSnapshot(store);
      for (const fn of store.listeners) fn();
      for (const fn of store.cursorListeners) fn();

      // 14. Fire onScaleChange for scales whose ranges changed
      if (store._prevScaleRanges.size > 0 && store.eventCallbacks.onScaleChange != null) {
        for (const scale of scaleManager.getAllScales()) {
          if (!isScaleReady(scale)) continue;
          const prev = store._prevScaleRanges.get(scale.id);
          if (prev == null || prev.min !== scale.min || prev.max !== scale.max) {
            try { store.eventCallbacks.onScaleChange(scale.id, scale.min, scale.max); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
          }
        }
      }

      // Update previous scale ranges snapshot
      store._prevScaleRanges.clear();
      for (const scale of scaleManager.getAllScales()) {
        if (isScaleReady(scale)) {
          store._prevScaleRanges.set(scale.id, { min: scale.min, max: scale.max });
        }
      }

    },

    getSnapshot: () => store.snapshot,

    // --- Config facade methods ---

    updateScale(cfg: ScaleConfig) {
      store.scaleConfigs = store.scaleConfigs.map(s => s.id === cfg.id ? cfg : s);
      store.scaleManager.addScale(cfg);
      store.renderer.clearCache();
    },

    updateSeries(cfg: ResolvedSeriesConfig) {
      store.seriesConfigs = store.seriesConfigs.map(s =>
        (s.group === cfg.group && s.index === cfg.index) ? cfg : s,
      );
      rebuildSeriesConfigMap(store);
      store.renderer.invalidateSeries(cfg.group, cfg.index);
      store.revision++;
      store.cursorManager.invalidateGroupedConfigs();
      store.renderer.invalidateSnapshot();
    },

    registerAxis(cfg: AxisConfig) {
      store.axisConfigs = store.axisConfigs.filter(a => !(a.scale === cfg.scale && a.side === cfg.side));
      store.axisConfigs.push(cfg);
    },

    unregisterAxis(scale: string, side: Side) {
      store.axisConfigs = store.axisConfigs.filter(a => !(a.scale === scale && a.side === side));
    },

    updateAxis(cfg: AxisConfig) {
      store.axisConfigs = store.axisConfigs.map(a =>
        (a.scale === cfg.scale && a.side === cfg.side) ? cfg : a,
      );
    },

    registerBand(cfg: BandConfig) {
      store.bandConfigs.push(cfg);
    },

    unregisterBand(cfg: BandConfig) {
      store.bandConfigs = store.bandConfigs.filter(b => b !== cfg);
    },

    setData(data: ChartData) {
      store.dataStore.setData(data);
      store.renderer.clearCache();
      store.revision++;
    },

    setCanvas(node: HTMLCanvasElement | null) {
      store.canvas = node;
    },

    setLabels(title?: string, xlabel?: string, ylabel?: string, locale?: string, timezone?: string) {
      store.title = title;
      store.xlabel = xlabel;
      store.ylabel = ylabel;
      store.locale = locale;
      store.timezone = timezone;
      store.scheduleRedraw();
    },

    redrawSync() {
      store.scheduler.cancel();
      store.scheduler.mark(DirtyFlag.Full);
      store.redraw();
      store.scheduler.clear();
    },
  };

  store.scheduler.onRedraw(() => store.redraw());

  return store;
}

/**
 * Sync axisStates array with current axisConfigs.
 */
function syncAxisStates(store: ChartStore): void {
  const { axisConfigs, axisStates } = store;

  const existing = new Map<string, AxisState>();
  for (const as of axisStates) {
    existing.set(`${as.config.scale}:${as.config.side}`, as);
  }

  store.axisStates = axisConfigs.map(cfg => {
    const key = `${cfg.scale}:${cfg.side}`;
    const prev = existing.get(key);
    if (prev != null) {
      prev.config = cfg;
      return prev;
    }
    return createAxisState(cfg);
  });
}

/**
 * Hook that creates and returns a stable ChartStore reference.
 */
export function useChartStore(): ChartStore {
  const storeRef = useRef<ChartStore | null>(null);
  storeRef.current ??= createChartStore();
  return storeRef.current;
}
