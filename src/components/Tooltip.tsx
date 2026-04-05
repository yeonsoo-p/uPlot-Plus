import React, { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useStore } from '../hooks/useChart';
import type { TooltipProps, TooltipData, TooltipItem } from '../types/tooltip';
import { Panel, SeriesRow } from './overlay/SeriesPanel';
import { clamp } from '../math/utils';
import { getSeriesColor } from '../types/series';

const DEFAULT_OFFSET: { x?: number; y?: number } = {};
const tooltipPanelStyle: React.CSSProperties = { pointerEvents: 'none', zIndex: 100 };
const xLabelStyle: React.CSSProperties = { fontWeight: 600, marginBottom: 2, padding: '0 4px' };

/**
 * Tooltip component that shows data values at the cursor position.
 * Uses the shared Panel/SeriesRow visuals from FloatingLegend.
 * Positioned as an absolute HTML overlay inside the chart container.
 */
export function Tooltip({
  show = true,
  className,
  children,
  offset = DEFAULT_OFFSET,
  precision = 2,
}: TooltipProps): React.ReactElement | null {
  const store = useStore();
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState({ w: 0, h: 0 });

  // Measure after every DOM commit — content may change width/height on each cursor move.
  // The state guard prevents infinite re-render loops; no deps is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w !== measured.w || h !== measured.h) {
      setMeasured({ w, h });
    }
  });

  if (!show) return null;
  if (snap.activeDataIdx < 0 || snap.activeGroup < 0) return null;
  if (snap.left < 0) return null;

  const { activeGroup, activeDataIdx } = snap;
  const plotBox = store.plotBox;

  // X value
  const group = store.dataStore.data[activeGroup];
  const xVal = group != null ? (group.x[activeDataIdx] as number | undefined) ?? null : null;
  const xLabel = xVal != null ? parseFloat(xVal.toFixed(precision)).toString() : '';

  // Series values
  const items: TooltipItem[] = [];
  for (const cfg of store.seriesConfigs) {
    if (cfg.show === false || cfg.legend === false) continue;
    const yData = store.dataStore.getYValues(cfg.group, cfg.index);
    const val = cfg.group === activeGroup ? (yData[activeDataIdx] as number | null) : null;
    items.push({
      label: cfg.label ?? `Series ${cfg.index}`,
      value: val,
      color: getSeriesColor(cfg),
      group: cfg.group,
      index: cfg.index,
    });
  }

  const tooltipData: TooltipData = {
    x: xVal,
    xLabel,
    items,
    left: snap.left + plotBox.left,
    top: snap.top + plotBox.top,
  };

  const offX = offset.x ?? 12;
  const offY = offset.y ?? -12;

  const measuredWidth = measured.w;
  const measuredHeight = measured.h;

  const cursorLeft = snap.left + plotBox.left;
  const cursorTop = snap.top + plotBox.top;
  const plotRight = plotBox.left + plotBox.width;
  const plotBottom = plotBox.top + plotBox.height;

  const posLeft = clamp(cursorLeft + offX, plotBox.left, plotRight - measuredWidth);
  const posTop = clamp(cursorTop + offY, plotBox.top, plotBottom - measuredHeight);

  // Custom render function
  if (children) {
    return (
      <div
        ref={tooltipRef}
        className={className}
        style={{ position: 'absolute', left: posLeft, top: posTop, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100 }}
      >
        {children(tooltipData)}
      </div>
    );
  }

  // Default: use shared Panel + SeriesRow
  return (
    <Panel ref={tooltipRef} left={posLeft} top={posTop} className={className} style={tooltipPanelStyle}>
      <div style={xLabelStyle}>{xLabel}</div>
      {items.map((item) => (
        <SeriesRow
          key={`${item.group}:${item.index}`}
          label={item.label}
          color={item.color}
          value={item.value != null ? item.value.toPrecision(4) : '—'}
        />
      ))}
    </Panel>
  );
}
