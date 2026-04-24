import React, { useContext, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useStore, OverlayHostContext } from '../hooks/useChart';
import { useDraggableOverlay } from '../hooks/useDraggableOverlay';
import { Panel, SeriesRow, formatSeriesValue } from './overlay/SeriesPanel';
import { getSeriesColor } from '../types/series';
import { estimatePanelSize } from '../utils/estimatePanelSize';
import type { OverlayPosition, OverlayOffset } from '../types/common';

// Re-export for backward compatibility (tests and external consumers)
export { resolveInitialPos, CORNER_PAD } from '../hooks/useDraggableOverlay';

export interface FloatingLegendProps {
  /** Behavior mode: 'draggable' (default) or 'cursor' (follows cursor). */
  mode?: 'draggable' | 'cursor';
  /** Initial position for draggable mode (default: 'top-right') */
  position?: OverlayPosition;
  /** Offset from cursor for cursor mode (default: { x: 12, y: -12 }) */
  offset?: OverlayOffset;
  /** Opacity when not hovered in draggable mode (default: 0.3) */
  idleOpacity?: number;
  /** Whether to show (default: true) */
  show?: boolean;
  /** CSS class for custom styling */
  className?: string;
}

const DEFAULT_OFFSET = { x: 12, y: -12 };
const EMPTY_SIZE = { w: 0, h: 0 };

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
  const overlayHost = useContext(OverlayHostContext);
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);

  const { activeGroup, activeDataIdx } = snap;

  // Build rows + collect text content for pre-measurement
  const rowContent: Array<{ label: string; value: string }> = [];
  // Hidden series (show=false) are shown with reduced opacity so users can toggle them back on.
  // Internal helper series and legend=false series are excluded entirely.
  const rows = store.seriesConfigs.filter(c => c.legend !== false && c._source !== 'internal').map((cfg) => {
    const color = getSeriesColor(cfg);
    const value = formatSeriesValue(store, cfg.group, cfg.index, activeGroup, activeDataIdx);
    const label = cfg.label ?? `Series ${cfg.index}`;
    rowContent.push({ label, value });
    return { cfg, color, value, label };
  });

  // Pre-compute dimensions from text content to avoid double render
  const estimated = rows.length > 0 ? estimatePanelSize({ rows: rowContent }, store.theme) : EMPTY_SIZE;

  const overlay = useDraggableOverlay({
    mode,
    show,
    position,
    offset,
    idleOpacity,
    estimatedSize: estimated,
  });

  if (!show || overlay.renderPos == null) return null;

  // Toggle handler — only fires if no drag occurred
  const handleToggle = (group: number, index: number) => {
    if (overlay.didDrag.current) return;
    store.toggleSeries(group, index);
  };

  const isClickable = mode === 'draggable';

  const content = (
    <Panel
      ref={overlay.panelRef}
      left={overlay.renderPos.x}
      top={overlay.renderPos.y}
      className={className}
      style={overlay.panelStyle}
      data-testid="floating-legend"
      {...overlay.panelHandlers}
    >
      {rows.map(({ cfg, color, value, label }) => (
        <SeriesRow
          key={`${cfg.group}:${cfg.index}`}
          label={label}
          color={color}
          value={value}
          isHidden={cfg.show === false}
          onClick={isClickable ? () => handleToggle(cfg.group, cfg.index) : undefined}
        />
      ))}
    </Panel>
  );
  return overlayHost != null ? createPortal(content, overlayHost) : content;
}
