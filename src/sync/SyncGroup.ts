import type { ChartStore } from '../hooks/useChartStore';

/** Global registry of sync groups by key. */
const groups = new Map<string, SyncGroup>();

/**
 * Get or create a sync group by key.
 * Charts with the same sync key share cursor position.
 */
export function getSyncGroup(key: string): SyncGroup {
  let group = groups.get(key);
  if (group == null) {
    group = new SyncGroup(key);
    groups.set(key, group);
  }
  return group;
}

/**
 * Pub/sub group for synchronizing cursor position across multiple charts.
 * Charts publish their cursor's x-value, and all other charts in the group
 * move their cursor to match.
 *
 * Two-layer loop prevention:
 * 1. `publishing` flag blocks re-entrant synchronous calls
 * 2. `syncedStores` WeakSet blocks stores that were just synced-to
 *    from echoing back on their next async redraw
 */
export class SyncGroup {
  readonly key: string;
  private members: Set<ChartStore> = new Set();
  private publishing = false;
  private syncedStores = new WeakSet<ChartStore>();

  constructor(key: string) {
    this.key = key;
  }

  /** Add a chart to this sync group. */
  join(store: ChartStore): void {
    this.members.add(store);
  }

  /** Remove a chart from this sync group. Cleans up empty groups. */
  leave(store: ChartStore): void {
    this.members.delete(store);
    if (this.members.size === 0) {
      groups.delete(this.key);
    }
  }

  /**
   * Publish cursor position from one chart to all others in the group.
   * Skips if the source was just synced-to (prevents async echo loops).
   */
  pub(source: ChartStore): void {
    if (this.publishing) return;

    // If this store was just synced-to by another pub(), don't echo back
    if (this.syncedStores.has(source)) {
      this.syncedStores.delete(source);
      return;
    }

    this.publishing = true;

    const cursor = source.cursorManager.state;
    const { activeGroup, activeDataIdx } = cursor;

    // Get the x-value at the cursor position from the source chart
    if (activeGroup < 0 || activeDataIdx < 0) {
      // Cursor left the source — hide on all others
      for (const member of this.members) {
        if (member === source) continue;
        this.syncedStores.add(member);
        member.cursorManager.hide();
        member.scheduleCursorRedraw();
      }
      this.publishing = false;
      return;
    }

    const xData = source.dataStore.getXValues(activeGroup);
    const xVal = xData[activeDataIdx];
    if (xVal == null) {
      this.publishing = false;
      return;
    }

    // Move cursor on all other charts to the same x-value
    for (const member of this.members) {
      if (member === source) continue;
      this.syncedStores.add(member);
      member.cursorManager.syncToValue(xVal, member);
      member.scheduleCursorRedraw();
    }

    this.publishing = false;
  }
}
