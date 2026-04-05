import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects } from '../helpers/rtl';
import { useStore } from '@/hooks/useChart';
import { useSyncGroup } from '@/sync/useSyncGroup';
import { getSyncGroup, SyncGroup } from '@/sync/SyncGroup';
import { Series } from '@/components/Series';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';
import type { DataInput } from '@/types/data';

const testData: DataInput = [
  { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90]] },
];

/** Component that calls useSyncGroup with the chart's store */
function SyncProbe({ syncKey }: { syncKey: string | undefined }) {
  const store = useStore();
  useSyncGroup(store, syncKey);
  return null;
}

/** Component that captures the ChartStore from context */
function StoreCapture({ storeRef }: { storeRef: { current: ChartStore | null } }) {
  storeRef.current = useStore();
  return null;
}

describe('useSyncGroup hook', () => {
  const spies: ReturnType<typeof vi.spyOn>[] = [];

  afterEach(() => {
    for (const s of spies) s.mockRestore();
    spies.length = 0;
  });

  it('calls group.join(store) on mount', async () => {
    const joinSpy = vi.spyOn(SyncGroup.prototype, 'join');
    spies.push(joinSpy);

    const storeRef: { current: ChartStore | null } = { current: null };

    renderChart(
      { data: testData },
      <>
        <Series group={0} index={0} stroke="red" />
        <StoreCapture storeRef={storeRef} />
        <SyncProbe syncKey="test-join" />
      </>,
    );
    await flushEffects();

    expect(joinSpy).toHaveBeenCalledTimes(1);
    expect(joinSpy).toHaveBeenCalledWith(storeRef.current);
  });

  it('calls group.leave(store) on unmount', async () => {
    const joinSpy = vi.spyOn(SyncGroup.prototype, 'join');
    const leaveSpy = vi.spyOn(SyncGroup.prototype, 'leave');
    spies.push(joinSpy, leaveSpy);

    const storeRef: { current: ChartStore | null } = { current: null };

    const { unmount } = renderChart(
      { data: testData },
      <>
        <Series group={0} index={0} stroke="red" />
        <StoreCapture storeRef={storeRef} />
        <SyncProbe syncKey="test-leave" />
      </>,
    );
    await flushEffects();

    // Not yet unmounted — leave must not have fired
    expect(leaveSpy).not.toHaveBeenCalled();

    unmount();

    expect(leaveSpy).toHaveBeenCalledTimes(1);
    expect(leaveSpy).toHaveBeenCalledWith(storeRef.current);
  });

  it('does not call join when syncKey is undefined', async () => {
    const joinSpy = vi.spyOn(SyncGroup.prototype, 'join');
    spies.push(joinSpy);

    renderChart(
      { data: testData },
      <>
        <Series group={0} index={0} stroke="red" />
        <SyncProbe syncKey={undefined} />
      </>,
    );
    await flushEffects();

    expect(joinSpy).not.toHaveBeenCalled();
  });

  it('publishes cursor changes to the sync group', async () => {
    const { store } = renderChart(
      { data: testData },
      <>
        <Series group={0} index={0} stroke="red" />
        <SyncProbe syncKey="test-pub" />
      </>,
    );
    await flushEffects();

    const group = getSyncGroup('test-pub');
    const pubSpy = vi.spyOn(group, 'pub');

    // Simulate cursor change
    act(() => {
      store.cursorManager.state.activeGroup = 0;
      store.cursorManager.state.activeDataIdx = 2;
      store.cursorManager.state.left = 100;
      store.cursorManager.state.top = 100;
      rebuildSnapshot(store);
      for (const fn of store.cursorListeners) fn();
    });

    expect(pubSpy).toHaveBeenCalledWith(store);
    pubSpy.mockRestore();
  });

  it('does not republish when cursor state is unchanged', async () => {
    const { store } = renderChart(
      { data: testData },
      <>
        <Series group={0} index={0} stroke="red" />
        <SyncProbe syncKey="test-dedup" />
      </>,
    );
    await flushEffects();

    const group = getSyncGroup('test-dedup');
    const pubSpy = vi.spyOn(group, 'pub');

    // First cursor change
    act(() => {
      store.cursorManager.state.activeGroup = 0;
      store.cursorManager.state.activeDataIdx = 2;
      rebuildSnapshot(store);
      for (const fn of store.cursorListeners) fn();
    });

    const callCount = pubSpy.mock.calls.length;

    // Fire listeners again without changing state
    act(() => {
      for (const fn of store.cursorListeners) fn();
    });

    // Should not publish again (dedup)
    expect(pubSpy.mock.calls.length).toBe(callCount);
    pubSpy.mockRestore();
  });
});
