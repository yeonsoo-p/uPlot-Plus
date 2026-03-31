import React, { useRef, useState, useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { useStore } from '../hooks/useChart';
import { Panel, SeriesRow, formatSeriesValue } from './overlay/SeriesPanel';
import { clamp } from '../math/utils';

export interface FloatingLegendProps {
  /** Behavior mode: 'draggable' (default) or 'cursor' (follows cursor). */
  mode?: 'draggable' | 'cursor';
  /** Initial position for draggable mode (default: 'top-right') */
  position?: { x: number; y: number } | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Offset from cursor for cursor mode (default: { x: 12, y: -12 }) */
  offset?: { x: number; y: number };
  /** Opacity when not hovered in draggable mode (default: 0.3) */
  idleOpacity?: number;
  /** Whether to show (default: true) */
  show?: boolean;
  /** CSS class for custom styling */
  className?: string;
}

/** Padding from plot edges for corner-anchored positions */
const CORNER_PAD = 8;
const DEFAULT_OFFSET = { x: 12, y: -12 };
const cursorPanelStyle: React.CSSProperties = { pointerEvents: 'none' };

/**
 * Resolve initial position for draggable mode.
 * When panelW/panelH are available (after first render), positions are exact.
 * On first render (panelW/panelH = 0), top-left is always correct;
 * other corners get corrected by the layout effect.
 */
function resolveInitialPos(
  position: FloatingLegendProps['position'],
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
    default:             return { x: plotBox.left + plotBox.width - panelW - CORNER_PAD, y: plotBox.top + CORNER_PAD };
  }
}

/**
 * Floating legend rendered inside the chart's plot area.
 *
 * Two modes:
 * - `"draggable"` (default): fixed position, drag to move, fades when not hovered.
 *   Click items to toggle series visibility.
 * - `"cursor"`: follows the cursor like a tooltip. Hidden when cursor leaves.
 */
export function FloatingLegend({
  mode = 'draggable',
  position = 'top-right',
  offset = DEFAULT_OFFSET,
  idleOpacity = 0.3,
  show = true,
  className,
}: FloatingLegendProps): React.ReactElement | null {
  const store = useStore();
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const didDrag = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const [initialized, setInitialized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize and correct draggable position once plot box is known
  useLayoutEffect(() => {
    if (mode !== 'draggable' || initialized || snap.plotWidth <= 0) return;
    setInitialized(true);
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    setPos(resolveInitialPos(position, store.plotBox, w, h));
  }, [mode, initialized, snap.plotWidth, position, store.plotBox]);

  // Toggle handler — only fires if no drag occurred
  const handleToggle = (group: number, index: number) => {
    if (didDrag.current) return;
    store.toggleSeries(group, index);
  };

  // Drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'draggable') return;
    e.stopPropagation();
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    didDrag.current = false;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  };

  useEffect(() => {
    if (!show || mode !== 'draggable') return;
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      didDrag.current = true;
      const container = store.canvas?.parentElement;
      if (!container) return;
      const r = container.getBoundingClientRect();
      setPos({ x: e.clientX - r.left - dragOffset.current.dx, y: e.clientY - r.top - dragOffset.current.dy });
    };
    const onUp = () => { draggingRef.current = false; setIsDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [store, show, mode]);

  if (!show) return null;

  const { activeGroup, activeDataIdx, left: cursorLeft, top: cursorTop } = snap;

  // Build rows
  const rows = store.seriesConfigs.filter(c => c.legend !== false).map((cfg) => {
    const color = typeof cfg.stroke === 'string' ? cfg.stroke : '#000';
    const value = formatSeriesValue(store, cfg.group, cfg.index, activeGroup, activeDataIdx);
    const isClickable = mode === 'draggable';
    return (
      <SeriesRow
        key={`${cfg.group}:${cfg.index}`}
        label={cfg.label ?? `Series ${cfg.index}`}
        color={color}
        value={value}
        isHidden={cfg.show === false}
        onClick={isClickable ? () => handleToggle(cfg.group, cfg.index) : undefined}
      />
    );
  });

  // --- Cursor mode ---
  if (mode === 'cursor') {
    if (cursorLeft < 0) return null;
    const mW = panelRef.current?.offsetWidth ?? 0;
    const mH = panelRef.current?.offsetHeight ?? 0;
    const pR = snap.plotLeft + snap.plotWidth;
    const pB = snap.plotTop + snap.plotHeight;
    const x = clamp(cursorLeft + snap.plotLeft + offset.x, snap.plotLeft, pR - mW);
    const y = clamp(cursorTop + snap.plotTop + offset.y, snap.plotTop, pB - mH);
    return <Panel ref={panelRef} left={x} top={y} className={className} style={cursorPanelStyle}>{rows}</Panel>;
  }

  // --- Draggable mode ---
  if (pos == null) return null;
  return (
    <Panel
      ref={panelRef}
      left={pos.x}
      top={pos.y}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); didDrag.current = false; }}
      style={{
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: hovered || isDragging ? 1 : idleOpacity,
        transition: 'opacity 0.2s ease',
      }}
    >
      {rows}
    </Panel>
  );
}
