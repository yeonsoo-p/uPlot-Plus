import { describe, it, expect } from 'vitest';
import { ScaleManager } from '@/core/ScaleManager';
import { DataStore } from '@/core/DataStore';
import type { ChartData } from '@/types';

describe('auto-ranging pipeline', () => {
  it('full pipeline: data → autoRange → updateWindows → re-range', () => {
    const mgr = new ScaleManager();
    mgr.addScale({ id: 'x' });
    mgr.addScale({ id: 'y' });
    mgr.setGroupXScale(0, 'x');

    const data: ChartData = [
      { x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], series: [[10, 50, 20, 80, 30, 70, 40, 60, 90, 100]] },
    ];

    const ds = new DataStore();
    ds.setData(data);

    // First pass: auto-range x from data
    mgr.autoRangeX(data);
    mgr.autoRange(data, [{ group: 0, index: 0, yScale: 'y' }], ds);

    const xScale = mgr.getScale('x');
    // autoRangeX pads by halfCol (minDelta=1, halfCol=0.5)
    expect(xScale!.min).toBe(-0.5);
    expect(xScale!.max).toBe(9.5);

    // Update windows from x-scale
    ds.updateWindows((gi) => {
      const key = mgr.getGroupXScaleKey(gi);
      return key ? mgr.getScale(key) : undefined;
    });

    // Second pass: y-range should reflect windowed data
    mgr.autoRange(data, [{ group: 0, index: 0, yScale: 'y' }], ds);

    const yScale = mgr.getScale('y');
    // Auto-range with 10% padding: data [10, 100], delta=90, base=10, incr=1
    // min = incrRoundDn(10-9, 1) = 1, max = incrRoundUp(100+9, 1) = 109
    expect(yScale!.min).toBe(1);
    expect(yScale!.max).toBe(109);
  });

  it('zoom narrows y-range to windowed data', () => {
    const mgr = new ScaleManager();
    mgr.addScale({ id: 'x' });
    mgr.addScale({ id: 'y' });
    mgr.setGroupXScale(0, 'x');

    // First half has values [10, 20, 30], second half has [1000, 2000, 3000]
    const data: ChartData = [
      { x: [0, 1, 2, 3, 4, 5], series: [[10, 20, 30, 1000, 2000, 3000]] },
    ];

    const ds = new DataStore();
    ds.setData(data);

    // Auto-range x (full), then y
    mgr.autoRangeX(data);
    mgr.autoRange(data, [{ group: 0, index: 0, yScale: 'y' }], ds);
    ds.updateWindows(gi => {
      const key = mgr.getGroupXScaleKey(gi);
      return key ? mgr.getScale(key) : undefined;
    });

    // Now simulate zoom to first half only
    mgr.setRange('x', 0, 2);
    ds.updateWindows(gi => {
      const key = mgr.getGroupXScaleKey(gi);
      return key ? mgr.getScale(key) : undefined;
    });

    // Re-range y with zoomed window
    mgr.autoRange(data, [{ group: 0, index: 0, yScale: 'y' }], ds);

    const yScale = mgr.getScale('y');
    // y-range should reflect only the first half's data (10-30), not 3000
    // Auto-range with 10% padding: data [10, 30], delta=20, base=10, incr=1
    // min = incrRoundDn(10-2, 1) = 8, max = incrRoundUp(30+2, 1) = 32
    expect(yScale!.min).toBe(8);
    expect(yScale!.max).toBe(32);
  });
});
