import type React from 'react';
import { useRef, useState, useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { useStore } from './useChart';
import { clamp } from '../math/utils';
import type { CornerPosition, OverlayPosition, OverlayOffset } from '../types/common';

// ---- Public types ----

export type { CornerPosition };

export interface UseDraggableOverlayOptions {
  mode: 'cursor' | 'draggable';
  show: boolean;
  position: OverlayPosition;
  offset: OverlayOffset;
  idleOpacity: number;
  estimatedSize: { w: number; h: number };
  /** Called with the new position whenever the panel is dragged. */
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export interface DraggableOverlayResult {
  panelRef: React.RefObject<HTMLDivElement>;
  /** Computed position to render at. null = not ready or hidden. */
  renderPos: { x: number; y: number } | null;
  isDragging: boolean;
  hovered: boolean;
  /** Mutable ref — true if a drag occurred since last mousedown. Use to suppress click actions. */
  didDrag: React.MutableRefObject<boolean>;
  /** Mode-appropriate CSS for the Panel container. */
  panelStyle: React.CSSProperties;
  /** Handlers to spread onto the Panel. No-ops in cursor mode. */
  panelHandlers: {
    onMouseDown?: React.MouseEventHandler;
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  };
  /** Move the panel by (dx, dy) pixels. Clamped to plot bounds. No-op in cursor mode. */
  moveBy: (dx: number, dy: number) => void;
}

// ---- Pure helpers (exported for testing) ----

/** Padding from plot edges for corner-anchored positions */
export const CORNER_PAD = 8;

/**
 * Resolve initial position for draggable mode.
 * When panelW/panelH are available (after first render), positions are exact.
 * On first render (panelW/panelH = 0), top-left is always correct;
 * other corners get corrected by the layout effect.
 */
export function resolveInitialPos(
  position: { x: number; y: number } | CornerPosition | undefined,
  plotBox: { left: number; top: number; width: number; height: number },
  panelW: number,
  panelH: number,
): { x: number; y: number } {
  if (position != null && typeof position === 'object') return position;
  switch (position) {
    case 'top-left':     return { x: plotBox.left + CORNER_PAD, y: plotBox.top + CORNER_PAD };
    case 'bottom-left':  return { x: plotBox.left + CORNER_PAD, y: plotBox.top + plotBox.height - panelH - CORNER_PAD };
    case 'bottom-right': return { x: plotBox.left + plotBox.width - panelW - CORNER_PAD, y: plotBox.top + plotBox.height - panelH - CORNER_PAD };
    case 'top-right':
    case undefined:
    default:             return { x: plotBox.left + plotBox.width - panelW - CORNER_PAD, y: plotBox.top + CORNER_PAD };
  }
}

/**
 * Compute cursor-mode position: cursor coords + offset, clamped to plot bounds.
 * Returns null when cursor is off-chart.
 */
export function computeCursorPos(
  cursorLeft: number,
  cursorTop: number,
  plotLeft: number,
  plotTop: number,
  plotWidth: number,
  plotHeight: number,
  offsetX: number,
  offsetY: number,
  panelW: number,
  panelH: number,
): { x: number; y: number } | null {
  if (cursorLeft < 0) return null;
  const x = clamp(cursorLeft + plotLeft + offsetX, plotLeft, plotLeft + plotWidth - panelW);
  const y = clamp(cursorTop + plotTop + offsetY, plotTop, plotTop + plotHeight - panelH);
  return { x, y };
}

/**
 * Clamp a position to stay within plot bounds given panel dimensions.
 * Returns the original position if already in bounds.
 */
export function clampToBounds(
  pos: { x: number; y: number },
  plotLeft: number,
  plotTop: number,
  plotWidth: number,
  plotHeight: number,
  panelW: number,
  panelH: number,
): { x: number; y: number } {
  const cx = Math.max(plotLeft, Math.min(pos.x, plotLeft + plotWidth - panelW));
  const cy = Math.max(plotTop, Math.min(pos.y, plotTop + plotHeight - panelH));
  if (cx === pos.x && cy === pos.y) return pos;
  return { x: cx, y: cy };
}

// ---- Styles ----

const CURSOR_PANEL_STYLE: React.CSSProperties = { pointerEvents: 'none' };

function draggablePanelStyle(isDragging: boolean, hovered: boolean, idleOpacity: number): React.CSSProperties {
  return {
    pointerEvents: 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: hovered || isDragging ? 1 : idleOpacity,
    transition: 'opacity 0.2s ease',
  };
}

// ---- No-op handlers for cursor mode ----

const NOOP_HANDLERS: DraggableOverlayResult['panelHandlers'] = {};

// ---- Hook ----

/**
 * Shared overlay positioning hook for cursor-follow and draggable modes.
 *
 * Owns: position state, drag event handlers, bounds-sync effects,
 * cursor-mode measurement, initialization, idle opacity styling.
 *
 * Callers provide content-dependent `estimatedSize` (via estimatePanelSize)
 * and handle their own content rendering.
 */
export function useDraggableOverlay({
  mode,
  show,
  position,
  offset,
  idleOpacity,
  estimatedSize,
  onPositionChange,
}: UseDraggableOverlayOptions): DraggableOverlayResult {
  const store = useStore();
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);

  // ---- State ----
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const didDrag = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const [initialized, setInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [cursorMeasured, setCursorMeasured] = useState({ w: 0, h: 0 });

  // ---- Effects ----

  // 1. Cursor-mode measurement: measure after every DOM commit.
  // Content width/height can change per cursor position.
  // State guard prevents infinite loops; no deps is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (mode !== 'cursor') return;
    const el = panelRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w !== cursorMeasured.w || h !== cursorMeasured.h) {
      setCursorMeasured({ w, h });
    }
  });

  // 2. Initialize draggable position once plot box is known.
  useLayoutEffect(() => {
    if (mode !== 'draggable' || initialized || snap.plotWidth <= 0) return;
    setInitialized(true);
    const el = panelRef.current;
    const w = el?.offsetWidth ?? estimatedSize.w;
    const h = el?.offsetHeight ?? estimatedSize.h;
    setPos(resolveInitialPos(position, store.plotBox, w, h));
  }, [mode, initialized, snap.plotWidth, position, store.plotBox, estimatedSize]);

  // 3. Sync draggable pos back into bounds when panel or plot resizes.
  // No deps — runs every commit, mirrors the cursor-measurement effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (mode !== 'draggable' || !initialized || pos == null || isDragging) return;
    if (snap.plotWidth <= 0) return;
    const el = panelRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const clamped = clampToBounds(pos, snap.plotLeft, snap.plotTop, snap.plotWidth, snap.plotHeight, w, h);
    if (clamped !== pos) setPos(clamped);
  });

  // Stable ref for onPositionChange to avoid re-creating the drag effect
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  // 4. Window mousemove/mouseup for drag.
  useEffect(() => {
    if (!show || mode !== 'draggable') return;
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      didDrag.current = true;
      const container = store.canvas?.parentElement;
      if (!container) return;
      const r = container.getBoundingClientRect();
      const newPos = { x: e.clientX - r.left - dragOffset.current.dx, y: e.clientY - r.top - dragOffset.current.dy };
      setPos(newPos);
      onPositionChangeRef.current?.(newPos);
    };
    const onUp = () => { draggingRef.current = false; setIsDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [store, show, mode]);

  // ---- Handlers ----

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'draggable') return;
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    didDrag.current = false;
    if (!(e.currentTarget instanceof HTMLElement)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  };

  // ---- Compute renderPos ----

  let renderPos: { x: number; y: number } | null = null;

  if (!show) {
    // Hidden — renderPos stays null
  } else if (mode === 'cursor') {
    const mW = cursorMeasured.w || estimatedSize.w;
    const mH = cursorMeasured.h || estimatedSize.h;
    renderPos = computeCursorPos(
      snap.left, snap.top,
      snap.plotLeft, snap.plotTop, snap.plotWidth, snap.plotHeight,
      offset.x ?? 0, offset.y ?? 0,
      mW, mH,
    );
  } else {
    // Draggable mode
    if (pos != null) {
      if (isDragging) {
        renderPos = pos;
      } else {
        renderPos = clampToBounds(
          pos,
          snap.plotLeft, snap.plotTop, snap.plotWidth, snap.plotHeight,
          estimatedSize.w, estimatedSize.h,
        );
      }
    }
  }

  // ---- Style & handlers ----

  const panelStyle = mode === 'draggable'
    ? draggablePanelStyle(isDragging, hovered, idleOpacity)
    : CURSOR_PANEL_STYLE;

  const panelHandlers = mode === 'draggable'
    ? {
        onMouseDown: handleMouseDown,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => { setHovered(false); didDrag.current = false; },
      }
    : NOOP_HANDLERS;

  const moveBy = (dx: number, dy: number) => {
    if (mode !== 'draggable') return;
    setPos(prev => {
      if (prev == null) return prev;
      const el = panelRef.current;
      const w = el?.offsetWidth ?? estimatedSize.w;
      const h = el?.offsetHeight ?? estimatedSize.h;
      const next = { x: prev.x + dx, y: prev.y + dy };
      const clamped = clampToBounds(next, store.plotBox.left, store.plotBox.top, store.plotBox.width, store.plotBox.height, w, h);
      onPositionChangeRef.current?.(clamped);
      return clamped;
    });
  };

  return {
    panelRef,
    renderPos,
    isDragging,
    hovered,
    didDrag,
    panelStyle,
    panelHandlers,
    moveBy,
  };
}
