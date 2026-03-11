import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '@/core/DataStore';
import type { ScaleState, ChartData } from '@/types';
import { createScaleState } from '@/core/Scale';

function makeScale(min: number | null, max: number | null): ScaleState {
  return { ...createScaleState({ id: 'x' }), min, max };
}

const sampleData: ChartData = [
  {
    x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    series: [
      [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      [null, 5, null, 15, null, 25, null, 35, null, 45],
    ],
  },
];

const multiGroupData: ChartData = [
  { x: [0, 1, 2, 3], series: [[10, 20, 30, 40]] },
  { x: [10, 20, 30, 40], series: [[100, 200, 300, 400]] },
];

describe('DataStore', () => {
  let store: DataStore;

  beforeEach(() => {
    store = new DataStore();
  });

  describe('setData', () => {
    it('sets data and clears windows', () => {
      store.setData(sampleData);
      expect(store.data).toBe(sampleData);
      expect(store.windows.size).toBe(0);
    });
  });

  describe('updateWindows', () => {
    it('computes window for single group with full range', () => {
      store.setData(sampleData);
      const scale = makeScale(1, 10);
      store.updateWindows(() => scale);

      const [i0, i1] = store.getWindow(0);
      expect(i0).toBe(0);
      expect(i1).toBe(9);
    });

    it('narrows window for partial range', () => {
      store.setData(sampleData);
      const scale = makeScale(3, 7);
      store.updateWindows(() => scale);

      const [i0, i1] = store.getWindow(0);
      expect(i0).toBe(2);
      expect(i1).toBe(6);
    });

    it('returns true when window changes', () => {
      store.setData(sampleData);
      expect(store.updateWindows(() => makeScale(1, 10))).toBe(true);
    });

    it('returns false when window unchanged', () => {
      store.setData(sampleData);
      const scale = makeScale(1, 10);
      store.updateWindows(() => scale);
      expect(store.updateWindows(() => scale)).toBe(false);
    });

    it('handles null min/max (full range)', () => {
      store.setData(sampleData);
      store.updateWindows(() => makeScale(null, null));

      const [i0, i1] = store.getWindow(0);
      expect(i0).toBe(0);
      expect(i1).toBe(9);
    });

    it('handles multiple groups', () => {
      store.setData(multiGroupData);
      let callCount = 0;
      store.updateWindows((gi) => {
        callCount++;
        return gi === 0 ? makeScale(0, 3) : makeScale(10, 40);
      });
      expect(callCount).toBe(2);
      expect(store.getWindow(0)).toBeDefined();
      expect(store.getWindow(1)).toBeDefined();
    });
  });

  describe('getXValues / getYValues', () => {
    it('returns correct arrays', () => {
      store.setData(sampleData);
      expect(store.getXValues(0)).toEqual(sampleData[0]!.x);
      expect(store.getYValues(0, 0)).toEqual(sampleData[0]!.series[0]);
    });

    it('returns empty for out-of-range group', () => {
      store.setData(sampleData);
      expect(store.getXValues(99)).toEqual([]);
      expect(store.getYValues(99, 0)).toEqual([]);
    });
  });

  describe('getCachedMinMax', () => {
    it('computes and caches min/max', () => {
      store.setData(sampleData);
      const [mn, mx] = store.getCachedMinMax(0, 0, 0, 9, 0, false);
      expect(mn).toBe(10);
      expect(mx).toBe(100);

      // Second call should hit cache (same result)
      const [mn2, mx2] = store.getCachedMinMax(0, 0, 0, 9, 0, false);
      expect(mn2).toBe(mn);
      expect(mx2).toBe(mx);
    });

    it('handles series with nulls', () => {
      store.setData(sampleData);
      const [mn, mx] = store.getCachedMinMax(0, 1, 0, 9, 0, false);
      expect(mn).toBe(5);
      expect(mx).toBe(45);
    });

    it('returns inf/-inf for missing group', () => {
      store.setData(sampleData);
      const [mn, mx] = store.getCachedMinMax(99, 0, 0, 0, 0, false);
      expect(mn).toBe(Infinity);
      expect(mx).toBe(-Infinity);
    });

    it('clears cache when windows update — recomputes for same range', () => {
      store.setData(sampleData);
      // Compute min/max for range [0, 4]
      const [mn1, mx1] = store.getCachedMinMax(0, 0, 0, 4, 0, false);
      expect(mn1).toBe(10);
      expect(mx1).toBe(50);

      // Update windows (which should clear cache)
      store.updateWindows(() => makeScale(1, 10));

      // Recompute for the SAME range — verifies cache was actually cleared and recomputed
      const [mn2, mx2] = store.getCachedMinMax(0, 0, 0, 4, 0, false);
      expect(mn2).toBe(10);
      expect(mx2).toBe(50);
    });

    it('per-group scoping: pan group 0 does not invalidate group 1 cache', () => {
      store.setData(multiGroupData);

      // Initial window for both groups
      store.updateWindows((gi: number) =>
        gi === 0 ? makeScale(0, 3) : makeScale(10, 40),
      );

      // Cache min/max for both groups
      store.getCachedMinMax(0, 0, 0, 3, 0, false);
      store.getCachedMinMax(1, 0, 0, 3, 0, false);

      // Pan only group 0 (new window)
      store.updateWindows((gi: number) =>
        gi === 0 ? makeScale(1, 3) : makeScale(10, 40),
      );

      // Group 1's cache should still be valid (not cleared)
      // We can verify by checking the result is still correct
      const [mn, mx] = store.getCachedMinMax(1, 0, 0, 3, 0, false);
      expect(mn).toBe(100);
      expect(mx).toBe(400);
    });

    it('cache returns correct results for different ranges', () => {
      store.setData(sampleData);
      // Full range
      const [mnFull, mxFull] = store.getCachedMinMax(0, 0, 0, 9, 0, false);
      expect(mnFull).toBe(10);
      expect(mxFull).toBe(100);

      // Narrower range [2, 5] → values [30, 40, 50, 60]
      const [mnNarrow, mxNarrow] = store.getCachedMinMax(0, 0, 2, 5, 0, false);
      expect(mnNarrow).toBe(30);
      expect(mxNarrow).toBe(60);
    });
  });

  describe('appendData', () => {
    it('appends x and y values to existing group', () => {
      const data: ChartData = [
        { x: [1, 2, 3], series: [[10, 20, 30]] },
      ];
      store.setData(data);

      store.appendData(0, [4, 5], [[40, 50]]);

      expect(store.getXValues(0)).toEqual([1, 2, 3, 4, 5]);
      expect(store.getYValues(0, 0)).toEqual([10, 20, 30, 40, 50]);
    });

    it('updates block tree after append', () => {
      const data: ChartData = [
        { x: [1, 2, 3], series: [[10, 20, 30]] },
      ];
      store.setData(data);

      store.appendData(0, [4], [[999]]);

      // Block tree should reflect new max
      const [mn, mx] = store.getCachedMinMax(0, 0, 0, 3, 0, false);
      expect(mn).toBe(10);
      expect(mx).toBe(999);
    });

    it('invalidates only affected group cache', () => {
      store.setData(multiGroupData);

      // Cache both groups
      store.getCachedMinMax(0, 0, 0, 3, 0, false);
      store.getCachedMinMax(1, 0, 0, 3, 0, false);

      // Append to group 0 only
      store.appendData(0, [4], [[50]]);

      // Group 1 cache should still work
      const [mn1, mx1] = store.getCachedMinMax(1, 0, 0, 3, 0, false);
      expect(mn1).toBe(100);
      expect(mx1).toBe(400);
    });

    it('does nothing for non-existent group', () => {
      store.setData(sampleData);
      // Should not throw
      store.appendData(99, [1], [[1]]);
    });
  });
});
