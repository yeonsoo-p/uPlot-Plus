import { useRef } from 'react';
import type { ScaleConfig, SeriesConfig, AxisConfig, BBox } from '../types';
import type { AxisState } from '../types/axes';
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
import { drawBand } from '../rendering/drawBands';
import type { BandConfig } from '../types/bands';
import { DirtyFlag } from '../types/common';
import type { DrawContext, DrawCallback, CursorDrawCallback } from '../types/hooks';

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

  // Render scheduler with dirty flags
  scheduler: RenderScheduler;

  // Draw callbacks (registered via useDrawHook / useCursorDrawHook / Chart props)
  drawHooks: DrawCallback[];
  cursorDrawHooks: CursorDrawCallback[];

  // Focus mode: index of focused series, or null for none
  focusedSeries: number | null;

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
  redraw: () => void;
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
    scheduler: new RenderScheduler(),
    drawHooks: [],
    cursorDrawHooks: [],
    focusedSeries: null,

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
    },

    unregisterSeries(group: number, index: number) {
      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === group && s.index === index),
      );
    },

    toggleSeries(group: number, index: number) {
      const cfg = store.seriesConfigs.find(s => s.group === group && s.index === index);
      if (cfg != null) {
        cfg.show = cfg.show === false ? undefined : false;
        store.renderer.invalidateSeries(group, index);
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
        );
        drawSelection(ctx, store.selectState, store.plotBox, pxRatio);
        // Fire cursor draw hooks on the overlay
        if (store.cursorDrawHooks.length > 0) {
          const dc: DrawContext = { ctx, plotBox: store.plotBox, pxRatio };
          for (const fn of store.cursorDrawHooks) fn(dc, store.cursorManager.state);
        }
        for (const fn of store.listeners) fn();
        return;
      }

      // --- Full redraw path ---

      // 1. Auto-range scales from data (first pass)
      const seriesScaleMap = seriesConfigs.map(s => ({
        group: s.group,
        index: s.index,
        yScale: s.yScale,
      }));

      scaleManager.autoRange(dataStore.data, seriesScaleMap, dataStore);

      // 2. Update data windows from x-scale ranges
      const windowsChanged = dataStore.updateWindows((groupIdx) => {
        const scaleKey = scaleManager.getGroupXScaleKey(groupIdx);
        return scaleKey != null ? scaleManager.getScale(scaleKey) : undefined;
      });

      // 3. Re-range with windows (second pass for y-scales)
      if (windowsChanged) {
        scaleManager.autoRange(dataStore.data, seriesScaleMap, dataStore);
      }

      // 4. Rebuild axis states from configs
      syncAxisStates(store);

      // 5. Convergence loop: calculate axis sizes → compute plot rect
      if (store.axisStates.length > 0) {
        store.plotBox = convergeSize(width, height, store.axisStates, getScale);
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
        drawAxesGrid(ctx, store.axisStates, getScale, store.plotBox, pxRatio);
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
          ctx.globalAlpha = 0.15;
          renderer.drawSeries(info, store.plotBox, 1);
          ctx.globalAlpha = 1;
        } else {
          renderer.drawSeries(info, store.plotBox, 1);
        }
      }

      // 8b. Draw bands (shaded area between series, inside clip)
      for (const band of store.bandConfigs) {
        const xScaleKey = scaleManager.getGroupXScaleKey(band.group);
        const xScale = xScaleKey != null ? scaleManager.getScale(xScaleKey) : undefined;
        const upperCfg = seriesConfigs.find(s => s.group === band.group && s.index === band.series[0]);
        const lowerCfg = seriesConfigs.find(s => s.group === band.group && s.index === band.series[1]);

        if (xScale == null || upperCfg == null || lowerCfg == null) continue;

        const yScale = scaleManager.getScale(upperCfg.yScale);
        if (yScale == null) continue;

        const [i0, i1] = dataStore.getWindow(band.group);
        drawBand(
          ctx, band,
          dataStore.getXValues(band.group),
          dataStore.getYValues(band.group, band.series[0]),
          dataStore.getYValues(band.group, band.series[1]),
          xScale, yScale, store.plotBox, pxRatio, i0, i1,
        );
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
            ptsCfg, ptDia, cfg.stroke ?? '#000',
          );
        }
      }

      ctx.restore();

      // 9. Fire draw hooks (persistent layer), then save snapshot
      if (store.drawHooks.length > 0) {
        const dc: DrawContext = { ctx, plotBox: store.plotBox, pxRatio };
        for (const fn of store.drawHooks) fn(dc);
      }
      renderer.saveSnapshot(ctx, width * pxRatio, height * pxRatio);

      // 10. Draw cursor crosshair + point
      drawCursor(
        ctx,
        store.cursorManager.state,
        store.plotBox,
        pxRatio,
        dataStore.data,
        seriesConfigs,
        getScale,
        (gi) => scaleManager.getGroupXScaleKey(gi),
      );

      // 11. Draw selection rectangle
      drawSelection(ctx, store.selectState, store.plotBox, pxRatio);

      // 12. Fire cursor draw hooks (overlay layer)
      if (store.cursorDrawHooks.length > 0) {
        const dc: DrawContext = { ctx, plotBox: store.plotBox, pxRatio };
        for (const fn of store.cursorDrawHooks) fn(dc, store.cursorManager.state);
      }

      // 13. Notify subscribers (Legend, Tooltip, etc.)
      for (const fn of store.listeners) fn();
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
