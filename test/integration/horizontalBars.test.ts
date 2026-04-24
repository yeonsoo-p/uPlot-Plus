import { describe, it, expect } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';
import { horizontalBars, bars } from '@/paths/bars';
import type { ChartData, ResolvedSeriesConfig } from '@/types';
import { Orientation, Side } from '@/types';

function setupStore(data: ChartData) {
  const store = createChartStore();
  const canvas = document.createElement('canvas');
  store.canvas = canvas;
  store.pxRatio = 1;
  store.setSize(800, 400);
  store.dataStore.setData(data);
  return store;
}

const data: ChartData = [
  { x: new Float64Array([0, 1, 2, 3]), series: [new Float64Array([10, 40, 30, 80])] },
];

function makeSeries(overrides: Partial<ResolvedSeriesConfig> = {}): ResolvedSeriesConfig {
  return {
    group: 0,
    index: 0,
    yScale: 'y',
    show: true,
    stroke: '#000',
    ...overrides,
  };
}

describe('horizontalBars: scale orientation flip', () => {
  it('flips x-scale to Vertical and y-scale to Horizontal when a horizontalBars series is registered', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    expect(store.scaleManager.getScale('x')?.ori).toBe(Orientation.Vertical);
    expect(store.scaleManager.getScale('y')?.ori).toBe(Orientation.Horizontal);
  });

  it('keeps default orientation (x=Horizontal, y=Vertical) when only normal bars are registered', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: bars() }));
    store.redraw();

    expect(store.scaleManager.getScale('x')?.ori).toBe(Orientation.Horizontal);
    expect(store.scaleManager.getScale('y')?.ori).toBe(Orientation.Vertical);
  });

  it('default x-axis flips from Bottom to Left when transposed', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    const xAxis = store.axisConfigs.find(a => a.scale === 'x');
    const yAxis = store.axisConfigs.find(a => a.scale === 'y');
    expect(xAxis?.side).toBe(Side.Left);
    expect(yAxis?.side).toBe(Side.Bottom);
  });

  it('reverts orientation when the transposed series is unregistered', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();
    expect(store.scaleManager.getScale('x')?.ori).toBe(Orientation.Vertical);

    store.unregisterSeries(0, 0);
    store.redraw();
    expect(store.scaleManager.getScale('x')?.ori).toBe(Orientation.Horizontal);
    expect(store.scaleManager.getScale('y')?.ori).toBe(Orientation.Vertical);
  });

  it('respects user-declared <Scale ori> when no transposed series is active', () => {
    const store = setupStore(data);
    store.registerScale({ id: 'x', auto: true, ori: Orientation.Vertical });
    store.registerSeries(makeSeries({ paths: bars() }));
    store.redraw();

    expect(store.scaleManager.getScale('x')?.ori).toBe(Orientation.Vertical);
  });

  it('warns and uses first orientation when both vertical and horizontal bars share the same scale', () => {
    const store = setupStore(data);
    const warnings: string[] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(String(args[0])); };

    try {
      store.registerSeries(makeSeries({ group: 0, index: 0, paths: bars() }));
      store.registerSeries(makeSeries({ group: 0, index: 1, paths: horizontalBars(), transposed: true }));
      store.redraw();
    } finally {
      console.warn = origWarn;
    }

    expect(warnings.some(w => w.includes('horizontal'))).toBe(true);
  });
});

describe('horizontalBars: orientation flow end-to-end', () => {
  it('does not crash and produces a valid plotBox after redraw with horizontal bars', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    expect(store.plotBox.width).toBeGreaterThan(0);
    expect(store.plotBox.height).toBeGreaterThan(0);
  });

  it('autoranges scales correctly: x covers category range, y covers value range', () => {
    const store = setupStore(data);
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    const xScale = store.scaleManager.getScale('x');
    const yScale = store.scaleManager.getScale('y');
    // x ranges over group.x = [0..3], with half-column padding
    expect(xScale?.min).toBeLessThanOrEqual(0);
    expect(xScale?.max).toBeGreaterThanOrEqual(3);
    // y ranges over series data = [10..80]
    expect(yScale?.min).toBeLessThanOrEqual(10);
    expect(yScale?.max).toBeGreaterThanOrEqual(80);
  });
});

describe('horizontalBars: auto-side axis updates survive orientation flips', () => {
  it('updateAxis preserves the store-derived side after flip (label update applies to flipped axis)', () => {
    const store = setupStore(data);
    // Register an auto-side x-axis (mirrors <Axis scale="x" /> with no side prop)
    store.registerAxis({
      scale: 'x',
      side: Side.Bottom,
      show: true,
      label: 'Time',
      _autoSide: true,
    });
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    // After orientation flip, the stored auto-side x-axis should now be on the Left
    const flipped = store.axisConfigs.find(a => a.scale === 'x' && a._autoSide === true);
    expect(flipped?.side).toBe(Side.Left);

    // React re-renders Axis with a new label prop — resolveAxis resets side back
    // to the default (Bottom), but _autoSide is still true. updateAxis must
    // preserve the store-derived Left side while taking the new label.
    store.updateAxis({
      scale: 'x',
      side: Side.Bottom, // stale default from resolveAxis
      show: true,
      label: 'Category',
      _autoSide: true,
    });

    const afterUpdate = store.axisConfigs.find(a => a.scale === 'x' && a._autoSide === true);
    expect(afterUpdate?.side).toBe(Side.Left);       // preserved
    expect(afterUpdate?.label).toBe('Category');     // label applied
  });

  it('explicit-side axes still dedupe by (scale, side)', () => {
    const store = setupStore(data);
    store.registerAxis({ scale: 'y', side: Side.Left, show: true, _autoSide: false });
    store.registerAxis({ scale: 'y', side: Side.Right, show: true, _autoSide: false });
    expect(store.axisConfigs.filter(a => a.scale === 'y').length).toBe(2);

    // Update the right axis — should not touch the left one
    store.updateAxis({ scale: 'y', side: Side.Right, show: true, label: 'Updated', _autoSide: false });
    const rightAxis = store.axisConfigs.find(a => a.scale === 'y' && a.side === Side.Right);
    const leftAxis = store.axisConfigs.find(a => a.scale === 'y' && a.side === Side.Left);
    expect(rightAxis?.label).toBe('Updated');
    expect(leftAxis?.label).toBeUndefined();
  });

  it('unregisterAxis matches auto-side axes by scale alone even after flip', () => {
    const store = setupStore(data);
    store.registerAxis({ scale: 'x', side: Side.Bottom, show: true, _autoSide: true });
    store.registerSeries(makeSeries({ paths: horizontalBars(), transposed: true }));
    store.redraw();

    // Stored side is now Left, but React's unregister still passes Bottom
    const before = store.axisConfigs.filter(a => a.scale === 'x').length;
    store.unregisterAxis({ scale: 'x', side: Side.Bottom, show: true, _autoSide: true });
    const after = store.axisConfigs.filter(a => a.scale === 'x').length;
    expect(after).toBe(before - 1);
  });
});
