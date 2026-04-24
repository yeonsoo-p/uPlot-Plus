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
import { Side, DirtyFlag, Orientation } from '../types/common';
import type { DrawContext, DrawCallback, CursorDrawCallback } from '../types/hooks';
import { valToPx, projectPoint, isScaleReady } from '../core/Scale';
import type { EventCallbacks } from '../types/events';
import { withAlpha } from '../colors';

// ---------------------------------------------------------------------------
// Defaults: derived state computed from (data shape, explicit configs, theme,
// autoFillSeries flag). Each function is idempotent and does one thing. They
// run at the discrete events that change their inputs (setData, register/
// unregisterSeries, setAutoFillSeries, theme/label change), batched into a
// single applyDefaults() pass per affected event.
//
// Naming:
//  - ensure*  : create-if-missing only (no removal). Right for scales/axes
//               that the user can declare alongside system-created ones.
//  - bind*    : assign a relationship between two existing things.
//  - fill*    : occupy unclaimed slots; drops old fills and re-adds.
//  - recolor* : reassign a derived field on every entry that opted in.
//  - pick*    : compute a derived selection (no mutation).
// ---------------------------------------------------------------------------

/** Create the default 'x' scale if no x-scale has been registered. */
function ensureXScale(store: ChartStore): void {
  if (store.scaleManager.getScale('x')) return;
  const cfg: ScaleConfig = { id: 'x', auto: true, _default: true };
  store.scaleConfigs.push(cfg);
  store.scaleManager.addScale(cfg);
}

/** Map every data group with no x-scale binding to the 'x' scale. */
function bindGroupsToX(store: ChartStore): void {
  const data = store.dataStore.data;
  for (let i = 0; i < data.length; i++) {
    if (!store.scaleManager.getGroupXScaleKey(i)) {
      store.scaleManager.setGroupXScale(i, 'x');
    }
  }
}

/**
 * Create scales for every yScale referenced by a series.
 * If no series exist yet, ensures at least the default 'y' scale.
 * Returns the set of y-scale ids known to be referenced (used by ensureAxes).
 */
function ensureSeriesScales(store: ChartStore): Set<string> {
  const registered = new Set(store.scaleConfigs.map(s => s.id));
  const referenced = new Set<string>();
  for (const s of store.seriesConfigs) referenced.add(s.yScale);
  if (referenced.size === 0 && !registered.has('y')) referenced.add('y');
  for (const yId of referenced) {
    if (registered.has(yId)) continue;
    const cfg: ScaleConfig = { id: yId, auto: true, _default: true };
    store.scaleConfigs.push(cfg);
    store.scaleManager.addScale(cfg);
    registered.add(yId);
  }
  return referenced;
}

/**
 * Drop `_default` scales and axes that no live series references.
 * Preserves the 'x' default while data exists, since data groups bind to it.
 */
function retireUnusedDefaults(store: ChartStore): void {
  const referencedScales = new Set<string>();
  for (const s of store.seriesConfigs) referencedScales.add(s.yScale);
  if (store.dataStore.data.length > 0) referencedScales.add('x');

  const keptScales: ScaleConfig[] = [];
  for (const cfg of store.scaleConfigs) {
    if (cfg._default === true && !referencedScales.has(cfg.id)) {
      store.scaleManager.removeScale(cfg.id);
      continue;
    }
    keptScales.push(cfg);
  }
  if (keptScales.length !== store.scaleConfigs.length) store.scaleConfigs = keptScales;

  const keptAxes = store.axisConfigs.filter(
    cfg => cfg._default !== true || referencedScales.has(cfg.scale),
  );
  if (keptAxes.length !== store.axisConfigs.length) store.axisConfigs = keptAxes;
}

/**
 * Create default x-axis (if none) and a default axis for every referenced
 * y-scale that doesn't yet have one. Refreshes labels on existing default
 * axes from store.xlabel / store.ylabel each call.
 */
