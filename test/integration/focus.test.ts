import { describe, it, expect, vi } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';

describe('Focus mode', () => {
  it('setFocus updates focusedSeries', () => {
    const store = createChartStore();
    expect(store.focusedSeries).toBeNull();

    store.setFocus(2);
    expect(store.focusedSeries).toBe(2);

    store.setFocus(null);
    expect(store.focusedSeries).toBeNull();
  });

  it('setFocus schedules a redraw', () => {
    const store = createChartStore();
    const markSpy = vi.spyOn(store.scheduler, 'mark');

    store.setFocus(0);
    expect(markSpy).toHaveBeenCalled();
  });

  it('toggleSeries flips show flag', () => {
    const store = createChartStore();
    store.registerSeries({ group: 0, index: 1, yScale: 'y', stroke: 'red' });

    store.toggleSeries(0, 1);
    const cfg = store.seriesConfigs.find(s => s.group === 0 && s.index === 1);
    expect(cfg?.show).toBe(false);

    store.toggleSeries(0, 1);
    expect(cfg?.show).toBeUndefined();
  });
});
