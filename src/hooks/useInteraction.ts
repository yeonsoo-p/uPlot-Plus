import { useEffect } from 'react';
import type { ChartStore } from './useChartStore';
import type { SelectState } from '../types/cursor';
import type { ChartEventInfo, NearestPoint, SelectEventInfo } from '../types/events';
import type { ActionContext, ActionKey, ReactionValue, DragContinuation } from '../types/interaction';
import { posToVal, valToPos, invalidateScaleCache, isScaleReady } from '../core/Scale';
import { Side, Orientation, sideOrientation, DirtyFlag } from '../types/common';
import { clamp } from '../math/utils';

/** Minimum drag distance (CSS pixels) to trigger a zoom selection */
const MIN_DRAG_PX = 5;

/** Wheel deltaY multiplier for zoom factor calculation */
const WHEEL_ZOOM_SENSITIVITY = 0.001;

/** Clamp bounds for the wheel zoom factor per event */
const WHEEL_ZOOM_MIN = 0.1;
const WHEEL_ZOOM_MAX = 10;

// ---------------------------------------------------------------------------
// Action classifiers: DOM event → action string
// ---------------------------------------------------------------------------

/**
 * Unified mouse classifier: `{mod?}{Button}{Type}`
 * e.g. leftDrag, shiftMiddleClick, altRightDblclick, ctrlLeftDrag
 */
function classifyMouse(e: MouseEvent, type: string): string {
  const mod = e.shiftKey ? 'shift' : e.altKey ? 'alt' : e.ctrlKey ? 'ctrl' : '';
  const btn = e.button === 1 ? 'Middle' : e.button === 2 ? 'Right' : 'Left';
  return mod ? `${mod}${btn}${type}` : `${btn.toLowerCase()}${type}`;
}

function classifyDrag(e: MouseEvent): string { return classifyMouse(e, 'Drag'); }
function classifyClick(e: MouseEvent): string { return classifyMouse(e, 'Click'); }
function classifyDblclick(e: MouseEvent): string { return classifyMouse(e, 'Dblclick'); }

function classifyWheel(e: WheelEvent): string {
  const mod = e.shiftKey ? 'shift' : e.altKey ? 'alt' : e.ctrlKey ? 'ctrl' : '';
  return mod ? `${mod}Wheel` : 'wheel';
}

/** Keyboard classifier: `{mod?}Key{Key}` e.g. shiftKeyX, ctrlKeyS, keyEscape */
function classifyKey(e: KeyboardEvent): string {
  const mod = e.shiftKey ? 'shift' : e.altKey ? 'alt' : e.ctrlKey ? 'ctrl' : '';
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  return mod ? `${mod}Key${key}` : `key${key}`;
}

// ---------------------------------------------------------------------------
// Action map lookup
// ---------------------------------------------------------------------------