function ensureAxes(store: ChartStore, referencedYScales: Set<string>): void {
  const hasXAxis = store.axisConfigs.some(a => a.scale === 'x');
  if (!hasXAxis) {
    store.axisConfigs.push({
      scale: 'x', side: Side.Bottom, show: true,
      label: store.xlabel ?? 'X Axis',
      _default: true,
      _autoSide: true,
    });
  } else {
    const defXAxis = store.axisConfigs.find(a => a.scale === 'x' && a._default === true);
    if (defXAxis != null) defXAxis.label = store.xlabel ?? 'X Axis';
  }

  const axisScales = new Set(store.axisConfigs.map(a => a.scale));
  for (const yId of referencedYScales) {
    if (!axisScales.has(yId)) {
      store.axisConfigs.push({
        scale: yId, side: Side.Left, show: true,
        label: store.ylabel ?? 'Y Axis',
        _default: true,
        _autoSide: true,
      });
      axisScales.add(yId);
    } else {
      const defYAxis = store.axisConfigs.find(a => a.scale === yId && a._default === true);
      if (defYAxis != null) defYAxis.label = store.ylabel ?? 'Y Axis';
    }
  }
}

/**
 * Auto-inject series for every (group, index) data slot that no explicit
 * config has claimed.
 *
 * Idempotent: when (data, explicit configs, autoFillSeries) haven't shifted the
 * desired fill set, this returns without touching `store.seriesConfigs` — same
 * array reference, same fill objects. Existing fills' `show` toggles and
 * identity survive across redraws so downstream caches keyed on the array
 * reference (CursorManager) and on cfg identity stay valid.
 */
function fillSeries(store: ChartStore): void {
  const before = store.seriesConfigs;

  if (!store.autoFillSeries) {
    if (before.some(s => s._source === 'fill')) {
      store.seriesConfigs = before.filter(s => s._source !== 'fill');
      rebuildSeriesConfigMap(store);
    }
    return;
  }

  const data = store.dataStore.data;
  const claimed = new Set<string>();
  const existingFills = new Set<string>();
  for (const s of before) {
    const key = `${s.group}:${s.index}`;
    if (s._source === 'fill') existingFills.add(key);
    else claimed.add(key);
  }

  const wantFills = new Set<string>();
  for (let g = 0; g < data.length; g++) {
    const group = data[g];
    if (group == null) continue;
    for (let i = 0; i < group.series.length; i++) {
      const key = `${g}:${i}`;
      if (!claimed.has(key)) wantFills.add(key);
    }
  }

  // Fast path: existing fills exactly match desired set → no-op
  if (existingFills.size === wantFills.size) {
    let allMatch = true;
    for (const key of wantFills) {
      if (!existingFills.has(key)) { allMatch = false; break; }
    }
    if (allMatch) return;
  }

  // Rebuild — preserve existing fill identity for slots that should still exist
  const palette = store.theme.seriesColors;
  const next = before.filter(s => {
    if (s._source !== 'fill') return true;
    return wantFills.has(`${s.group}:${s.index}`);
  });

  for (let g = 0; g < data.length; g++) {
    const group = data[g];
    if (group == null) continue;
    for (let i = 0; i < group.series.length; i++) {
      const key = `${g}:${i}`;
      if (claimed.has(key) || existingFills.has(key)) continue;
      const colorIdx = next.length;
      next.push({
        group: g,
        index: i,
        yScale: 'y',
        show: true,
        stroke: palette[colorIdx % palette.length] ?? '#000',
        _autoStroke: true,
        _source: 'fill',
      });
    }
  }
  store.seriesConfigs = next;
  rebuildSeriesConfigMap(store);
}

/**
 * Re-apply palette colors to every series config with `_autoStroke: true`,
 * keyed by current array position. Handles theme/palette swaps. Also
 * recomputes `_autoFill` colors derived from the new stroke.
 */
function recolorSeries(store: ChartStore): void {
  const palette = store.theme.seriesColors;
  const seriesConfigs = store.seriesConfigs;
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
}

/**
 * Pick the series that should participate in y-scale auto-ranging.
 * Visible series always participate. Hidden series are included only when
 * their yScale has no visible siblings — a fallback so scales like Candlestick
 * (all helpers `show=false`) still get a range.
 */
