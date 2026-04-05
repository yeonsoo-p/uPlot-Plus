import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChartStore, type ChartStore } from '@/hooks/useChartStore';
import { setupInteraction } from '@/hooks/useInteraction';
import { Side } from '@/types/common';

/**
 * Integration tests for Y-axis drag interactions.
 *
 * Dragging in the y-axis gutter pans the y-scale (shifts min and max
 * by the same delta while preserving range width).
 */

interface TestHarness {
  store: ChartStore;
  el: HTMLDivElement;
  cleanup: () => void;
}

function setup(): TestHarness {
  const store = createChartStore();
  const el = document.createElement('div');
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);
  document.body.appendChild(el);

  store.pxRatio = 1;
  store.width = 800;
  store.height = 600;
  store.plotBox = { left: 50, top: 20, width: 700, height: 560 };

  store.scaleManager.addScale({ id: 'x', min: 0, max: 100 });
  store.scaleManager.addScale({ id: 'y', min: 0, max: 100 });
  store.scaleManager.setGroupXScale(0, 'x');

  store.registerSeries({ group: 0, index: 0, yScale: 'y', stroke: 'red', show: true });
  store.dataStore.setData([{
    x: [0, 25, 50, 75, 100],
    series: [[10, 40, 70, 30, 90]],
  }]);
  store.dataStore.updateWindows((gi) => {
    const key = store.scaleManager.getGroupXScaleKey(gi);
    return key != null ? store.scaleManager.getScale(key) : undefined;
  });

  // Register a left y-axis so hitTestAxis can find it
  store.axisStates = [{
    config: { scale: 'y', side: Side.Left, show: true },
    _show: true,
    _size: 50, // 50px wide axis gutter
    _pos: 0,
    _lpos: 0,
    _splits: [],
    _values: [],
    _incr: 10,
    _space: 50,
    _rotate: 0,
  }];

  store.scaleConfigs = [
    { id: 'x', min: 0, max: 100 },
    { id: 'y', min: 0, max: 100 },
  ];

  el.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, x: 0, y: 0, toJSON() { return ''; },
  });

  const removeListeners = setupInteraction(store, el);

  return {
    store, el,
    cleanup() {
      removeListeners();
      document.body.removeChild(el);
    },
  };
}

function mouseEvent(type: string, clientX: number, clientY: number, opts?: Partial<MouseEventInit>): MouseEvent {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, button: 0, ...opts });
}

describe('Interaction: y-axis drag', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('dragging in left axis gutter pans y-scale', () => {
    const plotBox = h.store.plotBox;
    // Click in left axis gutter (x < plotBox.left, y within plot)
    const axisX = 25; // middle of the 50px axis gutter
    const startY = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', axisX, startY));

    // Drag downward by 56px (10% of plot height)
    const endY = startY + 56;
    h.el.dispatchEvent(mouseEvent('mousemove', axisX, endY));

    const yScale = h.store.scaleManager.getScale('y');
    expect(yScale).toBeDefined();

    // Dragging down should shift y-scale: both min and max should increase
    // by deltaFrac * range = (56/560) * 100 = 10
    expect(yScale!.min).toBeCloseTo(10, 0);
    expect(yScale!.max).toBeCloseTo(110, 0);
  });

  it('y-axis drag preserves range width', () => {
    const plotBox = h.store.plotBox;
    const axisX = 25;
    const startY = plotBox.top + plotBox.height / 2;

    const yScale = h.store.scaleManager.getScale('y')!;
    const originalRange = yScale.max! - yScale.min!;

    h.el.dispatchEvent(mouseEvent('mousedown', axisX, startY));
    h.el.dispatchEvent(mouseEvent('mousemove', axisX, startY + 100));

    // Range should be preserved (pan, not zoom)
    expect(yScale.max! - yScale.min!).toBeCloseTo(originalRange, 5);
  });

  it('y-axis drag sets scale.auto = false', () => {
    const plotBox = h.store.plotBox;
    const axisX = 25;
    const startY = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', axisX, startY));
    h.el.dispatchEvent(mouseEvent('mousemove', axisX, startY + 50));

    const yScale = h.store.scaleManager.getScale('y')!;
    expect(yScale.auto).toBe(false);
  });

  it('mouseup after axis drag fires onScaleChange', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onScaleChange = cb;

    const plotBox = h.store.plotBox;
    const axisX = 25;
    const startY = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', axisX, startY));
    h.el.dispatchEvent(mouseEvent('mousemove', axisX, startY + 50));
    h.el.dispatchEvent(mouseEvent('mouseup', axisX, startY + 50));

    expect(cb).toHaveBeenCalled();
  });

  it('click in plot area (not axis) does NOT trigger axis drag', () => {
    const plotBox = h.store.plotBox;
    // Click inside the plot area
    const inPlotX = plotBox.left + 100;
    const y = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', inPlotX, y));
    h.el.dispatchEvent(mouseEvent('mousemove', inPlotX, y + 50));

    const yScale = h.store.scaleManager.getScale('y')!;
    // y-scale should be unchanged (drag-to-zoom, not axis drag)
    expect(yScale.min).toBe(0);
    expect(yScale.max).toBe(100);
  });
});
