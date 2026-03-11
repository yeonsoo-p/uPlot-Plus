import { useEffect } from 'react';
import type { ScaleConfig } from '../types';
import { useChart } from '../hooks/useChart';

export type ScaleProps = ScaleConfig;

/**
 * Renderless component that registers a scale config with the chart store.
 * Must be a child of <Chart>.
 */
export function Scale(props: ScaleProps): null {
  const store = useChart();

  useEffect(() => {
    store.registerScale(props);
    store.scheduleRedraw();

    return () => {
      store.unregisterScale(props.id);
      store.scheduleRedraw();
    };
  }, [store, props.id, props.time, props.auto, props.distr, props.min, props.max, props.dir, props.ori, props.range]);

  return null;
}
