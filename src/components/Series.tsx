import { useEffect, useRef } from 'react';
import type { SeriesConfig } from '../types';
import { useChart } from '../hooks/useChart';

export type SeriesProps = SeriesConfig;

/**
 * Renderless component that registers a series config with the chart store.
 * Must be a child of <Chart>.
 *
 * Uses a mount/update split: registers once on mount, replaces config on prop changes.
 */
export function Series(props: SeriesProps): null {
  const store = useChart();
  const registeredRef = useRef(false);
  const propsKey = JSON.stringify(props);

  // Mount effect: register once with identity keys only
  useEffect(() => {
    store.registerSeries({
      ...props,
      show: props.show ?? true,
    });
    registeredRef.current = true;
    store.scheduleRedraw();

    return () => {
      store.unregisterSeries(props.group, props.index);
      registeredRef.current = false;
      store.scheduleRedraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/update split: only re-mount when identity keys change, update effect handles other props
  }, [store, props.group, props.index]);

  // Update effect: replace config when any prop changes
  useEffect(() => {
    if (!registeredRef.current) return;

    store.seriesConfigs = store.seriesConfigs.map(s =>
      (s.group === props.group && s.index === props.index)
        ? { ...props, show: props.show ?? true }
        : s,
    );
    store.renderer.invalidateSeries(props.group, props.index);
    store.scheduleRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- propsKey (JSON.stringify) tracks all prop changes; listing props directly would cause object-identity reruns
  }, [store, props.group, props.index, propsKey]);

  return null;
}
