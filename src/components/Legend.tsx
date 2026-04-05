import React, { useSyncExternalStore } from 'react';
import { useStore } from '../hooks/useChart';
import type { LegendConfig } from '../types/legend';
import type { ChartStore } from '../hooks/useChartStore';
import { getSeriesColor } from '../types/series';
import {
  SWATCH_W, SWATCH_H, SWATCH_RADIUS, ROW_GAP, HIDDEN_OPACITY,
  OVERLAY_FONT_SIZE, OVERLAY_FONT_FAMILY,
} from './overlay/tokens';

interface LegendProps extends LegendConfig {
  className?: string;
}

// Static styles hoisted out of render to avoid re-allocation
const swatchStyle: React.CSSProperties = {
  width: SWATCH_W,
  height: SWATCH_H,
  borderRadius: SWATCH_RADIUS,
  display: 'inline-block',
};

const valueStyle: React.CSSProperties = { fontWeight: 600 };

const baseItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: ROW_GAP,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: OVERLAY_FONT_SIZE,
  fontFamily: OVERLAY_FONT_FAMILY,
};

const itemStyleVisible: React.CSSProperties = { ...baseItemStyle, opacity: 1 };
const itemStyleHidden: React.CSSProperties = { ...baseItemStyle, opacity: HIDDEN_OPACITY };
const swatchStyleCache = new Map<string, React.CSSProperties>();

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
  let cachedSwatch = swatchStyleCache.get(color);
  if (cachedSwatch == null) {
    cachedSwatch = { ...swatchStyle, backgroundColor: color };
    swatchStyleCache.set(color, cachedSwatch);
  }

  return (
    <span
      data-testid={`legend-item-${group}-${index}`}
      onClick={() => store.toggleSeries(group, index)}
      style={isHidden ? itemStyleHidden : itemStyleVisible}
    >
      <span style={cachedSwatch} />
      <span>{label}</span>
      {valueStr && <span style={valueStyle}>{valueStr}</span>}
    </span>
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
      {store.seriesConfigs.map((cfg) => {
        if (cfg.legend === false) return null;
        const color = getSeriesColor(cfg);
        let valueStr = '';
        if (activeDataIdx >= 0 && activeGroup >= 0 && cfg.group === activeGroup) {
          const yData = store.dataStore.getYValues(cfg.group, cfg.index);
          const val = yData[activeDataIdx];
          if (val != null) {
            valueStr = typeof val === 'number' ? val.toPrecision(4) : String(val);
          }
        }

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
