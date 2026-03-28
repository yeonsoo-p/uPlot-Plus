import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { useChart } from '../hooks/useChart';
import { Panel, SeriesRow } from './overlay/SeriesPanel';
import { clamp } from '../math/utils';

export interface HoverLabelProps {
  /** Delay in milliseconds before label appears (default: 1000) */
  delay?: number;
  /** Whether to show (default: true) */
  show?: boolean;
  /** CSS class for custom styling */
  className?: string;
}

interface Snapshot {
  cursorLeft: number;
  cursorTop: number;
  activeSeriesIdx: number;
  activeGroup: number;
  plotLeft: number;
  plotTop: number;
  plotWidth: number;
  plotHeight: number;
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
  const store = useChart();
  const snapRef = useRef<Snapshot | null>(null);
  const [visible, setVisible] = useState(false);
  const trackedSeries = useRef(-1);
  const timerRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), [store]);

  const getSnapshot = useCallback((): Snapshot => {
    const { left: cursorLeft, top: cursorTop, activeSeriesIdx, activeGroup } = store.cursorManager.state;
    const { left: plotLeft, top: plotTop, width: plotWidth, height: plotHeight } = store.plotBox;
    const prev = snapRef.current;
    if (
      prev != null &&
      prev.cursorLeft === cursorLeft && prev.cursorTop === cursorTop &&
      prev.activeSeriesIdx === activeSeriesIdx && prev.activeGroup === activeGroup &&
      prev.plotLeft === plotLeft && prev.plotTop === plotTop &&
      prev.plotWidth === plotWidth && prev.plotHeight === plotHeight
    ) return prev;
    const next: Snapshot = { cursorLeft, cursorTop, activeSeriesIdx, activeGroup, plotLeft, plotTop, plotWidth, plotHeight };
    snapRef.current = next;
    return next;
  }, [store]);

  const snap = useSyncExternalStore(subscribe, getSnapshot);

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

  if (!show || !visible || snap.cursorLeft < 0) return null;

  const cfg = store.seriesConfigs.find(
    (s) => s.group === snap.activeGroup && s.index === snap.activeSeriesIdx,
  );
  if (!cfg?.label || cfg.legend === false) return null;

  const color = typeof cfg.stroke === 'string' ? cfg.stroke : '#000';

  // Position above cursor, clamped to plot
  const mW = panelRef.current?.offsetWidth ?? 80;
  const mH = panelRef.current?.offsetHeight ?? 24;
  const cx = snap.cursorLeft + snap.plotLeft;
  const cy = snap.cursorTop + snap.plotTop;
  const x = clamp(cx - mW / 2, snap.plotLeft, snap.plotLeft + snap.plotWidth - mW);
  const y = clamp(cy - mH - 12, snap.plotTop, snap.plotTop + snap.plotHeight - mH);

  return (
    <Panel ref={panelRef} left={x} top={y} className={className} style={{ pointerEvents: 'none' }}>
      <SeriesRow label={cfg.label} color={color} />
    </Panel>
  );
}
