import { useCallback, useSyncExternalStore } from 'react';
import { useChart } from './useChart';
import type { ChartSnapshot } from './useChartStore';

/**
 * Subscribe to the chart store's immutable snapshot.
 *
 * @param channel  `'cursor'` (default) fires on both full redraws and cursor-only
 *                 redraws. `'full'` fires only on full redraws.
 */
export function useChartSnapshot(channel: 'cursor' | 'full' = 'cursor'): ChartSnapshot {
  const store = useChart();
  const subscribe = useCallback(
    (cb: () => void) => channel === 'full' ? store.subscribe(cb) : store.subscribeCursor(cb),
    [store, channel],
  );
  const getSnapshot = useCallback(() => store.snapshot, [store]);
  return useSyncExternalStore(subscribe, getSnapshot);
}
