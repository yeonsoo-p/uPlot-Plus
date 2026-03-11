import { useEffect, useRef } from 'react';
import type { ScaleConfig } from '../types';
import { useChart } from '../hooks/useChart';

export type ScaleProps = ScaleConfig;

/**
 * Renderless component that registers a scale config with the chart store.
 * Must be a child of <Chart>.
 *
 * Uses a mount/update split: registers once on mount, replaces config on prop changes.
 */
export function Scale(props: ScaleProps): null {
  const store = useChart();
  const registeredRef = useRef(false);
  const propsKey = JSON.stringify(props);

  // Mount effect: register once with identity key only
  useEffect(() => {
    store.registerScale({ ...props });
    registeredRef.current = true;
    store.scheduleRedraw();

    return () => {
      store.unregisterScale(props.id);
      registeredRef.current = false;
      store.scheduleRedraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/update split: only re-mount when identity key changes, update effect handles other props
  }, [store, props.id]);

  // Update effect: replace config when any prop changes
  useEffect(() => {
    if (!registeredRef.current) return;

    store.scaleConfigs = store.scaleConfigs.map(s =>
      s.id === props.id ? { ...props } : s,
    );
    store.scaleManager.addScale({ ...props });
    store.scheduleRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- propsKey (JSON.stringify) tracks all prop changes
  }, [store, props.id, propsKey]);

  return null;
}
