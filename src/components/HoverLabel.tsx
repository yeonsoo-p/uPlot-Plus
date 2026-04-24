import React, { useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useStore, OverlayHostContext } from '../hooks/useChart';
import { Panel, SeriesRow } from './overlay/SeriesPanel';
import { useMeasuredOverlay, computeCursorPos } from '../hooks/useDraggableOverlay';
import { getSeriesColor } from '../types/series';
import { estimatePanelSize } from '../utils/estimatePanelSize';

const hoverPanelStyle: React.CSSProperties = { pointerEvents: 'none' };

/** Pixel gap between the cursor and the bottom of the floating label */
const CURSOR_GAP = 12;

export interface HoverLabelProps {
  /** Delay in milliseconds before label appears (default: 1000) */
  delay?: number;
  /** Whether to show (default: true) */
  show?: boolean;
  /** CSS class for custom styling */
  className?: string;
}

/**
 * Shows the focused series label as a floating tag after hovering for a delay.
 * Uses the shared Panel/SeriesRow visuals. Must be a child of <Chart>.
 */
export function HoverLabel({
  delay = 1000,
  show = true,
  className,
}: HoverLabelProps): React.ReactElement | null {
  const store = useStore();
  const overlayHost = useContext(OverlayHostContext);
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);
  const [visible, setVisible] = useState(false);
  const trackedSeries = useRef(-1);
  const timerRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Compute estimated size eagerly so first render places the panel close to its final spot
  // even before the layout-effect measurement lands.
  const cfg = store.seriesConfigs.find(
    (s) => s.group === snap.activeGroup && s.index === snap.activeSeriesIdx,
  );
  const estimated = estimatePanelSize({ rows: [{ label: cfg?.label ?? '' }] }, store.theme);
  const { w: mW, h: mH } = useMeasuredOverlay(panelRef, estimated);

  // Track series changes and manage timer
  useEffect(() => {
    const si = snap.activeSeriesIdx;
    if (si !== trackedSeries.current) {
      trackedSeries.current = si;
      setVisible(false);
      window.clearTimeout(timerRef.current);
      if (si >= 0) {
        timerRef.current = window.setTimeout(() => setVisible(true), delay);
      }
    }
  }, [snap.activeSeriesIdx, delay]);

  // Cleanup
  useEffect(() => () => { window.clearTimeout(timerRef.current); }, []);

  if (!show || !visible || snap.left < 0) return null;
  if (!cfg?.label || cfg.legend === false) return null;

  // Position centered above cursor (offset = (-w/2, -h - gap)) — uses the same clamp
  // logic as the rest of the cursor-anchored overlays.
  const pos = computeCursorPos(
    snap.left, snap.top,
    snap.plotLeft, snap.plotTop, snap.plotWidth, snap.plotHeight,
    -mW / 2, -mH - CURSOR_GAP,
    mW, mH,
  );
  if (pos == null) return null;

  const content = (
    <Panel ref={panelRef} left={pos.x} top={pos.y} className={className} style={hoverPanelStyle}>
      <SeriesRow label={cfg.label} color={getSeriesColor(cfg)} />
    </Panel>
  );
  return overlayHost != null ? createPortal(content, overlayHost) : content;
}
