import { useEffect, useRef } from 'react';
import type { SeriesConfig } from '../types';
import { useChart } from '../hooks/useChart';
import { shallowEqual } from '../utils/shallowEqual';

/** Series component props — yScale defaults to 'y' if omitted. */
export type SeriesProps = Omit<SeriesConfig, 'yScale'> & { yScale?: string };

/** Curated default colors for auto-assignment to series without explicit stroke. */
const DEFAULT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
  '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#d35400',
];

/** Apply defaults for yScale, show, and stroke. */
function resolveDefaults(p: SeriesProps, colorIndex: number): SeriesConfig {
  return {
    ...p,
    yScale: p.yScale ?? 'y',
    show: p.show ?? true,
    stroke: p.stroke ?? DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length],
  };
}

/**
 * Renderless component that registers a series config with the chart store.
 * Must be a child of <Chart>.
 *
 * Mount effect registers/unregisters based on identity keys (group, index).
 * Sync effect updates config when any prop changes (shallow-equality bail-out).
 */
export function Series(props: SeriesProps): null {
  const store = useChart();
  const propsRef = useRef(props);
  propsRef.current = props;

  // Mount/unmount: register on mount, unregister on unmount or identity change.
  useEffect(() => {
    const p = propsRef.current;
    store.registerSeries(resolveDefaults(p, store.seriesConfigs.length));
    store.renderer.clearGroupCache(p.group);
    store.scheduleRedraw();

    return () => {
      store.unregisterSeries(p.group, p.index);
      store.renderer.clearGroupCache(p.group);
      store.scheduleRedraw();
    };
  }, [store, props.group, props.index]);

  // Sync props to store config, skipping when nothing changed.
  // No dependency array: runs every render to catch any prop change via shallow equality check.
  const prevPropsRef = useRef<SeriesProps | null>(null);
  useEffect(() => {
    if (shallowEqual(prevPropsRef.current, props)) return;
    prevPropsRef.current = props;

    store.seriesConfigs = store.seriesConfigs.map((s, i) =>
      (s.group === props.group && s.index === props.index)
        ? resolveDefaults(props, i)
        : s,
    );
    store.seriesConfigMap.clear();
    for (const cfg of store.seriesConfigs) {
      store.seriesConfigMap.set(`${cfg.group}:${cfg.index}`, cfg);
    }
    store.renderer.invalidateSeries(props.group, props.index);
    store.scheduleRedraw();
  });

  return null;
}
