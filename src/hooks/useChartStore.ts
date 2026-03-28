import { useRef } from 'react';
import type { ScaleConfig, SeriesConfig, BBox } from '../types';
import type { CursorConfig } from '../types/chart';
import type { AxisConfig, AxisState } from '../types/axes';
import type { SelectState } from '../types/cursor';
import { ScaleManager } from '../core/ScaleManager';
import { DataStore } from '../core/DataStore';
import { CursorManager } from '../core/CursorManager';
import { RenderScheduler } from '../core/RenderScheduler';
import { CanvasRenderer, type RenderableSeriesInfo } from '../rendering/CanvasRenderer';
import { convergeSize } from '../axes/layout';
import { createAxisState } from '../axes/ticks';
import { drawAxesGrid } from '../rendering/drawAxes';
import { drawCursor } from '../rendering/drawCursor';
import { drawSelection } from '../rendering/drawSelect';
import { drawPoints, shouldShowPoints } from '../rendering/drawPoints';
import { buildBandPath, drawBandPath } from '../rendering/drawBands';
import type { BandConfig } from '../types/bands';
import { Side, DirtyFlag } from '../types/common';
import type { DrawContext, DrawCallback, CursorDrawCallback } from '../types/hooks';
import { valToPos } from '../core/Scale';
import type { EventCallbacks } from '../types/events';

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
    });
  }

  // 4. Ensure every y-scale has at least one axis
  const axisScales = new Set(store.axisConfigs.map(a => a.scale));
  for (const yId of referencedYScales) {
    if (!axisScales.has(yId)) {
      store.axisConfigs.push({
        scale: yId, side: Side.Left, show: true,
        label: store.ylabel ?? 'Y Axis',
      });
      axisScales.add(yId);
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
    if (s == null || s.min == null || s.max == null) return null;
    return valToPos(val, s, plotBox.width, plotBox.left);
  };
  const valToY = (val: number, scaleId: string): number | null => {
    const s = getScale(scaleId);
    if (s == null || s.min == null || s.max == null) return null;
    return valToPos(val, s, plotBox.height, plotBox.top);
  };
  return { ctx, plotBox, pxRatio, getScale, valToX, valToY };
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
  seriesConfigs: SeriesConfig[];
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
  cursorDrawHooks: Set<CursorDrawCallback>;

  // Focus mode: index of focused series, or null for none
  focusedSeries: number | null;
  /** Alpha for non-focused series (0-1, default 0.15) */
  focusAlpha: number;
  /** Wheel zoom configuration */
  wheelZoom: CursorConfig['wheelZoom'];
  /** Chart title drawn on canvas */
  title: string | undefined;
  /** X-axis label for default axis */
  xlabel: string | undefined;
  /** Y-axis label for default axis */
  ylabel: string | undefined;

  // Revision counter — incremented on visibility toggles to trigger subscriber re-renders
  revision: number;

  // Event callbacks (synced from Chart props via refs)
  eventCallbacks: EventCallbacks;

  // Previous scale ranges for change detection
  _prevScaleRanges: Map<string, { min: number; max: number }>;

  // Methods
  registerScale: (cfg: ScaleConfig) => void;
  unregisterScale: (id: string) => void;
  registerSeries: (cfg: SeriesConfig) => void;
  unregisterSeries: (group: number, index: number) => void;
  toggleSeries: (group: number, index: number) => void;
  setFocus: (seriesIdx: number | null) => void;
  setSize: (w: number, h: number) => void;
  scheduleRedraw: () => void;
  scheduleCursorRedraw: () => void;
  subscribe: (fn: () => void) => () => void;
  subscribeCursor: (fn: () => void) => () => void;
  /** Pre-built lookup map for series config by "group:index" key */
  seriesConfigMap: Map<string, SeriesConfig>;
  redraw: () => void;
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
    cursorDrawHooks: new Set(),
    focusedSeries: null,
    focusAlpha: 0.15,
    wheelZoom: false,
    title: undefined,
    xlabel: undefined,
    ylabel: undefined,
    revision: 0,
    eventCallbacks: {},
    _prevScaleRanges: new Map(),
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

    registerSeries(cfg: SeriesConfig) {
      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === cfg.group && s.index === cfg.index),
      );
      store.seriesConfigs.push(cfg);
      rebuildSeriesConfigMap(store);
    },

    unregisterSeries(group: number, index: number) {
      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === group && s.index === index),
      );
      rebuildSeriesConfigMap(store);
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

    setSize(w: number, h: number) {
      store.width = w;
      store.height = h;
      if (store.canvas) {
        store.canvas.width = w * store.pxRatio;
        store.canvas.height = h * store.pxRatio;
        store.canvas.style.width = `${w}px`;
        store.canvas.style.height = `${h}px`;
      }
      store.renderer.clearCache();
      store.scheduleRedraw();
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
        );
        drawSelection(ctx, store.selectState, store.plotBox, pxRatio);
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
        for (const fn of store.cursorListeners) fn();
        return;
      }

      // --- Full redraw path ---

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
      const seriesScaleMap = seriesConfigs.map(s => ({
        group: s.group,
        index: s.index,
        yScale: s.yScale,
      }));

      scaleManager.autoRange(dataStore.data, seriesScaleMap, dataStore);

      // 4. Rebuild axis states from configs
      syncAxisStates(store);

      // 5. Convergence loop: calculate axis sizes → compute plot rect
      if (store.axisStates.length > 0) {
        const titleHeight = store.title != null ? 20 : 0;
        store.plotBox = convergeSize(width, height, store.axisStates, getScale, titleHeight);
      } else {
        const margin = 10;
        store.plotBox = {
          left: margin,
          top: margin,
          width: width - margin * 2,
          height: height - margin * 2,
        };
      }

      // 6. Clear canvas
      ctx.clearRect(0, 0, width * pxRatio, height * pxRatio);

      // 7. Draw grid lines (behind series)
      if (store.axisStates.length > 0) {
        drawAxesGrid(ctx, store.axisStates, getScale, store.plotBox, pxRatio, store.title);
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

        let bandPath = renderer.getCachedBandPath(band.group, upper, lower, i0, i1);
        if (bandPath == null) {
          bandPath = buildBandPath(
            dataStore.getXValues(band.group),
            dataStore.getYValues(band.group, upper),
            dataStore.getYValues(band.group, lower),
            xScale, yScale, store.plotBox, pxRatio, i0, i1,
          ) ?? undefined;
          if (bandPath != null) {
            renderer.setCachedBandPath(band.group, upper, lower, i0, i1, bandPath);
          }
        }
        if (bandPath != null) {
          drawBandPath(ctx, band, bandPath);
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
      );

      // 12. Draw selection rectangle
      drawSelection(ctx, store.selectState, store.plotBox, pxRatio);

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
      for (const fn of store.listeners) fn();
      for (const fn of store.cursorListeners) fn();

      // 14. Fire onScaleChange for scales whose ranges changed
      if (store._prevScaleRanges.size > 0 && store.eventCallbacks.onScaleChange != null) {
        for (const scale of scaleManager.getAllScales()) {
          if (scale.min == null || scale.max == null) continue;
          const prev = store._prevScaleRanges.get(scale.id);
          if (prev == null || prev.min !== scale.min || prev.max !== scale.max) {
            try { store.eventCallbacks.onScaleChange(scale.id, scale.min, scale.max); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
          }
        }
      }

      // Update previous scale ranges snapshot
      store._prevScaleRanges.clear();
      for (const scale of scaleManager.getAllScales()) {
        if (scale.min != null && scale.max != null) {
          store._prevScaleRanges.set(scale.id, { min: scale.min, max: scale.max });
        }
      }

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
  if (storeRef.current === null) {
    storeRef.current = createChartStore();
  }
  return storeRef.current;
}
