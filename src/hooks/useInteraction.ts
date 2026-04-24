import { useEffect } from 'react';
import type { ChartStore } from './useChartStore';
import { notifyScaleChanges } from './useChartStore';
import type { SelectState, ScaleState } from '../types';
import type { ChartEventInfo, NearestPoint, SelectEventInfo } from '../types/events';
import type { ActionContext, ActionKey, ReactionValue, DragContinuation } from '../types/interaction';
import { posToVal, projectPoint, invalidateScaleCache, isScaleReady } from '../core/Scale';
import { Side, Orientation, sideOrientation, DirtyFlag } from '../types/common';
import { clamp } from '../math/utils';

// ---------------------------------------------------------------------------
// Axis-role filters
//
// Reactions like zoomX/panX historically meant "act on horizontal-screen scales".
// That works for normal charts where x-scale is Horizontal, but breaks for
// transposed charts (horizontal bars) where x-scale is Vertical. Reactions are
// now defined as "act on the X data axis (or Y)" — orientation-agnostic.
// ---------------------------------------------------------------------------

type ScaleFilter = (s: ScaleState) => boolean;

/** Returns predicates that classify a scale as the X data axis or Y data axis for this store. */
function buildScaleFilters(store: ChartStore): { isX: ScaleFilter; isY: ScaleFilter; isAny: ScaleFilter } {
  const xIds = new Set<string>();
  for (const id of store.scaleManager.groupXScales.values()) xIds.add(id);
  const yIds = new Set<string>();
  for (const cfg of store.seriesConfigs) yIds.add(cfg.yScale);
  return {
    isX: (s) => xIds.has(s.id),
    isY: (s) => yIds.has(s.id),
    isAny: () => true,
  };
}

/** Pick (cssCoord, dim, off) for a scale based on its current orientation. */
function axisDimsForScale(scale: ScaleState, ctx: ActionContext, plotBox: { left: number; top: number; width: number; height: number }):
  { cursorPx: number; dim: number; off: number } {
  const isHoriz = scale.ori === Orientation.Horizontal;
  return {
    cursorPx: isHoriz ? ctx.cx + plotBox.left : ctx.cy + plotBox.top,
    dim: isHoriz ? plotBox.width : plotBox.height,
    off: isHoriz ? plotBox.left  : plotBox.top,
  };
}

/** Determine which screen directions the filtered scales span. */
function selectionAxisExtents(store: ChartStore, filterScale: ScaleFilter): { spansHoriz: boolean; spansVert: boolean } {
  let spansHoriz = false;
  let spansVert = false;
  for (const s of store.scaleManager.getAllScales()) {
    if (!isScaleReady(s)) continue;
    if (!filterScale(s)) continue;
    if (s.ori === Orientation.Horizontal) spansHoriz = true;
    else spansVert = true;
  }
  return { spansHoriz, spansVert };
}

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
  filter?: ScaleFilter,
): Array<{ id: string; ori: Orientation; dir: number; startMin: number; startMax: number }> {
  const result: Array<{ id: string; ori: Orientation; dir: number; startMin: number; startMax: number }> = [];
  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (filter != null && !filter(scale)) continue;
    result.push({ id: scale.id, ori: scale.ori, dir: scale.dir, startMin: scale.min, startMax: scale.max });
  }
  return result;
}

// Fire onScaleChange + advance _prevScaleRanges via the shared store helper.
// The next redraw's notifyScaleChanges call is a no-op for the same change.
const fireScaleChange = notifyScaleChanges;

/** Apply wheel zoom to scales matching the given filter. */
function applyWheelZoom(
  store: ChartStore, e: Event, ctx: ActionContext,
  filterScale: ScaleFilter,
): void {
  if (!(e instanceof WheelEvent)) return;
  const factor = clamp(1 - e.deltaY * WHEEL_ZOOM_SENSITIVITY, WHEEL_ZOOM_MIN, WHEEL_ZOOM_MAX);
  const plotBox = store.plotBox;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterScale(scale)) continue;

    const { cursorPx, dim, off } = axisDimsForScale(scale, ctx, plotBox);
    const cursorVal = posToVal(cursorPx, scale, dim, off);

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