function pickScaleParticipants(seriesConfigs: ResolvedSeriesConfig[]): Array<{ group: number; index: number; yScale: string }> {
  const visibleScales = new Set<string>();
  for (const s of seriesConfigs) if (s.show !== false) visibleScales.add(s.yScale);
  const out: Array<{ group: number; index: number; yScale: string }> = [];
  for (const s of seriesConfigs) {
    if (s.show !== false || !visibleScales.has(s.yScale)) {
      out.push({ group: s.group, index: s.index, yScale: s.yScale });
    }
  }
  return out;
}

/** Bit flags identifying which class of input changed. */
export const DirtyDefault = {
  None: 0,
  /** Data was set or its shape changed (group count or per-group series count). */
  Data: 1,
  /** Explicit series/scale/axis configs changed (mount, unmount, prop sync). */
  Config: 2,
  /** Resolved theme changed (CSS vars or ThemeProvider revision). */
  Theme: 4,
  /** autoFillSeries flag toggled. */
  Flag: 8,
  /** Run everything. */
  All: 0xff,
} as const;

/**
 * Single orchestrator for all derived defaults. Idempotent — each sub-pass
 * only touches the slice of state it owns. Callers pass the dirty bits that
 * describe what changed; sub-passes guard themselves on those bits.
 */
function applyDefaults(store: ChartStore, dirty: number): void {
  // The data-derived passes need data to exist. Until first setData, skip.
  if (store.dataStore.data.length === 0) return;

  if (dirty & (DirtyDefault.Data | DirtyDefault.Config)) {
    ensureXScale(store);
    bindGroupsToX(store);
  }

  if (dirty & (DirtyDefault.Data | DirtyDefault.Config | DirtyDefault.Flag)) {
    // fillSeries reads explicit configs to know what's claimed; runs before
    // ensureSeriesScales so its fills' yScales count as referenced.
    fillSeries(store);
  }

  if (dirty & (DirtyDefault.Data | DirtyDefault.Config | DirtyDefault.Flag)) {
    const referenced = ensureSeriesScales(store);
    ensureAxes(store, referenced);
  }

  if (dirty & (DirtyDefault.Theme | DirtyDefault.Config | DirtyDefault.Flag)) {
    recolorSeries(store);
  }
}

/**
 * Apply per-series orientation hints to scales.
 * A series with `transposed: true` (set by horizontalBars()) flips its xScale to
 * Vertical and its yScale to Horizontal. Resets each pass from scaleConfigs so
 * user-declared `<Scale ori={...} />` is preserved when no transposed series is active.
 *
 * Conflict (the same scale requested in both orientations) logs a warning and
 * keeps the first-requested orientation.
 */
function applySeriesOrientations(store: ChartStore): void {
  // Reset to user-declared (or id-default) orientation each pass.
  for (const scale of store.scaleManager.getAllScales()) {
    const cfg = store.scaleConfigs.find(s => s.id === scale.id);
    const idDefault = scale.id === 'x' ? Orientation.Horizontal : Orientation.Vertical;
    scale.ori = cfg?.ori ?? idDefault;
  }

  const requested = new Map<string, Orientation>();
  for (const cfg of store.seriesConfigs) {
    if (!cfg.transposed) continue;
    const xScaleKey = store.scaleManager.getGroupXScaleKey(cfg.group);
    if (xScaleKey == null) continue;
    requestOri(requested, xScaleKey, Orientation.Vertical);
    requestOri(requested, cfg.yScale, Orientation.Horizontal);
  }

  for (const [scaleId, ori] of requested) {
    const scale = store.scaleManager.getScale(scaleId);
    if (scale != null) scale.ori = ori;
  }

  // Warn if a flipped scale is also referenced by a non-transposed series
  // (e.g. bars() and horizontalBars() sharing the same y-scale would render incorrectly).
  for (const cfg of store.seriesConfigs) {
    if (cfg.transposed) continue;
    const xScaleKey = store.scaleManager.getGroupXScaleKey(cfg.group);
    if (xScaleKey != null && requested.has(xScaleKey)) {
      console.warn(`[uPlot+] Scale "${xScaleKey}" used by both vertical and horizontal bar series. Use separate scales for each orientation.`);
    }
    if (requested.has(cfg.yScale)) {
      console.warn(`[uPlot+] Scale "${cfg.yScale}" used by both vertical and horizontal bar series. Use separate scales for each orientation.`);
    }
  }

  // Re-derive default sides for axes that didn't have an explicit `side` prop.
  for (const axis of store.axisConfigs) {
    if (axis._autoSide !== true) continue;
    const scale = store.scaleManager.getScale(axis.scale);
    if (scale == null) continue;
    axis.side = scale.ori === Orientation.Horizontal ? Side.Bottom : Side.Left;
  }
}

