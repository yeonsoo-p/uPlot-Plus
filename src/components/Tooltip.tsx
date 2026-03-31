import React, { useRef } from 'react';
import { useChart } from '../hooks/useChart';
import { useChartSnapshot } from '../hooks/useChartSnapshot';
import type { TooltipProps, TooltipData, TooltipItem } from '../types/tooltip';
import { Panel, SeriesRow } from './overlay/SeriesPanel';
import { clamp } from '../math/utils';

/**
 * Tooltip component that shows data values at the cursor position.
 * Uses the shared Panel/SeriesRow visuals from FloatingLegend.
 * Positioned as an absolute HTML overlay inside the chart container.
 */
export function Tooltip({
  show = true,
  className,
  children,
  offset = {},
}: TooltipProps): React.ReactElement | null {
  const store = useChart();
  const snap = useChartSnapshot();
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!show) return null;
  if (snap.activeDataIdx < 0 || snap.activeGroup < 0) return null;
  if (snap.left < 0) return null;

  const { activeGroup, activeDataIdx } = snap;
  const plotBox = store.plotBox;

  // X value
  const group = store.dataStore.data[activeGroup];
  const xVal = group != null ? (group.x[activeDataIdx] as number | undefined) ?? null : null;
  const xLabel = xVal != null ? parseFloat(xVal.toPrecision(6)).toString() : '';

  // Series values
  const items: TooltipItem[] = [];
  for (const cfg of store.seriesConfigs) {
    if (cfg.show === false || cfg.legend === false) continue;
    const yData = store.dataStore.getYValues(cfg.group, cfg.index);
    const val = cfg.group === activeGroup ? (yData[activeDataIdx] as number | null) : null;
    items.push({
      label: cfg.label ?? `Series ${cfg.index}`,
      value: val,
      color: typeof cfg.stroke === 'string' ? cfg.stroke : '#000',
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

  const measuredWidth = tooltipRef.current?.offsetWidth ?? 0;
  const measuredHeight = tooltipRef.current?.offsetHeight ?? 0;

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
    <Panel ref={tooltipRef} left={posLeft} top={posTop} className={className} style={{ pointerEvents: 'none', zIndex: 100 }}>
      <div style={{ fontWeight: 600, marginBottom: 2, padding: '0 4px' }}>{xLabel}</div>
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
