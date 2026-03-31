import { useEffect, useRef } from 'react';
import { useStore } from './useChart';
import { shallowEqual } from '../utils/shallowEqual';
import type { ChartStore } from './useChartStore';

/**
 * Shared hook for config-registration components (Scale, Series, Axis).
 *
 * Handles the dual-effect pattern:
 * 1. Mount effect: register config on mount, unregister on unmount (keyed by identity deps)
 * 2. Sync effect: shallow-equal check every render, update store if props changed
 *
 * @param config - The resolved config object to register
 * @param identityDeps - React dependency array for mount/unmount (e.g. [id] or [group, index])
 * @param register - Called on mount to register the config
 * @param unregister - Called on unmount to remove the config
 * @param sync - Called when props change (after shallow-equal check) to update the store
 */
export function useRegisterConfig<T extends object>(
  config: T,
  identityDeps: unknown[],
  register: (store: ChartStore, cfg: T) => void,
  unregister: (store: ChartStore, cfg: T) => void,
  sync: (store: ChartStore, cfg: T) => void,
): void {
  const store = useStore();
  const configRef = useRef(config);
  configRef.current = config;

  // Mount/unmount: register on mount, unregister on unmount or identity change.
  useEffect(() => {
    const cfg = configRef.current;
    register(store, cfg);
    store.scheduleRedraw();

    return () => {
      unregister(store, cfg);
      store.scheduleRedraw();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identityDeps are the stable identity keys
  }, [store, ...identityDeps]);

  // Sync: runs every render, bails out via shallow-equal check.
  const prevRef = useRef<T | null>(null);
  useEffect(() => {
    if (shallowEqual(prevRef.current, config)) return;
    prevRef.current = config;
    sync(store, config);
    store.scheduleRedraw();
  });
}
