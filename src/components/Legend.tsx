import { useSyncExternalStore, useCallback, useRef } from 'react';
import { useChart } from '../hooks/useChart';
import type { LegendConfig } from '../types/legend';

interface LegendProps extends LegendConfig {
  className?: string;
}

interface LegendSnapshot {
  activeGroup: number;
  activeDataIdx: number;
  seriesCount: number;
}

/**
 * Legend component that shows series labels with color swatches.
 * Updates live as the cursor moves. Click to toggle series visibility.
 */
export function Legend({ show = true, position = 'bottom', className }: LegendProps): React.ReactElement | null {
  const store = useChart();
  const snapRef = useRef<LegendSnapshot>({ activeGroup: -1, activeDataIdx: -1, seriesCount: 0 });

  const subscribe = useCallback(
    (cb: () => void) => store.subscribe(cb),
    [store],
  );

  const getSnapshot = useCallback((): LegendSnapshot => {
    const { activeGroup, activeDataIdx } = store.cursorManager.state;
    const seriesCount = store.seriesConfigs.length;
    const prev = snapRef.current;
    if (prev.activeGroup === activeGroup && prev.activeDataIdx === activeDataIdx && prev.seriesCount === seriesCount) {
      return prev;
    }
    const next: LegendSnapshot = { activeGroup, activeDataIdx, seriesCount };
    snapRef.current = next;
    return next;
  }, [store]);

  const snap = useSyncExternalStore(subscribe, getSnapshot);

  if (!show) return null;

  const { activeGroup, activeDataIdx } = snap;

  const items = store.seriesConfigs.map((cfg, i) => {
    const isHidden = cfg.show === false;
    const color = cfg.stroke ?? '#000';

    let valueStr = '';
    if (activeDataIdx >= 0 && activeGroup >= 0) {
      const yData = store.dataStore.getYValues(cfg.group, cfg.index);
      const val = yData[activeDataIdx];
      if (val != null) {
        valueStr = typeof val === 'number' ? val.toFixed(2) : String(val);
      }
    }

    const handleClick = () => {
      store.toggleSeries(cfg.group, cfg.index);
    };

    return (
      <span
        key={`${cfg.group}:${cfg.index}:${i}`}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          cursor: 'pointer',
          opacity: isHidden ? 0.4 : 1,
          fontSize: 12,
          fontFamily: 'sans-serif',
        }}
      >
        <span
          style={{
            width: 12,
            height: 3,
            backgroundColor: color,
            borderRadius: 1,
            display: 'inline-block',
          }}
        />
        <span>{cfg.label ?? `Series ${cfg.index}`}</span>
        {valueStr && <span style={{ fontWeight: 600 }}>{valueStr}</span>}
      </span>
    );
  });

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
      {items}
    </div>
  );
}
