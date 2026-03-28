import React, { useSyncExternalStore, useCallback, useRef, memo } from 'react';
import { useChart } from '../hooks/useChart';
import type { LegendConfig } from '../types/legend';
import type { ChartStore } from '../hooks/useChartStore';

interface LegendProps extends LegendConfig {
  className?: string;
}

interface LegendSnapshot {
  activeGroup: number;
  activeDataIdx: number;
  seriesCount: number;
  revision: number;
}

// Static styles hoisted out of render to avoid re-allocation
const swatchStyle: React.CSSProperties = {
  width: 12,
  height: 3,
  borderRadius: 1,
  display: 'inline-block',
};

const valueStyle: React.CSSProperties = { fontWeight: 600 };

const baseItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'sans-serif',
};

const itemStyleVisible: React.CSSProperties = { ...baseItemStyle, opacity: 1 };
const itemStyleHidden: React.CSSProperties = { ...baseItemStyle, opacity: 0.4 };
const swatchStyleCache = new Map<string, React.CSSProperties>();

interface LegendItemProps {
  group: number;
  index: number;
  label: string;
  color: string;
  isHidden: boolean;
  valueStr: string;
  store: ChartStore;
}

const LegendItem = memo(function LegendItem({ group, index, label, color, isHidden, valueStr, store }: LegendItemProps) {
  const handleClick = useCallback(() => {
    store.toggleSeries(group, index);
  }, [store, group, index]);

  let cachedSwatch = swatchStyleCache.get(color);
  if (cachedSwatch == null) {
    cachedSwatch = { ...swatchStyle, backgroundColor: color };
    swatchStyleCache.set(color, cachedSwatch);
  }

  return (
    <span
      onClick={handleClick}
      style={isHidden ? itemStyleHidden : itemStyleVisible}
    >
      <span style={cachedSwatch} />
      <span>{label}</span>
      {valueStr && <span style={valueStyle}>{valueStr}</span>}
    </span>
  );
});

/**
 * Legend component that shows series labels with color swatches.
 * Updates live as the cursor moves. Click to toggle series visibility.
 */
export function Legend({ show = true, position = 'bottom', className }: LegendProps): React.ReactElement | null {
  const store = useChart();
  const snapRef = useRef<LegendSnapshot>({ activeGroup: -1, activeDataIdx: -1, seriesCount: 0, revision: -1 });

  const subscribe = useCallback(
    (cb: () => void) => store.subscribeCursor(cb),
    [store],
  );

  const getSnapshot = useCallback((): LegendSnapshot => {
    const { activeGroup, activeDataIdx } = store.cursorManager.state;
    const seriesCount = store.seriesConfigs.length;
    const { revision } = store;
    const prev = snapRef.current;
    if (prev.activeGroup === activeGroup && prev.activeDataIdx === activeDataIdx && prev.seriesCount === seriesCount && prev.revision === revision) {
      return prev;
    }
    const next: LegendSnapshot = { activeGroup, activeDataIdx, seriesCount, revision };
    snapRef.current = next;
    return next;
  }, [store]);

  const snap = useSyncExternalStore(subscribe, getSnapshot);

  if (!show) return null;

  const { activeGroup, activeDataIdx } = snap;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        order: position === 'top' ? -1 : 1,
        padding: '4px 0',
      }}
    >
      {store.seriesConfigs.map((cfg) => {
        if (cfg.legend === false) return null;
        const color = typeof cfg.stroke === 'string' ? cfg.stroke : '#000';
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
