import React, { useSyncExternalStore, useCallback, useRef, useState, useEffect } from 'react';
import { useChart } from '../hooks/useChart';
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

interface Snapshot {
  activeGroup: number;
  activeDataIdx: number;
  cursorLeft: number;
  cursorTop: number;
  seriesCount: number;
  revision: number;
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
}

function resolveInitialPos(
  position: FloatingLegendProps['position'],
  plotBox: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  if (position != null && typeof position === 'object') return position;
  const pad = 8;
  switch (position) {
    case 'top-left':     return { x: plotBox.left + pad, y: plotBox.top + pad };
    case 'bottom-left':  return { x: plotBox.left + pad, y: plotBox.top + plotBox.height - 60 };
    case 'bottom-right': return { x: plotBox.left + plotBox.width - 140, y: plotBox.top + plotBox.height - 60 };
    case 'top-right':
    default:             return { x: plotBox.left + plotBox.width - 140, y: plotBox.top + pad };
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
  offset = { x: 12, y: -12 },
  idleOpacity = 0.3,
  show = true,
  className,
}: FloatingLegendProps): React.ReactElement | null {
  const store = useChart();
  const snapRef = useRef<Snapshot | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const initialized = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const subscribe = useCallback((cb: () => void) => store.subscribeCursor(cb), [store]);

  const getSnapshot = useCallback((): Snapshot => {
    const { activeGroup, activeDataIdx, left: cursorLeft, top: cursorTop } = store.cursorManager.state;
    const seriesCount = store.seriesConfigs.length;
    const { revision } = store;
    const { left: plotLeft, top: plotTop, width: plotWidth, height: plotHeight } = store.plotBox;
    const prev = snapRef.current;
    if (
      prev != null &&
      prev.activeGroup === activeGroup && prev.activeDataIdx === activeDataIdx &&
      prev.cursorLeft === cursorLeft && prev.cursorTop === cursorTop &&
      prev.seriesCount === seriesCount && prev.revision === revision &&
      prev.plotLeft === plotLeft && prev.plotTop === plotTop &&
      prev.plotWidth === plotWidth && prev.plotHeight === plotHeight
    ) return prev;
    const next: Snapshot = {
      activeGroup, activeDataIdx, cursorLeft, cursorTop,
      seriesCount, revision, plotLeft, plotTop, plotWidth, plotHeight,
    };
    snapRef.current = next;
    return next;
  }, [store]);

  const snap = useSyncExternalStore(subscribe, getSnapshot);

  // Initialize draggable position once plot box is known
  if (mode === 'draggable' && !initialized.current && snap.plotWidth > 0) {
    initialized.current = true;
    if (pos == null) setPos(resolveInitialPos(position, store.plotBox));
  }

  // Toggle handler — only fires if no drag occurred
  const handleToggle = useCallback((group: number, index: number) => {
    if (didDrag.current) return;
    store.toggleSeries(group, index);
  }, [store]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'draggable') return;
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    didDrag.current = false;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  }, [mode]);

  useEffect(() => {
    if (!show || mode !== 'draggable') return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      didDrag.current = true;
      const container = store.canvas?.parentElement;
      if (!container) return;
      const r = container.getBoundingClientRect();
      setPos({ x: e.clientX - r.left - dragOffset.current.dx, y: e.clientY - r.top - dragOffset.current.dy });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [store, show, mode]);

  if (!show) return null;

  const { activeGroup, activeDataIdx, cursorLeft, cursorTop } = snap;

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
    return <Panel ref={panelRef} left={x} top={y} className={className} style={{ pointerEvents: 'none' }}>{rows}</Panel>;
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
        cursor: dragging.current ? 'grabbing' : 'grab',
        opacity: hovered || dragging.current ? 1 : idleOpacity,
        transition: 'opacity 0.2s ease',
      }}
    >
      {rows}
    </Panel>
  );
}
