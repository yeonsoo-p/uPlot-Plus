import { describe, it, expect } from 'vitest';
import { createChartStore, rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';

function setup(): ChartStore {
  return createChartStore();
}

describe('rebuildSnapshot', () => {
  it('returns initial EMPTY_SNAPSHOT before first rebuild', () => {
    const store = setup();
    expect(store.snapshot.left).toBe(-10);
    expect(store.snapshot.activeGroup).toBe(-1);
    expect(store.snapshot.plotWidth).toBe(0);
    expect(store.snapshot.seriesCount).toBe(0);
    expect(store.snapshot.revision).toBe(-1);
  });

  it('creates a new snapshot when cursor state changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    // Mutate cursor state
    store.cursorManager.state.left = 50;
    store.cursorManager.state.top = 100;
    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).not.toBe(snap1);
    expect(snap2.left).toBe(50);
    expect(snap2.top).toBe(100);
  });

  it('returns the same reference when nothing changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).toBe(snap1);
  });

  it('creates a new snapshot when plotBox changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    store.plotBox = { left: 10, top: 20, width: 400, height: 300 };
    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).not.toBe(snap1);
    expect(snap2.plotLeft).toBe(10);
    expect(snap2.plotTop).toBe(20);
    expect(snap2.plotWidth).toBe(400);
    expect(snap2.plotHeight).toBe(300);
  });

  it('creates a new snapshot when seriesCount changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    store.registerSeries({ group: 0, index: 0, yScale: 'y', show: true });
    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).not.toBe(snap1);
    expect(snap2.seriesCount).toBe(1);
  });

  it('creates a new snapshot when revision changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    store.revision++;
    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).not.toBe(snap1);
    expect(snap2.revision).toBe(1);
  });

  it('creates a new snapshot when activeDataIdx changes', () => {
    const store = setup();
    rebuildSnapshot(store);
    const snap1 = store.snapshot;

    store.cursorManager.state.activeDataIdx = 5;
    store.cursorManager.state.activeGroup = 0;
    rebuildSnapshot(store);
    const snap2 = store.snapshot;

    expect(snap2).not.toBe(snap1);
    expect(snap2.activeDataIdx).toBe(5);
    expect(snap2.activeGroup).toBe(0);
  });
});
