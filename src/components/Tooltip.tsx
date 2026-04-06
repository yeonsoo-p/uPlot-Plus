import React, { useSyncExternalStore } from 'react';
import { useStore } from '../hooks/useChart';
import { useDraggableOverlay } from '../hooks/useDraggableOverlay';
import type { TooltipProps, TooltipData, TooltipItem } from '../types/tooltip';
import { Panel, SeriesRow } from './overlay/SeriesPanel';
import { getSeriesColor } from '../types/series';
import { estimatePanelSize } from '../utils/estimatePanelSize';
import { cssVar } from '../rendering/theme';

const DEFAULT_OFFSET = { x: 12, y: -12 };
const EMPTY_SIZE = { w: 0, h: 0 };
const tooltipZIndex: React.CSSProperties = { zIndex: cssVar('tooltipZ') };
const xLabelStyle: React.CSSProperties = { fontWeight: 600, marginBottom: 2, padding: '0 4px' };

/**
 * Tooltip component that shows data values at the cursor position.
 *
 * Two modes:
 * - `"cursor"` (default): follows the cursor. Hidden when cursor leaves.
 * - `"draggable"`: fixed position, drag to move. Values update with cursor;
 *   shows dashes when cursor is off the plot.
 */
export function Tooltip({
  show = true,
  className,
  children,
  offset: offsetProp = DEFAULT_OFFSET,
  precision = 2,
  mode = 'cursor',
  position = 'top-right',
  idleOpacity = 0.8,
}: TooltipProps): React.ReactElement | null {
  const store = useStore();
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);

  const { activeGroup, activeDataIdx } = snap;
  const plotBox = store.plotBox;
  const hasCursor = activeDataIdx >= 0 && activeGroup >= 0 && snap.left >= 0;

  // Resolve offset with defaults for optional x/y
  const offset = { x: offsetProp.x ?? 12, y: offsetProp.y ?? -12 };

  // ---- Build tooltip data ----

  let xVal: number | null = null;
  let xLabel = '';
  const items: TooltipItem[] = [];

  if (hasCursor) {
    const group = store.dataStore.data[activeGroup];
    xVal = group != null ? (group.x[activeDataIdx] ?? null) : null;
    xLabel = xVal != null ? parseFloat(xVal.toFixed(precision)).toString() : '';

    for (const cfg of store.seriesConfigs) {
      if (cfg.show === false || cfg.legend === false) continue;
      const yData = store.dataStore.getYValues(cfg.group, cfg.index);
      const val = cfg.group === activeGroup ? (yData[activeDataIdx] ?? null) : null;
      items.push({
        label: cfg.label ?? `Series ${cfg.index}`,
        value: val,
        color: getSeriesColor(cfg),
        group: cfg.group,
        index: cfg.index,
      });
    }
  } else if (mode === 'draggable') {
    // Draggable mode: show series with dashes when cursor is off-chart
    for (const cfg of store.seriesConfigs) {
      if (cfg.show === false || cfg.legend === false) continue;
      items.push({
        label: cfg.label ?? `Series ${cfg.index}`,
        value: null,
        color: getSeriesColor(cfg),
        group: cfg.group,
        index: cfg.index,
      });
    }
  }

  // Pre-compute dimensions from text content
  const estimated = items.length > 0
    ? estimatePanelSize({
        header: xLabel || undefined,
        rows: items.map(item => ({
          label: item.label,
          value: item.value != null ? item.value.toPrecision(4) : '\u2014',
        })),
      }, store.theme)
    : EMPTY_SIZE;

  const overlay = useDraggableOverlay({
    mode,
    show,
    position,
    offset,
    idleOpacity,
    estimatedSize: estimated,
  });

  // ---- Visibility checks ----

  if (!show) return null;

  // Cursor mode: hide when no active data
  if (mode === 'cursor' && !hasCursor) return null;

  if (overlay.renderPos == null) return null;

  // ---- Build tooltip data object for custom render ----

  const tooltipData: TooltipData = {
    x: xVal,
    xLabel,
    items,
    left: snap.left + plotBox.left,
    top: snap.top + plotBox.top,
  };

  // Merge zIndex into overlay panel style
  const panelStyle = { ...overlay.panelStyle, ...tooltipZIndex };

  // ---- Custom render function ----

  if (children) {
    return (
      <div
        ref={overlay.panelRef}
        className={className}
        data-testid="tooltip-panel"
        style={{
          position: 'absolute',
          left: overlay.renderPos.x,
          top: overlay.renderPos.y,
          whiteSpace: 'nowrap',
          ...panelStyle,
        }}
        {...overlay.panelHandlers}
      >
        {children(tooltipData)}
      </div>
    );
  }

  // ---- Default render ----

  return (
    <Panel
      ref={overlay.panelRef}
      left={overlay.renderPos.x}
      top={overlay.renderPos.y}
      className={className}
      style={panelStyle}
      data-testid="tooltip-panel"
      {...overlay.panelHandlers}
    >
      {xLabel && <div style={xLabelStyle}>{xLabel}</div>}
      {items.map((item) => (
        <SeriesRow
          key={`${item.group}:${item.index}`}
          label={item.label}
          color={item.color}
          value={item.value != null ? item.value.toPrecision(4) : '\u2014'}
        />
      ))}
    </Panel>
  );
}