function requestOri(map: Map<string, Orientation>, scaleId: string, ori: Orientation): void {
  const existing = map.get(scaleId);
  if (existing != null && existing !== ori) {
    console.warn(`[uPlot+] Scale "${scaleId}" used by both vertical and horizontal bars. Use separate scales for each orientation.`);
    return;
  }
  map.set(scaleId, ori);
}

/**
 * Fire onScaleChange for any scales whose ranges changed since the last call,
 * then update the snapshot. Used by both the redraw path and interaction
 * end-of-gesture hooks; calling more than once per change is a no-op because
 * the snapshot is updated in lockstep with the fire.
 */
export function notifyScaleChanges(store: ChartStore): void {
  const cb = store.eventCallbacks.onScaleChange;
  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    const prev = store._prevScaleRanges.get(scale.id);
    if (prev == null || prev.min !== scale.min || prev.max !== scale.max) {
      if (cb != null) {
        try { cb(scale.id, scale.min, scale.max); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
      }
      // Internal listeners (e.g. ScaleSyncGroup hooks) — fired even when no user
      // callback is set, so that scale-sync continues to work transparently.
      for (const fn of store.scaleListeners) {
        try { fn(scale.id, scale.min, scale.max); } catch (err) { console.warn('[uPlot+] scale listener error:', err); }
      }
      store._prevScaleRanges.set(scale.id, { min: scale.min, max: scale.max });
    }
  }
}

/** Build a DrawContext with valToX/valToY/project helpers bound to current scales. */
function buildDrawContext(
  ctx: CanvasRenderingContext2D,
  plotBox: BBox,
  pxRatio: number,
  getScale: (id: string) => ReturnType<ScaleManager['getScale']>,
): DrawContext {
  const valToX = (val: number, scaleId = 'x'): number | null => {
    const s = getScale(scaleId);
    if (s == null || !isScaleReady(s)) return null;
    return valToPx(val, s, plotBox);
  };
  const valToY = (val: number, scaleId: string): number | null => {
    const s = getScale(scaleId);
    if (s == null || !isScaleReady(s)) return null;
    return valToPx(val, s, plotBox);
  };
  const project = (
    xVal: number,
    yVal: number,
    xScaleId = 'x',
    yScaleId = 'y',
  ): { px: number; py: number } | null => {
    const xs = getScale(xScaleId);
    const ys = getScale(yScaleId);
    if (xs == null || ys == null || !isScaleReady(xs) || !isScaleReady(ys)) return null;
    return projectPoint(xs, ys, xVal, yVal, plotBox);
  };
  return { ctx, plotBox, pxRatio, getScale, valToX, valToY, project };
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
  /** Internal scale-change subscribers — fired by notifyScaleChanges per scale that changed.
   *  Used by sync hooks (ScaleSyncGroup) to publish range changes to peers. */
  scaleListeners: Set<(scaleId: string, min: number, max: number) => void>;

  // Render scheduler with dirty flags
  scheduler: RenderScheduler;

  // Draw callbacks (registered via useDrawHook / useCursorDrawHook / Chart props)
  drawHooks: Set<DrawCallback>;
  unclippedDrawHooks: Set<DrawCallback>;
  cursorDrawHooks: Set<CursorDrawCallback>;

  /** Focus mode: (group, index) of focused series, or null for none */
  focusedSeries: { group: number; index: number } | null;
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
  /**
   * When true (default), `fillSeries()` auto-injects a default config for every
   * data slot that no explicit `<Series>` claims. When false, only explicit
   * Series children render — chart with data but no Series shows axes only.
   */
  autoFillSeries: boolean;

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
  // Serialized theme key for detecting CSS theme changes across full redraws
  _prevThemeKey: string;

  // Methods
  registerScale: (cfg: ScaleConfig) => void;
  unregisterScale: (id: string) => void;
  registerSeries: (cfg: ResolvedSeriesConfig) => void;
  unregisterSeries: (group: number, index: number) => void;
  toggleSeries: (group: number, index: number) => void;
  /** Set the focused series by (group, index), or null to clear. */
  setFocus: (group: number | null, index?: number) => void;
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
  /** Register an axis config. Auto-side axes (`_autoSide=true`) dedupe by scale alone
   *  — at most one per scale. Explicit-side axes dedupe by (scale, side). */
  registerAxis: (cfg: AxisConfig) => void;
  /** Unregister an axis config. Matches with the same rules as `registerAxis`. */
  unregisterAxis: (cfg: AxisConfig) => void;
  /** Update an axis config in-place. Auto-side updates preserve the store-derived
   *  `side` (which may have been flipped by orientation handling). */
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
  /** Toggle the auto-fill flag and re-run defaults. */
  setAutoFillSeries: (enabled: boolean) => void;
}