function lookupReaction(
  map: Map<ActionKey, ReactionValue>, actionStr: string, e: Event, ctx: ActionContext,
  functionMatchers = true,
): ReactionValue | undefined {
  // Fast path: exact string key match
  const direct = map.get(actionStr);
  if (direct != null) return direct;
  // Slow path: function matchers (only when enabled)
  if (functionMatchers) {
    for (const [key, value] of map) {
      if (typeof key === 'function' && key(e, ctx)) return value;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Built-in reaction implementations
// ---------------------------------------------------------------------------

type ReactionFn = (store: ChartStore, e: Event, ctx: ActionContext) => DragContinuation | void;

/** Capture current scale states for pan initialization. */
function captureScales(
  store: ChartStore,
  filter?: (ori: Orientation) => boolean,
): Array<{ id: string; ori: Orientation; startMin: number; startMax: number }> {
  const result: Array<{ id: string; ori: Orientation; startMin: number; startMax: number }> = [];
  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (filter != null && !filter(scale.ori)) continue;
    result.push({ id: scale.id, ori: scale.ori, startMin: scale.min, startMax: scale.max });
  }
  return result;
}

/** Fire onScaleChange for all scales that changed. */
function fireScaleChange(store: ChartStore): void {
  const cb = store.eventCallbacks.onScaleChange;
  if (cb == null) return;
  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    const prev = store._prevScaleRanges.get(scale.id);
    if (prev == null || prev.min !== scale.min || prev.max !== scale.max) {
      cb(scale.id, scale.min, scale.max);
    }
  }
}

/** Apply wheel zoom to scales matching the given axis filter. */
function applyWheelZoom(
  store: ChartStore, e: Event, ctx: ActionContext,
  filterOri: (ori: Orientation) => boolean,
): void {
  if (!(e instanceof WheelEvent)) return;
  const factor = clamp(1 - e.deltaY * WHEEL_ZOOM_SENSITIVITY, WHEEL_ZOOM_MIN, WHEEL_ZOOM_MAX);
  const plotBox = store.plotBox;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterOri(scale.ori)) continue;

    const isX = scale.ori === Orientation.Horizontal;
    const dim = isX ? plotBox.width : plotBox.height;
    const off = isX ? plotBox.left : plotBox.top;
    const cursorPos = isX ? ctx.cx + plotBox.left : ctx.cy + plotBox.top;
    const cursorVal = posToVal(cursorPos, scale, dim, off);

    const newMin = cursorVal - (cursorVal - scale.min) * factor;
    const newMax = cursorVal + (scale.max - cursorVal) * factor;

    scale.min = Math.min(newMin, newMax);
    scale.max = Math.max(newMin, newMax);
    scale.auto = false;
    invalidateScaleCache(scale);
  }

  store.scheduleRedraw();
  fireScaleChange(store);
}

/** Create a drag-to-zoom continuation for the given axis filter. */
function startDragZoom(
  store: ChartStore, ctx: ActionContext,
  filterOri: (ori: Orientation) => boolean,
): DragContinuation {
  const selectState: SelectState = { show: false, left: 0, top: 0, width: 0, height: 0 };
  const startX = ctx.cx;
  const startY = ctx.cy;

  return {
    onMove(_store: ChartStore, _e: Event, moveCtx: ActionContext) {
      const plotBox = store.plotBox;
      const clampedCx = clamp(moveCtx.cx, 0, plotBox.width);
      const clampedCy = clamp(moveCtx.cy, 0, plotBox.height);

      selectState.show = true;
      selectState.left = Math.min(startX, clampedCx);
      selectState.top = Math.min(startY, clampedCy);
      selectState.width = Math.abs(clampedCx - startX);
      selectState.height = Math.abs(clampedCy - startY);

      // For single-axis zoom, span the full other dimension
      if (!filterOri(Orientation.Vertical)) {
        selectState.top = 0;
        selectState.height = plotBox.height;
      }
      if (!filterOri(Orientation.Horizontal)) {
        selectState.left = 0;
        selectState.width = plotBox.width;
      }

      store.selectState = selectState;
      store.scheduler.mark(DirtyFlag.Cursor | DirtyFlag.Select);
    },
    onEnd(_store: ChartStore, _e: Event, _endCtx: ActionContext) {
      // Only check threshold on axes the user actually dragged (not the auto-spanned dimension)
      const widthOk = filterOri(Orientation.Horizontal) && selectState.width > MIN_DRAG_PX;
      const heightOk = filterOri(Orientation.Vertical) && selectState.height > MIN_DRAG_PX;
      if (widthOk || heightOk) {
        // Fire onSelect callback
        let shouldZoom = true;
        if (store.eventCallbacks.onSelect != null) {
          const selInfo = buildSelectInfo(store, selectState);
          let selResult: unknown;
          try { selResult = store.eventCallbacks.onSelect(selInfo); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
          if (selResult === false) shouldZoom = false;
        }

        if (shouldZoom) {
          applySelectionZoom(store, selectState, filterOri);
          fireScaleChange(store);
        }
      }

      // Clear selection
      selectState.show = false;
      selectState.left = 0;
      selectState.width = 0;
      store.selectState = selectState;
      store.scheduleRedraw();
    },
  };
}

/** Apply zoom from a completed selection. */
function applySelectionZoom(
  store: ChartStore, sel: SelectState,
  filterOri: (ori: Orientation) => boolean,
): void {
  const plotBox = store.plotBox;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterOri(scale.ori)) continue;

    const isX = scale.ori === Orientation.Horizontal;
    const dim = isX ? plotBox.width : plotBox.height;
    const off = isX ? plotBox.left : plotBox.top;
    const selStart = isX ? sel.left : sel.top;
    const selSize = isX ? sel.width : sel.height;
    const fracStart = selStart / dim;
    const fracEnd = (selStart + selSize) / dim;

    const newMin = posToVal(off + fracStart * dim, scale, dim, off);
    const newMax = posToVal(off + fracEnd * dim, scale, dim, off);

    scale.min = Math.min(newMin, newMax);
    scale.max = Math.max(newMin, newMax);
    scale.auto = false;
    invalidateScaleCache(scale);
  }
}

