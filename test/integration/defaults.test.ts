import { describe, it, expect } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';
import type { ChartData } from '@/types';
import { Side } from '@/types';

/** Set up a store with data and a canvas so redraw() can run. */
function setupStore(data: ChartData) {
  const store = createChartStore();
  const canvas = document.createElement('canvas');
  store.canvas = canvas;
  store.pxRatio = 1;
  store.setSize(800, 400);
  store.dataStore.setData(data);
  return store;
}

const singleSeries: ChartData = [
  { x: new Float64Array([1, 2, 3]), series: [new Float64Array([10, 20, 30])] },
];

describe('store-level defaults', () => {
  it('auto-creates x-scale, y-scale, and both axes when no children provided', () => {
    const store = setupStore(singleSeries);
    store.redraw();

    expect(store.scaleManager.getScale('x')).toBeDefined();
    expect(store.scaleManager.getScale('y')).toBeDefined();
    // fillSeries() injects one default config for the single (0,0) data slot
    expect(store.seriesConfigs).toHaveLength(1);
    expect(store.seriesConfigs[0]?._source).toBe('fill');
    expect(store.axisConfigs).toHaveLength(2);
    expect(store.axisConfigs[0]).toMatchObject({ scale: 'x', side: Side.Bottom, show: true, label: 'X Axis' });
    expect(store.axisConfigs[1]).toMatchObject({ scale: 'y', side: Side.Left, show: true, label: 'Y Axis' });
  });

  it('uses xlabel/ylabel from store for default axis labels', () => {
    const store = setupStore(singleSeries);
    store.xlabel = 'Time (s)';
    store.ylabel = 'Voltage';
    store.redraw();

    expect(store.axisConfigs[0]).toMatchObject({ label: 'Time (s)' });
    expect(store.axisConfigs[1]).toMatchObject({ label: 'Voltage' });
  });

  it('does not inject y-scale when user provides one', () => {
    const store = setupStore(singleSeries);
    store.registerScale({ id: 'y', auto: true });
    store.redraw();

    const yScales = store.scaleConfigs.filter(s => s.id === 'y');
    expect(yScales).toHaveLength(1);
  });

  it('creates default y-axis even when user provides custom x-axis', () => {
    const store = setupStore(singleSeries);
    // User provides only a custom x-axis
    store.axisConfigs.push({ scale: 'x', side: Side.Bottom, show: true, label: 'Custom X' });
    store.redraw();

    // x-axis: user's custom one
    expect(store.axisConfigs[0]).toMatchObject({ scale: 'x', label: 'Custom X' });
    // y-axis: auto-created default
    expect(store.axisConfigs).toHaveLength(2);
    expect(store.axisConfigs[1]).toMatchObject({ scale: 'y', side: Side.Left, show: true, label: 'Y Axis' });
  });

  it('creates default x-axis even when user provides custom y-axis', () => {
    const store = setupStore(singleSeries);
    store.axisConfigs.push({ scale: 'y', side: Side.Left, show: true, label: 'Custom Y' });
    store.redraw();

    // x-axis: auto-created default
    expect(store.axisConfigs.some(a => a.scale === 'x')).toBe(true);
    // y-axis: user's custom one
    expect(store.axisConfigs.some(a => a.label === 'Custom Y')).toBe(true);
    expect(store.axisConfigs).toHaveLength(2);
  });

  it('uses ylabel prop when user provides custom x-axis', () => {
    const store = setupStore(singleSeries);
    store.ylabel = 'Revenue';
    store.axisConfigs.push({ scale: 'x', side: Side.Bottom, show: true, label: 'Month' });
    store.redraw();

    const yAxis = store.axisConfigs.find(a => a.scale !== 'x');
    expect(yAxis).toMatchObject({ label: 'Revenue' });
  });

  it('does not inject anything when user provides all children', () => {
    const store = setupStore(singleSeries);
    store.registerScale({ id: 'x', auto: true });
    store.registerScale({ id: 'y', auto: true });
    store.registerSeries({ group: 0, index: 0, yScale: 'y', show: true });
    store.axisConfigs.push(
      { scale: 'x', side: Side.Bottom, show: true },
      { scale: 'y', side: Side.Left, show: true },
    );
    store.redraw();

    expect(store.scaleConfigs.filter(s => s.id === 'y')).toHaveLength(1);
    expect(store.seriesConfigs).toHaveLength(1);
    expect(store.axisConfigs).toHaveLength(2);
  });
});
