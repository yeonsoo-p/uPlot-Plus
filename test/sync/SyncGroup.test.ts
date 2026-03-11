import { describe, it, expect, beforeEach } from 'vitest';
import { getSyncGroup, SyncGroup } from '@/sync/SyncGroup';
import { createChartStore } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';
import { Orientation, Direction } from '@/types';

function makeStoreWithData(xValues: number[]): ChartStore {
  const store = createChartStore();
  store.width = 400;
  store.height = 300;
  store.plotBox = { left: 10, top: 10, width: 380, height: 280 };

  store.dataStore.setData([{ x: xValues, series: [[...xValues.map(x => x * 2)]] }]);
  store.registerScale({ id: 'x', ori: Orientation.Horizontal, dir: Direction.Forward, auto: true });
  store.scaleManager.setGroupXScale(0, 'x');

  // Set scale range
  const xScale = store.scaleManager.getScale('x');
  if (xScale) {
    xScale.min = xValues[0] ?? 0;
    xScale.max = xValues[xValues.length - 1] ?? 10;
  }

  store.dataStore.updateWindows((gi) => {
    const key = store.scaleManager.getGroupXScaleKey(gi);
    return key != null ? store.scaleManager.getScale(key) : undefined;
  });

  return store;
}

describe('SyncGroup', () => {
  beforeEach(() => {
    // Clear any lingering groups between tests
    // getSyncGroup creates on demand, so we just use fresh keys
  });

  it('getSyncGroup returns the same instance for the same key', () => {
    const g1 = getSyncGroup('test-same-key');
    const g2 = getSyncGroup('test-same-key');
    expect(g1).toBe(g2);
  });

  it('getSyncGroup returns different instances for different keys', () => {
    const g1 = getSyncGroup('key-a');
    const g2 = getSyncGroup('key-b');
    expect(g1).not.toBe(g2);
  });

  it('join/leave manages members correctly', () => {
    const group = getSyncGroup('join-leave-test');
    const store1 = createChartStore();
    const store2 = createChartStore();

    group.join(store1);
    group.join(store2);
    group.leave(store1);
    // Should not throw
    group.leave(store2);
  });

  it('pub syncs cursor to other members', () => {
    const group = getSyncGroup('pub-test');
    const source = makeStoreWithData([0, 1, 2, 3, 4]);
    const target = makeStoreWithData([0, 1, 2, 3, 4]);

    group.join(source);
    group.join(target);

    // Set cursor on source chart at data index 2
    source.cursorManager.state.activeGroup = 0;
    source.cursorManager.state.activeDataIdx = 2;

    group.pub(source);

    // Target cursor should now be active
    expect(target.cursorManager.state.activeGroup).toBe(0);
    expect(target.cursorManager.state.activeDataIdx).toBe(2);

    group.leave(source);
    group.leave(target);
  });

  it('pub hides cursor on targets when source cursor is inactive', () => {
    const group = getSyncGroup('hide-test');
    const source = makeStoreWithData([0, 1, 2, 3, 4]);
    const target = makeStoreWithData([0, 1, 2, 3, 4]);

    group.join(source);
    group.join(target);

    // First, sync a position
    source.cursorManager.state.activeGroup = 0;
    source.cursorManager.state.activeDataIdx = 2;
    group.pub(source);

    // Now hide the source cursor
    source.cursorManager.hide();
    group.pub(source);

    expect(target.cursorManager.state.activeGroup).toBe(-1);
    expect(target.cursorManager.state.activeDataIdx).toBe(-1);

    group.leave(source);
    group.leave(target);
  });

  it('pub does not affect the source chart', () => {
    const group = getSyncGroup('no-self-test');
    const source = makeStoreWithData([0, 1, 2, 3, 4]);

    group.join(source);

    source.cursorManager.state.activeGroup = 0;
    source.cursorManager.state.activeDataIdx = 3;
    source.cursorManager.state.left = 42;

    group.pub(source);

    // Source should be unchanged
    expect(source.cursorManager.state.left).toBe(42);
    expect(source.cursorManager.state.activeDataIdx).toBe(3);

    group.leave(source);
  });

  it('prevents feedback loops — synced-to stores are blocked from echoing', () => {
    const group = getSyncGroup('loop-test');
    const store1 = makeStoreWithData([0, 1, 2, 3, 4]);
    const store2 = makeStoreWithData([0, 1, 2, 3, 4]);

    group.join(store1);
    group.join(store2);

    // store1 publishes cursor at index 2
    store1.cursorManager.state.activeGroup = 0;
    store1.cursorManager.state.activeDataIdx = 2;
    group.pub(store1);

    // store2 was synced-to, so its next pub should be blocked
    store2.cursorManager.state.activeGroup = 0;
    store2.cursorManager.state.activeDataIdx = 2;
    const store1CursorBefore = store1.cursorManager.state.activeDataIdx;
    group.pub(store2);
    // store1 should NOT have been re-synced (the echo was blocked)
    expect(store1.cursorManager.state.activeDataIdx).toBe(store1CursorBefore);

    // But a fresh pub from store2 (after the block is consumed) should work
    store2.cursorManager.state.activeDataIdx = 4;
    group.pub(store2);
    expect(store1.cursorManager.state.activeDataIdx).toBe(4);

    group.leave(store1);
    group.leave(store2);
  });
});