/** Create a drag-to-pan continuation for the given axis filter. */
function startDragPan(
  store: ChartStore, e: Event,
  filterOri: (ori: Orientation) => boolean,
  _ctx: ActionContext,
): DragContinuation {
  const scales = captureScales(store, filterOri);
  const startClientX = (e as MouseEvent).clientX;
  const startClientY = (e as MouseEvent).clientY;

  return {
    onMove(_store: ChartStore, moveE: Event) {
      const plotBox = store.plotBox;
      const me = moveE as MouseEvent;
      for (const s of scales) {
        const scale = store.scaleManager.getScale(s.id);
        if (scale == null) continue;
        const isHoriz = s.ori === Orientation.Horizontal;
        const dim = isHoriz ? plotBox.width : plotBox.height;
        const delta = isHoriz ? me.clientX - startClientX : me.clientY - startClientY;
        const sign = isHoriz ? -1 : 1;
        const range = s.startMax - s.startMin;
        scale.min = s.startMin + sign * (delta / dim) * range;
        scale.max = s.startMax + sign * (delta / dim) * range;
        scale.auto = false;
        invalidateScaleCache(scale);
      }
      store.renderer.clearCache();
      store.scheduleRedraw();
    },
    onEnd() {
      fireScaleChange(store);
    },
  };
}

/** Create a gutter-drag pan continuation for a single scale. */
function startGutterPan(
  store: ChartStore, e: Event, ctx: ActionContext,
): DragContinuation | undefined {
  if (ctx.scaleId == null || ctx.ori == null) return undefined;
  const scale = store.scaleManager.getScale(ctx.scaleId);
  if (scale == null || !isScaleReady(scale)) return undefined;

  const isVert = ctx.ori === Orientation.Vertical;
  const rect = (e.target as HTMLElement).closest('div')?.getBoundingClientRect();
  if (rect == null) return undefined;
  const startPos = isVert ? (e as MouseEvent).clientY - rect.top : (e as MouseEvent).clientX - rect.left;
  const startMin = scale.min;
  const startMax = scale.max;
  const scaleId = ctx.scaleId;

  return {
    onMove(_store: ChartStore, moveE: Event) {
      const plotBox = store.plotBox;
      const me = moveE as MouseEvent;
      const r = (me.target as HTMLElement).closest('div')?.getBoundingClientRect();
      if (r == null) return;
      const dim = isVert ? plotBox.height : plotBox.width;
      const pos = isVert ? me.clientY - r.top : me.clientX - r.left;
      const deltaFrac = (pos - startPos) / dim;
      const sign = isVert ? 1 : -1;
      const range = startMax - startMin;

      const s = store.scaleManager.getScale(scaleId);
      if (s != null) {
        s.min = startMin + sign * deltaFrac * range;
        s.max = startMax + sign * deltaFrac * range;
        s.auto = false;
        invalidateScaleCache(s);
        store.renderer.clearCache();
        store.scheduleRedraw();
      }
    },
    onEnd() {
      fireScaleChange(store);
    },
  };
}