/** Create a drag-to-zoom continuation for the given scale filter. */
function startDragZoom(
  store: ChartStore, ctx: ActionContext,
  filterScale: ScaleFilter,
): DragContinuation {
  const selectState: SelectState = { show: false, left: 0, top: 0, width: 0, height: 0 };
  const startX = ctx.cx;
  const startY = ctx.cy;
  // Capture which screen directions the filtered scales currently span — drives selection geometry.
  const { spansHoriz, spansVert } = selectionAxisExtents(store, filterScale);

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

      // Span fully along axes that aren't being zoomed
      if (!spansVert) {
        selectState.top = 0;
        selectState.height = plotBox.height;
      }
      if (!spansHoriz) {
        selectState.left = 0;
        selectState.width = plotBox.width;
      }

      store.selectState = selectState;
      store.scheduler.mark(DirtyFlag.Cursor | DirtyFlag.Select);
    },
    onEnd(_store: ChartStore, _e: Event, _endCtx: ActionContext) {
      // Only check threshold on axes the user actually dragged (not the auto-spanned dimension)
      const widthOk = spansHoriz && selectState.width > MIN_DRAG_PX;
      const heightOk = spansVert && selectState.height > MIN_DRAG_PX;
      if (widthOk || heightOk) {
        // Narrow the filter: drop scales on an axis that didn't clear the threshold, so a
        // mostly-vertical drag under zoomXY doesn't collapse the x-range from a 2px sliver.
        const effectiveFilter: ScaleFilter = (s) => {
          if (!filterScale(s)) return false;
          return s.ori === Orientation.Horizontal ? widthOk : heightOk;
        };

        // Fire onSelect callback
        let shouldZoom = true;
        if (store.eventCallbacks.onSelect != null) {
          const selInfo = buildSelectInfo(store, selectState, effectiveFilter);
          let selResult: unknown;
          try { selResult = store.eventCallbacks.onSelect(selInfo); } catch (err) { console.warn('[uPlot+] event callback error:', err); }
          if (selResult === false) shouldZoom = false;
        }

        if (shouldZoom) {
          applySelectionZoom(store, selectState, effectiveFilter);
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
  filterScale: ScaleFilter,
): void {
  const plotBox = store.plotBox;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterScale(scale)) continue;

    const isHoriz = scale.ori === Orientation.Horizontal;
    const dim = isHoriz ? plotBox.width : plotBox.height;
    const off = isHoriz ? plotBox.left : plotBox.top;
    const selStart = isHoriz ? sel.left : sel.top;
    const selSize = isHoriz ? sel.width : sel.height;
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

/** Create a drag-to-pan continuation for the given scale filter. */
function startDragPan(
  store: ChartStore, e: Event,
  filterScale: ScaleFilter,
  _ctx: ActionContext,
): DragContinuation {
  const scales = captureScales(store, filterScale);
  if (!(e instanceof MouseEvent)) return { onMove() {}, onEnd() {} };
  const startClientX = e.clientX;
  const startClientY = e.clientY;

  return {
    onMove(_store: ChartStore, moveE: Event) {
      if (!(moveE instanceof MouseEvent)) return;
      const plotBox = store.plotBox;
      const me = moveE;
      for (const s of scales) {
        const scale = store.scaleManager.getScale(s.id);
        if (scale == null) continue;
        const isHoriz = s.ori === Orientation.Horizontal;
        const dim = isHoriz ? plotBox.width : plotBox.height;
        const delta = isHoriz ? me.clientX - startClientX : me.clientY - startClientY;
        const sign = (isHoriz ? -1 : 1) * s.dir;
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
  if (!(e.target instanceof HTMLElement)) return undefined;
  const rect = e.target.closest('div')?.getBoundingClientRect();
  if (rect == null) return undefined;
  if (!(e instanceof MouseEvent)) return undefined;
  const startPos = isVert ? e.clientY - rect.top : e.clientX - rect.left;
  const startMin = scale.min;
  const startMax = scale.max;
  const scaleId = ctx.scaleId;

  return {
    onMove(_store: ChartStore, moveE: Event) {
      if (!(moveE instanceof MouseEvent)) return;
      const plotBox = store.plotBox;
      const dim = isVert ? plotBox.height : plotBox.width;
      const pos = isVert ? moveE.clientY - rect.top : moveE.clientX - rect.left;
      const deltaFrac = (pos - startPos) / dim;
      const sign = (isVert ? 1 : -1) * scale.dir;
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
  filterScale: ScaleFilter,
): void {
  if (!(e instanceof WheelEvent)) return;
  const panFrac = e.deltaY * WHEEL_ZOOM_SENSITIVITY * 10;

  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    if (!filterScale(scale)) continue;

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

/** Registry of built-in string reactions → handler functions.
 *  zoomX/panX target the X data axis (group's xScale), zoomY/panY target the Y data axis,
 *  regardless of current screen orientation. For non-transposed charts (xScale=Horizontal,
 *  yScale=Vertical) this is identical to the prior screen-orientation semantics.
 */
function getBuiltinReaction(name: string): ReactionFn | undefined {
  switch (name) {
    case 'zoomX': return (store, e, ctx) => {
      const { isX } = buildScaleFilters(store);
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isX); return; }
      return startDragZoom(store, ctx, isX);
    };
    case 'zoomY': return (store, e, ctx) => {
      const { isY } = buildScaleFilters(store);
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isY); return; }
      return startDragZoom(store, ctx, isY);
    };
    case 'zoomXY': return (store, e, ctx) => {
      const { isAny } = buildScaleFilters(store);
      if (e instanceof WheelEvent) { applyWheelZoom(store, e, ctx, isAny); return; }
      return startDragZoom(store, ctx, isAny);
    };
    case 'panX': return (store, e, ctx) => {
      const { isX } = buildScaleFilters(store);
      if (e instanceof WheelEvent) { applyWheelPan(store, e, isX); return; }
      if (ctx.scaleId != null) return startGutterPan(store, e, ctx);
      return startDragPan(store, e, isX, ctx);
    };
    case 'panY': return (store, e, ctx) => {
      const { isY } = buildScaleFilters(store);
      if (e instanceof WheelEvent) { applyWheelPan(store, e, isY); return; }
      if (ctx.scaleId != null) return startGutterPan(store, e, ctx);
      return startDragPan(store, e, isY, ctx);
    };
    case 'panXY': return (store, e, ctx) => {
      const { isAny } = buildScaleFilters(store);
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
  if (typeof reaction === 'function') return reaction;
  return getBuiltinReaction(reaction);
}

// ---------------------------------------------------------------------------
// Helper: build event info
// ---------------------------------------------------------------------------

function buildSelectInfo(store: ChartStore, sel: SelectState, filterScale?: ScaleFilter): SelectEventInfo {
  const plotBox = store.plotBox;
  const fracLeft = sel.left / plotBox.width;
  const fracRight = (sel.left + sel.width) / plotBox.width;

  const ranges: SelectEventInfo['ranges'] = {};
  for (const scale of store.scaleManager.getAllScales()) {
    if (!isScaleReady(scale)) continue;
    // If a filter is provided (e.g. from a zoom reaction), only report on those scales.
    // Otherwise default to all scales — caller decides which ranges are meaningful.
    if (filterScale != null && !filterScale(scale)) continue;

    const isHoriz = scale.ori === Orientation.Horizontal;
    const dim = isHoriz ? plotBox.width : plotBox.height;
    const off = isHoriz ? plotBox.left  : plotBox.top;
    const selStart = isHoriz ? sel.left : sel.top;
    const selSize  = isHoriz ? sel.width : sel.height;
    const fracStart = selStart / dim;
    const fracEnd   = (selStart + selSize) / dim;

    const minVal = posToVal(off + fracStart * dim, scale, dim, off);
    const maxVal = posToVal(off + fracEnd   * dim, scale, dim, off);

    ranges[scale.id] = {
      min: Math.min(minVal, maxVal),
      max: Math.max(minVal, maxVal),
      fracStart,
      fracEnd,
    };
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

    // -----------------------------------------------------------------------
    // Document-level listeners for drag survival outside chart
    // -----------------------------------------------------------------------

    function onDocumentMouseMove(e: MouseEvent): void {
      if (activeDrag == null) { removeDocumentListeners(); return; }
      // Inside chart — element-level handler processes it
      if (e.target instanceof Node && el.contains(e.target)) return;
      didDrag = true;
      activeDrag.onMove(store, e, buildContext(e));
      updateCursor(e, e);
    }

    function onDocumentMouseUp(e: MouseEvent): void {
      removeDocumentListeners();
      if (activeDrag == null) return;
      // Inside chart — element-level onMouseUp handles it
      if (e.target instanceof Node && el.contains(e.target)) return;
      activeDrag.onEnd(store, e, buildContext(e));
      activeDrag = null;
      // Mouse is outside chart — hide cursor
      lastCursorCx = -1;
      lastCursorCy = -1;
      store.cursorManager.hide();
      if (store.focusedSeries != null) store.setFocus(null);
      store.scheduleCursorRedraw();
    }

    function attachDocumentListeners(): void {
      document.addEventListener('mousemove', onDocumentMouseMove);
      document.addEventListener('mouseup', onDocumentMouseUp);
    }

    function removeDocumentListeners(): void {
      document.removeEventListener('mousemove', onDocumentMouseMove);
      document.removeEventListener('mouseup', onDocumentMouseUp);
    }

    function onWindowBlur(): void {
      if (activeDrag != null) {
        activeDrag = null;
        removeDocumentListeners();
        store.cursorManager.hide();
        store.scheduleCursorRedraw();
      }
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
            if (xScale != null && yScale != null && isScaleReady(xScale) && isScaleReady(yScale)) {
              const pointPx = projectPoint(xScale, yScale, xVal, yVal, plotBox);
              pxX = pointPx.px - plotBox.left;
              pxY = pointPx.py - plotBox.top;
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
        el.style.cursor = '';
        store.cursorManager.hide();
        if (store.focusedSeries != null) {
          store.setFocus(null);
        }
        store.scheduleCursorRedraw();
        return;
      }

      el.style.cursor = 'none';

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
          if (hoverFn != null) {
            const hoverEvent: Event | undefined = domEvent ?? undefined;
            if (hoverEvent != null) hoverFn(store, hoverEvent, hoverCtx);
          }

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
        attachDocumentListeners();
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
      // During active drag, document-level listeners handle tracking
      if (activeDrag != null) return;

      lastCursorCx = -1;
      lastCursorCy = -1;
      el.style.cursor = '';

      store.cursorManager.hide();

      if (store.focusedSeries != null) {
        store.setFocus(null);
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
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        if (t0 == null || t1 == null) return;
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
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        if (t0 == null || t1 == null) return;
        const dx = t1.clientX - t0.clientX;
        const dy = t1.clientY - t0.clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);

        const midCtx = buildContext({ clientX: pinchState.midX, clientY: pinchState.midY });
        const factor = newDist / pinchState.dist;
        pinchState.dist = newDist;

        const reaction = store.actionMap.get('pinch');
        if (reaction == null || reaction === 'none') return;

        if (typeof reaction === 'function') {
          reaction(store, e, midCtx);
          return;
        }

        const filters = buildScaleFilters(store);
        const filterScale: ScaleFilter | null =
          reaction === 'zoomX' ? filters.isX :
          reaction === 'zoomY' ? filters.isY :
          reaction === 'zoomXY' ? filters.isAny :
          null;
        if (filterScale == null) return;

        const plotBox = store.plotBox;
        for (const scale of store.scaleManager.getAllScales()) {
          if (!isScaleReady(scale)) continue;
          if (!filterScale(scale)) continue;

          const { cursorPx, dim, off } = axisDimsForScale(scale, midCtx, plotBox);
          const cursorVal = posToVal(cursorPx, scale, dim, off);
          const newMin = cursorVal - (cursorVal - scale.min) / factor;
          const newMax = cursorVal + (scale.max - cursorVal) / factor;

          scale.min = Math.min(newMin, newMax);
          scale.max = Math.max(newMin, newMax);
          scale.auto = false;
          invalidateScaleCache(scale);
        }

        store.renderer.clearCache();
        store.scheduleRedraw();
        fireScaleChange(store);
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
    window.addEventListener('blur', onWindowBlur);

    return () => {
      removeDocumentListeners();
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
      window.removeEventListener('blur', onWindowBlur);
    };
}
