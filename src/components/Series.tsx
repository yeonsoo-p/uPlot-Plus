import { useEffect, useRef } from 'react';
import type { SeriesConfig } from '../types';
import { useChart } from '../hooks/useChart';
import { shallowEqual } from '../utils/shallowEqual';

export type SeriesProps = SeriesConfig;

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
    store.registerSeries({ ...p, show: p.show ?? true });
    store.renderer.clearCache();
    store.scheduleRedraw();

    return () => {
      store.unregisterSeries(p.group, p.index);
      store.renderer.clearCache();
      store.scheduleRedraw();
    };
  }, [store, props.group, props.index]);

  // Sync props to store config, skipping when nothing changed.
  // No dependency array: runs every render to catch any prop change via shallow equality check.
  const prevPropsRef = useRef<SeriesProps | null>(null);
  useEffect(() => {
    if (shallowEqual(prevPropsRef.current, props)) return;
    prevPropsRef.current = props;

    store.seriesConfigs = store.seriesConfigs.map(s =>
      (s.group === props.group && s.index === props.index)
        ? { ...props, show: props.show ?? true }
        : s,
    );
    store.renderer.invalidateSeries(props.group, props.index);
    store.scheduleRedraw();
  });

  return null;
}