/** Apply wheel-based pan offset. */
function applyWheelPan(
  store: ChartStore, e: Event,
  filterOri: (ori: Orientation) => boolean,
): void {
  if (!(e instanceof WheelEvent)) return;
  const panFrac = e.deltaY * WHEEL_ZOOM_SENSITIVITY * 10;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterOri(scale.ori)) continue;

    const range = scale.max - scale.min;
    scale.min += panFrac * range;
    scale.max += panFrac * range;
    scale.auto = false;
    invalidateScaleCache(scale);
  }

  store.renderer.clearCache();
  store.scheduleRedraw();
  fireScaleChange(store);
}

const isHoriz = (ori: Orientation): boolean => ori === Orientation.Horizontal;
const isVert = (ori: Orientation): boolean => ori === Orientation.Vertical;
const isAny = (): boolean => true;

/** Registry of built-in string reactions → handler functions. */
function getBuiltinReaction(name: string): ReactionFn | undefined {
  switch (name) {
    case 'zoomX': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isHoriz); return; }
      return startDragZoom(store, ctx, isHoriz);
    };
    case 'zoomY': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isVert); return; }
      return startDragZoom(store, ctx, isVert);
    };
    case 'zoomXY': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isAny); return; }
      return startDragZoom(store, ctx, isAny);
    };
    case 'panX': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelPan(store, e, isHoriz); return; }
      if (ctx.scaleId != null) return startGutterPan(store, e, ctx);
      return startDragPan(store, e, isHoriz, ctx);
    };
    case 'panY': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelPan(store, e, isVert); return; }
      if (ctx.scaleId != null) return startGutterPan(store, e, ctx);
      return startDragPan(store, e, isVert, ctx);
    };
    case 'panXY': return (store, e, ctx) => {
      if (e instanceof WheelEvent) { applyWheelPan(store, e, isAny); return; }
      return startDragPan(store, e, isAny, ctx);
    };
    case 'reset': return (store) => {
      for (const cfg of store.scaleConfigs) {
        store.scaleManager.addScale(cfg);
      }
      store.renderer.clearCache();
      store.scheduleRedraw();
    };
    case 'none': return () => {};
    default: return undefined;
  }
}

/** Resolve a ReactionValue to an executable function. */
function resolveReaction(reaction: ReactionValue): ReactionFn | undefined {
  if (typeof reaction === 'function') return reaction as ReactionFn;
  return getBuiltinReaction(reaction);
}

// ---------------------------------------------------------------------------
// Helper: build event info
// ---------------------------------------------------------------------------

function buildSelectInfo(store: ChartStore, sel: SelectState): SelectEventInfo {
  const plotBox = store.plotBox;
  const fracLeft = sel.left / plotBox.width;
  const fracRight = (sel.left + sel.width) / plotBox.width;

  const ranges: Record<string, { min: number; max: number }> = {};
  for (const scale of store.scaleManager.getAllScales()) {
    if (scale.ori !== Orientation.Horizontal) continue;
    if (!isScaleReady(scale)) continue;

    const minVal = posToVal(plotBox.left + fracLeft * plotBox.width, scale, plotBox.width, plotBox.left);
    const maxVal = posToVal(plotBox.left + fracRight * plotBox.width, scale, plotBox.width, plotBox.left);

    ranges[scale.id] = { min: Math.min(minVal, maxVal), max: Math.max(minVal, maxVal) };
  }

  return { left: fracLeft, right: fracRight, ranges };
}

// ---------------------------------------------------------------------------
// Hook and setup
// ---------------------------------------------------------------------------

interface CoordSource {
  clientX: number;
  clientY: number;
}

