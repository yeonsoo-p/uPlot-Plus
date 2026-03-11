import { useEffect } from 'react';
import type { ChartStore } from '../hooks/useChartStore';
import { getSyncGroup } from './SyncGroup';

/**
 * Hook that joins a chart to a sync group for cursor synchronization.
 * Charts with the same syncKey will have their cursors linked.
 * Only publishes when cursor state actually changes to prevent infinite loops.
 */
export function useSyncGroup(store: ChartStore, syncKey: string | undefined): void {
  useEffect(() => {
    if (syncKey == null) return;

    const group = getSyncGroup(syncKey);
    group.join(store);

    // Track last-published state to avoid redundant publishes
    let lastGroup = -1;
    let lastIdx = -1;

    const unsub = store.subscribe(() => {
      const { activeGroup, activeDataIdx } = store.cursorManager.state;
      if (activeGroup === lastGroup && activeDataIdx === lastIdx) return;
      lastGroup = activeGroup;
      lastIdx = activeDataIdx;
      group.pub(store);
    });

    return () => {
      unsub();
      group.leave(store);
    };
  }, [store, syncKey]);
}
