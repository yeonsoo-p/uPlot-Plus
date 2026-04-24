import React, { useSyncExternalStore } from 'react';
import { useStore } from '../hooks/useChart';
import type { LegendConfig } from '../types/legend';
import type { ChartStore } from '../hooks/useChartStore';
import { getSeriesColor } from '../types/series';
import { ROW_GAP } from './overlay/tokens';
import { cssVar } from '../rendering/theme';
import {
  formatSeriesValue,
  getSwatchStyle,
  overlayValueStyle,
  overlayHiddenOpacity,
} from './overlay/SeriesPanel';

export interface LegendProps extends LegendConfig {
  className?: string;
}

// Legend rows are inline pills in a wrapping container — distinct layout from
// SeriesPanel's stacked full-width rows — but the swatch, value text, and
// hidden-opacity styling come from the shared overlay tokens.
const baseItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: ROW_GAP,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: cssVar('overlayFontSize'),
  fontFamily: cssVar('overlayFontFamily'),
  background: 'none',
  border: 'none',
  color: 'inherit',
};

const itemStyleVisible: React.CSSProperties = { ...baseItemStyle, opacity: 1 };
const itemStyleHidden: React.CSSProperties = { ...baseItemStyle, opacity: overlayHiddenOpacity };

const wrapperStyleTop: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', justifyContent: 'center', order: -1, padding: '4px 0',
};
const wrapperStyleBottom: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', justifyContent: 'center', order: 1, padding: '4px 0',
};

interface LegendItemProps {
  group: number;
  index: number;
  label: string;
  color: string;
  isHidden: boolean;
  valueStr: string;
  store: ChartStore;
}

function LegendItem({ group, index, label, color, isHidden, valueStr, store }: LegendItemProps) {
  return (
    <button
      type="button"
      data-testid={`legend-item-${group}-${index}`}
      onClick={() => store.toggleSeries(group, index)}
      aria-pressed={!isHidden}
      aria-label={`Toggle ${label}`}
      style={isHidden ? itemStyleHidden : itemStyleVisible}
    >
      <span style={getSwatchStyle(color)} />
      <span>{label}</span>
      {valueStr && <span style={overlayValueStyle}>{valueStr}</span>}
    </button>
  );
}

/**
 * Legend component that shows series labels with color swatches.
 * Updates live as the cursor moves. Click to toggle series visibility.
 */
export function Legend({ show = true, position = 'bottom', className }: LegendProps): React.ReactElement | null {
  const store = useStore();
  const snap = useSyncExternalStore(store.subscribeCursor, store.getSnapshot);

  if (!show) return null;

  const { activeGroup, activeDataIdx } = snap;

  return (
    <div
      className={className}
      data-testid="legend"
      style={position === 'top' ? wrapperStyleTop : wrapperStyleBottom}
    >
      {/* Hidden series (show=false) are shown with reduced opacity so users can toggle them back on.
          Internal helper series and legend=false series are excluded entirely. */}
      {store.seriesConfigs.map((cfg) => {
        if (cfg.legend === false || cfg._source === 'internal') return null;
        const color = getSeriesColor(cfg);
        const valueStr = formatSeriesValue(store, cfg.group, cfg.index, activeGroup, activeDataIdx);

        return (
          <LegendItem
            key={`${cfg.group}:${cfg.index}`}
            group={cfg.group}
            index={cfg.index}
            label={cfg.label ?? `Series ${cfg.index}`}
            color={color}
            isHidden={cfg.show === false}
            valueStr={valueStr}
            store={store}
          />
        );
      })}
    </div>
  );
}