/**
 * Match an existing axis config against an incoming one using the invariant:
 *  - auto-side axes dedupe by scale alone (at most one per scale)
 *  - explicit-side axes dedupe by (scale, side); explicit and auto are never merged
 */
function axisKeyMatches(a: AxisConfig, b: AxisConfig): boolean {
  if (a.scale !== b.scale) return false;
  const aAuto = a._autoSide === true;
  const bAuto = b._autoSide === true;
  if (aAuto !== bAuto) return false;
  return aAuto ? true : a.side === b.side;
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
    scaleListeners: new Set(),
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
    autoFillSeries: true,
    snapshot: EMPTY_SNAPSHOT,
    revision: 0,
    eventCallbacks: {},
    theme: resolveTheme(null),
    _prevScaleRanges: new Map(),
    _prevPlotBox: null,
    _prevThemeKey: '',
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
      // Internal helper series never overwrite explicit user series; an
      // existing _source==='fill' is always replaceable.
      if (cfg._source === 'internal' && existing != null && existing._source !== 'internal' && existing._source !== 'fill') return;

      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === cfg.group && s.index === cfg.index),
      );
      store.seriesConfigs.push(cfg);
      rebuildSeriesConfigMap(store);
      store.renderer.clearGroupCache(cfg.group);
      // Only fillSeries needs to react to a slot being claimed. Axes and
      // scales reconcile in the next redraw — running them now would race
      // with sibling <Axis>/<Scale> mounts that haven't fired yet.
      fillSeries(store);
      // Bump revision so subscribers see the slot change even when the total
      // count is unchanged (explicit replacing fill at the same slot).
      store.revision++;
    },

    unregisterSeries(group: number, index: number) {
      store.seriesConfigs = store.seriesConfigs.filter(
        s => !(s.group === group && s.index === index),
      );
      rebuildSeriesConfigMap(store);
      store.renderer.clearGroupCache(group);
      fillSeries(store);
      retireUnusedDefaults(store);
      store.revision++;
    },

    setAutoFillSeries(enabled: boolean) {
      if (store.autoFillSeries === enabled) return;
      store.autoFillSeries = enabled;
      fillSeries(store);
      store.scheduleRedraw();
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

    setFocus(group: number | null, index?: number) {
      store.focusedSeries = group == null ? null : { group, index: index ?? 0 };
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
      const { scaleManager, dataStore, renderer, width, height, pxRatio, canvas, scheduler } = store;

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
          store.seriesConfigs,
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
      const themeKey = JSON.stringify(store.theme);
      if (themeKey !== store._prevThemeKey) {
        store._prevThemeKey = themeKey;
        store.revision++;
      }

      // Run all default reconcilers — idempotent safety net for state that
      // discrete-event callers may not have flushed yet (first paint, theme
      // swap, direct dataStore mutation in tests, etc.). Each sub-pass
      // skips work cheaply when its inputs haven't changed.
      applyDefaults(store, DirtyDefault.All);

      // 0b. Apply per-series orientation hints (horizontalBars sets transposed: true)
      applySeriesOrientations(store);

      // 1. Auto-range x-scales (cheap: reads first/last x values only)
      scaleManager.autoRangeX(dataStore.data);

      // 2. Update data windows from x-scale ranges
      dataStore.updateWindows((groupIdx) => {
        const scaleKey = scaleManager.getGroupXScaleKey(groupIdx);
        return scaleKey != null ? scaleManager.getScale(scaleKey) : undefined;
      });

      // 3. Auto-range all scales (single pass — windows already set)
      // Read seriesConfigs after applyDefaults — fillSeries may have reassigned the array.
      const seriesConfigs = store.seriesConfigs;
      const seriesScaleMap = pickScaleParticipants(seriesConfigs);

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

      const focused = store.focusedSeries;
      for (let i = 0; i < renderList.length; i++) {
        const info = renderList[i];
        if (info == null) continue;
        // Focus mode: dim non-focused series via canvas globalAlpha
        const isFocused = focused != null
          && info.config.group === focused.group
          && info.config.index === focused.index;
        if (focused != null && !isFocused) {
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
            store.plotBox, 1,
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

      // 14. Fire onScaleChange for any range changes the redraw introduced
      // (interaction handlers also notify on gesture end; either side is idempotent
      // because notifyScaleChanges updates _prevScaleRanges as it fires).
      notifyScaleChanges(store);

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
      store.axisConfigs = store.axisConfigs.filter(a => !axisKeyMatches(a, cfg));
      store.axisConfigs.push(cfg);
    },

    unregisterAxis(cfg: AxisConfig) {
      store.axisConfigs = store.axisConfigs.filter(a => !axisKeyMatches(a, cfg));
    },

    updateAxis(cfg: AxisConfig) {
      store.axisConfigs = store.axisConfigs.map(a => {
        if (!axisKeyMatches(a, cfg)) return a;
        // For auto-side axes, preserve the store-derived side — it may have been
        // flipped by applySeriesOrientations based on scale orientation, and the
        // incoming cfg carries only the stale React-side default.
        return cfg._autoSide === true ? { ...cfg, side: a.side } : cfg;
      });
    },

    registerBand(cfg: BandConfig) {
      store.bandConfigs.push(cfg);
    },

    unregisterBand(cfg: BandConfig) {
      store.bandConfigs = store.bandConfigs.filter(b => b !== cfg);
    },

    setData(data: ChartData) {
      // Streaming guard: only re-run data-derived defaults when the *shape*
      // changes (group count or per-group series count). Pure value updates
      // (per-frame appends) skip the reconcile.
      const prev = store.dataStore.data;
      let sameShape = data.length === prev.length;
      if (sameShape) {
        for (let i = 0; i < data.length; i++) {
          const a = data[i];
          const b = prev[i];
          if (a == null || b == null || a.series.length !== b.series.length) {
            sameShape = false;
            break;
          }
        }
      }
      store.dataStore.setData(data);
      store.renderer.clearCache();
      store.revision++;
      if (!sameShape) {
        // Data shape changed — re-derive data-driven defaults now so any
        // bare <Series /> mounted after this resolves to the correct slot.
        // Axes/scales still defer to redraw to avoid racing with explicit
        // <Axis>/<Scale> mounts that share the same commit.
        ensureXScale(store);
        bindGroupsToX(store);
        fillSeries(store);
      }
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
      // The synchronous Full redraw handled all flags. Cancel the
      // pending RAF that mark() scheduled and clear flags.
      store.scheduler.cancel();
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