/**
 * Hook that attaches mouse/touch listeners to the chart container
 * for cursor tracking and action-map-driven interactions.
 */
export function useInteraction(
  store: ChartStore,
  containerEl: HTMLDivElement | null,
): void {
  useEffect(() => {
    if (containerEl == null) return;
    return setupInteraction(store, containerEl);
  }, [store, containerEl]);
}

/**
 * Attach mouse/touch listeners to a container element for chart interactions.
 * Returns a cleanup function that removes all listeners.
 * Extracted from useInteraction for testability.
 */
export function setupInteraction(store: ChartStore, el: HTMLElement): () => void {

    // Single active drag continuation (replaces dragStart, gutterDrag, panState)
    let activeDrag: DragContinuation | null = null;
    let didDrag = false;
    let pinchState: { dist: number; midX: number; midY: number } | null = null;
    // Track last cursor position to skip hover dispatch when stationary
    let lastCursorCx = -1;
    let lastCursorCy = -1;

    function getPlotCoords(e: CoordSource): { cx: number; cy: number } {
      const rect = el.getBoundingClientRect();
      const plotBox = store.plotBox;
      return {
        cx: e.clientX - rect.left - plotBox.left,
        cy: e.clientY - rect.top - plotBox.top,
      };
    }

    function isInPlot(cx: number, cy: number): boolean {
      const plotBox = store.plotBox;
      return cx >= 0 && cx <= plotBox.width && cy >= 0 && cy <= plotBox.height;
    }

    function hitTestAxis(clientX: number, clientY: number): { scaleId: string; ori: Orientation } | null {
      const rect = el.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const plotBox = store.plotBox;

      for (const axState of store.axisStates) {
        const cfg = axState.config;
        const side = cfg.side;
        const size = axState._size;
        if (size <= 0) continue;

        const inVertRange = localY >= plotBox.top && localY <= plotBox.top + plotBox.height;
        const inHorizRange = localX >= plotBox.left && localX <= plotBox.left + plotBox.width;
        const inAxis =
          (side === Side.Left && localX < plotBox.left && inVertRange) ||
          (side === Side.Right && localX > plotBox.left + plotBox.width && inVertRange) ||
          (side === Side.Top && localY < plotBox.top && inHorizRange) ||
          (side === Side.Bottom && localY > plotBox.top + plotBox.height && inHorizRange);

        if (inAxis) {
          return { scaleId: cfg.scale, ori: sideOrientation(side) };
        }
      }
      return null;
    }

    function buildContext(e: CoordSource): ActionContext {
      const { cx, cy } = getPlotCoords(e);
      return { cx, cy, inPlot: isInPlot(cx, cy) };
    }

    /** Build a ChartEventInfo from the current cursor state and a DOM event. */
    function buildEventInfo(e: MouseEvent | TouchEvent, cx: number, cy: number): ChartEventInfo {
      const cursor = store.cursorManager.state;
      let point: NearestPoint | null = null;

      if (cursor.activeGroup >= 0 && cursor.activeDataIdx >= 0) {
        const group = store.dataStore.data[cursor.activeGroup];
        if (group != null) {
          const xVal = group.x[cursor.activeDataIdx];
          const yData = group.series[cursor.activeSeriesIdx];
          const yVal = yData != null ? yData[cursor.activeDataIdx] : undefined;

          if (xVal != null && yVal != null) {
            const plotBox = store.plotBox;
            const xScaleKey = store.scaleManager.getGroupXScaleKey(cursor.activeGroup);
            const xScale = xScaleKey != null ? store.scaleManager.getScale(xScaleKey) : undefined;
            const seriesCfg = store.seriesConfigMap.get(`${cursor.activeGroup}:${cursor.activeSeriesIdx}`);
            const yScale = seriesCfg != null ? store.scaleManager.getScale(seriesCfg.yScale) : undefined;

            let pxX = cx;
            let pxY = cy;
            if (xScale != null && isScaleReady(xScale)) {
              pxX = valToPos(xVal, xScale, plotBox.width, plotBox.left) - plotBox.left;
            }
            if (yScale != null && isScaleReady(yScale)) {
              pxY = valToPos(yVal, yScale, plotBox.height, plotBox.top) - plotBox.top;
            }

            const dx = cx - pxX;
            const dy = cy - pxY;

            point = {
              group: cursor.activeGroup,
              seriesIdx: cursor.activeSeriesIdx,
              dataIdx: cursor.activeDataIdx,
              xVal,
              yVal,
              pxX,
              pxY,
              dist: Math.sqrt(dx * dx + dy * dy),
            };
          }
        }
      }

      return { plotX: cx, plotY: cy, point, srcEvent: e };
    }

    /** Dispatch an action through the action map. Returns the reaction function if found.
     *  @param functionMatchers - whether to check function matchers (false for mousedown, true for click/dblclick/wheel)
     */
    function dispatch(actionStr: string, e: Event, ctx: ActionContext, functionMatchers = true): ReactionFn | undefined {
      const reaction = lookupReaction(store.actionMap, actionStr, e, ctx, functionMatchers);
      if (reaction == null || reaction === 'none') return undefined;
      return resolveReaction(reaction);
    }

    // -----------------------------------------------------------------------
    // Cursor tracking (always-on, not in action map)
    // -----------------------------------------------------------------------

    function updateCursor(e: CoordSource, domEvent?: MouseEvent | TouchEvent): void {
      const { cx, cy } = getPlotCoords(e);

      if (!isInPlot(cx, cy) && activeDrag == null) {
        lastCursorCx = -1;
        lastCursorCy = -1;
        store.cursorManager.hide();
        if (store.focusedSeries != null) {
          store.setFocus(null);
        }
        store.scheduleCursorRedraw();
        return;
      }

      const moved = cx !== lastCursorCx || cy !== lastCursorCy;
      lastCursorCx = cx;
      lastCursorCy = cy;

      store.cursorManager.update(
        cx, cy, store.plotBox, store.dataStore.data, store.seriesConfigs,
        (id) => store.scaleManager.getScale(id),
        (gi) => store.dataStore.getWindow(gi),
        (gi) => store.scaleManager.getGroupXScaleKey(gi),
      );

      // Hover action dispatch — only when cursor actually moved
      if (moved) {
        const hoverCtx: ActionContext = { cx, cy, inPlot: isInPlot(cx, cy) };
        // Direct string lookup only — don't run function matchers for hover
        const hoverReaction = store.actionMap.get('hover');
        if (hoverReaction != null && hoverReaction !== 'none') {
          const hoverFn = resolveReaction(hoverReaction);
          if (hoverFn != null) hoverFn(store, domEvent ?? (e as unknown as Event), hoverCtx);

          // Built-in focus behavior: auto-switch focused series
          if (store.focusAlpha < 1) {
            const cursor = store.cursorManager.state;
            if (cursor.activeGroup >= 0 && cursor.activeSeriesIdx >= 0) {
              const idx = store.seriesConfigs.findIndex(
                s => s.group === cursor.activeGroup && s.index === cursor.activeSeriesIdx,
              );
              if (idx >= 0 && store.focusedSeries !== idx) {
                store.focusedSeries = idx;
                store.scheduleRedraw();
              }
            }
          }
        }
      }

      // Fire onCursorMove callback
      if (domEvent != null && store.eventCallbacks.onCursorMove != null && isInPlot(cx, cy)) {
        try { store.eventCallbacks.onCursorMove(buildEventInfo(domEvent, cx, cy)); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
      }

      store.scheduleCursorRedraw();
    }

    // -----------------------------------------------------------------------
    // DOM event handlers
    // -----------------------------------------------------------------------

    function onMouseEnter(): void {
      if (document.activeElement !== el) el.focus();
    }

    function onMouseDown(e: MouseEvent): void {
      const ctx = buildContext(e);

      // Gutter hit overrides plot-area classification
      const axisHit = hitTestAxis(e.clientX, e.clientY);
      let actionStr: string;
      if (axisHit != null && e.button === 0) {
        actionStr = axisHit.ori === Orientation.Horizontal ? 'xGutterDrag' : 'yGutterDrag';
        ctx.scaleId = axisHit.scaleId;
        ctx.ori = axisHit.ori;
      } else {
        actionStr = classifyDrag(e);
        if (!ctx.inPlot) return;
      }

      ctx.action = actionStr;
      const fn = dispatch(actionStr, e, ctx, false);  // string keys only — mousedown is for drags
      if (fn == null) return;

      // Prevent default for non-left-button or gutter drags (but not left-click — would suppress click event)
      if (e.button !== 0 || axisHit != null) e.preventDefault();
      const cont = fn(store, e, ctx);
      if (cont != null) {
        activeDrag = cont;
        didDrag = false;
      }
    }

    function onMouseMove(e: MouseEvent): void {
      if (activeDrag != null) {
        didDrag = true;
        activeDrag.onMove(store, e, buildContext(e));
        // Still update cursor during drag for selection feedback
        updateCursor(e, e);
        return;
      }
      updateCursor(e, e);
    }

    function onMouseUp(e: MouseEvent): void {
      if (activeDrag != null) {
        activeDrag.onEnd(store, e, buildContext(e));
        activeDrag = null;
        return;
      }
    }

    function onClick(e: MouseEvent): void {
      if (didDrag) {
        didDrag = false;
        return;
      }

      const ctx = buildContext(e);
      if (!ctx.inPlot) return;

      // Dispatch through action map (function matchers enabled for click)
      const actionStr = classifyClick(e);
      ctx.action = actionStr;
      const fn = dispatch(actionStr, e, ctx);
      if (fn != null) fn(store, e, ctx);

      // Fire onClick callback (separate from action map — for UI state)
      const cb = store.eventCallbacks.onClick;
      if (cb != null) {
        try { cb(buildEventInfo(e, ctx.cx, ctx.cy)); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
      }
    }

    function onContextMenu(e: MouseEvent): void {
      if (activeDrag != null) {
        e.preventDefault();
        return;
      }

      const ctx = buildContext(e);
      if (!ctx.inPlot) return;
      e.preventDefault();

      // Dispatch 'rightClick' through action map (click event doesn't fire for button 2)
      ctx.action = 'rightClick';
      const fn = dispatch('rightClick', e, ctx);
      if (fn != null) fn(store, e, ctx);

      // Fire onContextMenu callback (separate from action map)
      const cb = store.eventCallbacks.onContextMenu;
      if (cb != null) {
        try { cb(buildEventInfo(e, ctx.cx, ctx.cy)); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
      }
    }

    function onMouseLeave(_e: MouseEvent): void {
      lastCursorCx = -1;
      lastCursorCy = -1;

      store.cursorManager.hide();

      if (store.focusedSeries != null) {
        store.setFocus(null);
      }

      if (activeDrag != null) {
        activeDrag = null;
      }

      store.scheduleCursorRedraw();

      try { store.eventCallbacks.onCursorLeave?.(); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
    }

    function onDblClick(e: MouseEvent): void {
      const ctx = buildContext(e);
      if (!ctx.inPlot) return;

      // Fire onDblClick callback — return false prevents action
      if (store.eventCallbacks.onDblClick != null) {
        let dblClickResult: unknown;
        try { dblClickResult = store.eventCallbacks.onDblClick(buildEventInfo(e, ctx.cx, ctx.cy)); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
        if (dblClickResult === false) return;
      }

      const actionStr = classifyDblclick(e);
      ctx.action = actionStr;
      const fn = dispatch(actionStr, e, ctx, false);  // string keys only — dblclick preceded by 2 clicks
      if (fn != null) fn(store, e, ctx);
    }

    function onWheel(e: WheelEvent): void {
      const ctx = buildContext(e);
      if (!ctx.inPlot) return;

      const actionStr = classifyWheel(e);
      ctx.action = actionStr;
      const fn = dispatch(actionStr, e, ctx);
      if (fn == null) return;

      e.preventDefault();
      fn(store, e, ctx);
    }

    // Touch support
    function onTouchStart(e: TouchEvent): void {
      if (e.touches.length === 2) {
        const t0 = e.touches[0] as Touch;
        const t1 = e.touches[1] as Touch;
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        pinchState = {
          dist: Math.sqrt(dx * dx + dy * dy),
          midX: (t0.clientX + t1.clientX) / 2,
          midY: (t0.clientY + t1.clientY) / 2,
        };
        activeDrag = null;
        return;
      }

      const touch = e.touches[0];
      if (touch == null) return;

      const ctx = buildContext(touch);
      if (!ctx.inPlot) return;

      const fn = dispatch('touchDrag', e, ctx);
      if (fn == null) return;

      const cont = fn(store, e, ctx);
      if (cont != null) {
        activeDrag = cont;
        didDrag = false;
      }
    }

    function onTouchMove(e: TouchEvent): void {
      // Pinch zoom
      if (e.touches.length === 2 && pinchState != null) {
        e.preventDefault();
        const t0 = e.touches[0] as Touch;
        const t1 = e.touches[1] as Touch;
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);

        const midCtx = buildContext({ clientX: pinchState.midX, clientY: pinchState.midY });
        const fn = dispatch('pinch', e, midCtx);
        if (fn != null) {
          // Apply pinch as a zoom factor
          const factor = newDist / pinchState.dist;
          const plotBox = store.plotBox;

          for (const scale of store.scaleManager.getAllScales()) {
            if (scale.ori !== Orientation.Horizontal) continue;
            if (!isScaleReady(scale)) continue;

            const cursorVal = posToVal(midCtx.cx + plotBox.left, scale, plotBox.width, plotBox.left);
            const newMin = cursorVal - (cursorVal - scale.min) / factor;
            const newMax = cursorVal + (scale.max - cursorVal) / factor;

            scale.min = Math.min(newMin, newMax);
            scale.max = Math.max(newMin, newMax);
            scale.auto = false;
            invalidateScaleCache(scale);
          }

          pinchState.dist = newDist;
          store.renderer.clearCache();
          store.scheduleRedraw();
          fireScaleChange(store);
        }
        return;
      }

      const touch = e.touches[0];
      if (touch == null) return;

      if (activeDrag != null) {
        didDrag = true;
        activeDrag.onMove(store, e, buildContext(touch));
        updateCursor(touch, e);
        e.preventDefault();
        return;
      }

      updateCursor(touch, e);
    }

    function onTouchEnd(e: TouchEvent): void {
      if (pinchState != null) {
        pinchState = null;
        return;
      }

      const touch = e.changedTouches[0];
      if (touch == null) return;

      if (activeDrag != null) {
        activeDrag.onEnd(store, e, buildContext(touch));
        activeDrag = null;
      }
    }

    // Keyboard support — dispatches through action map with function matchers
    function onKeyDown(e: KeyboardEvent): void {
      // Use last known cursor position for context
      const ctx: ActionContext = {
        cx: lastCursorCx,
        cy: lastCursorCy,
        inPlot: lastCursorCx >= 0 && lastCursorCy >= 0,
      };
      const actionStr = classifyKey(e);
      ctx.action = actionStr;
      const fn = dispatch(actionStr, e, ctx);
      if (fn != null) {
        e.preventDefault();
        fn(store, e, ctx);
      }
    }

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('click', onClick);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('dblclick', onDblClick);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('click', onClick);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('dblclick', onDblClick);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('keydown', onKeyDown);
    };
}
