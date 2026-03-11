import { useEffect, useRef } from 'react';
import type { AxisConfig } from '../types';
import { useChart } from '../hooks/useChart';

export type AxisProps = AxisConfig;

/**
 * Renderless component that registers an axis config with the chart store.
 * Must be a child of <Chart>.
 *
 * Uses a mount/update split: registers once on mount, replaces config on prop changes.
 */
export function Axis(props: AxisProps): null {
  const store = useChart();
  const registeredRef = useRef(false);
  const propsKey = JSON.stringify(props);

  // Mount effect: register once with identity keys only
  useEffect(() => {
    store.axisConfigs = store.axisConfigs.filter(
      a => !(a.scale === props.scale && a.side === props.side),
    );
    store.axisConfigs.push({ ...props, show: props.show ?? true });
    registeredRef.current = true;
    store.scheduleRedraw();

    return () => {
      store.axisConfigs = store.axisConfigs.filter(
        a => !(a.scale === props.scale && a.side === props.side),
      );
      registeredRef.current = false;
      store.scheduleRedraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/update split: only re-mount when identity keys change, update effect handles other props
  }, [store, props.scale, props.side]);

  // Update effect: replace config when any prop changes
  useEffect(() => {
    if (!registeredRef.current) return;

    store.axisConfigs = store.axisConfigs.map(a =>
      (a.scale === props.scale && a.side === props.side)
        ? { ...props, show: props.show ?? true }
        : a,
    );
    store.scheduleRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- propsKey (JSON.stringify) tracks all prop changes
  }, [store, props.scale, props.side, propsKey]);

  return null;
}
