import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createChartStore, type ChartStore } from '@/hooks/useChartStore';
import { setupInteraction } from '@/hooks/useInteraction';
import { Orientation, Side } from '@/types/common';
import type { ChartEventInfo } from '@/types/events';

/**
 * Drag/pinch/wheel/gutter behavior for horizontal-bar charts (transposed mode):
 *   xScale.ori = Vertical    (categories along screen Y)
 *   yScale.ori = Horizontal  (values along screen X)
 *
 * After the axis-role refactor, zoomX/panX always target the X data axis (regardless
 * of which screen direction it currently maps to), and the selection box geometry
 * follows the filtered scales' actual orientation.
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

  // Transposed scales: x is Vertical (screen Y), y is Horizontal (screen X)
  store.scaleManager.addScale({ id: 'x', min: 0, max: 100, ori: Orientation.Vertical });
  store.scaleManager.addScale({ id: 'y', min: 0, max: 100, ori: Orientation.Horizontal });
  store.scaleManager.setGroupXScale(0, 'x');

  store.registerSeries({ group: 0, index: 0, yScale: 'y', stroke: 'red', show: true, transposed: true });
  store.dataStore.setData([{
    x: [0, 25, 50, 75, 100],
    series: [[10, 40, 70, 30, 90]],
  }]);
  store.dataStore.updateWindows((gi) => {
    const key = store.scaleManager.getGroupXScaleKey(gi);
    return key != null ? store.scaleManager.getScale(key) : undefined;
  });

  // For a transposed chart, the x-axis (categories) lives on the LEFT side and
  // the y-axis (values) on the BOTTOM. Wire up axisStates for hitTestAxis.
  store.axisStates = [
    {
      config: { scale: 'x', side: Side.Left, show: true },
      _show: true, _size: 50, _pos: 0, _lpos: 0,
      _splits: [], _values: [], _incr: 10, _space: 50, _rotate: 0,
    },
    {
      config: { scale: 'y', side: Side.Bottom, show: true },
      _show: true, _size: 30, _pos: 0, _lpos: 0,
      _splits: [], _values: [], _incr: 10, _space: 50, _rotate: 0,
    },
  ];

  store.scaleConfigs = [
    { id: 'x', min: 0, max: 100, ori: Orientation.Vertical },
    { id: 'y', min: 0, max: 100, ori: Orientation.Horizontal },
  ];

  el.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, x: 0, y: 0, toJSON() { return ''; },
  });

  const removeListeners = setupInteraction(store, el);

  return {
    store, el,
    cleanup() { removeListeners(); document.body.removeChild(el); },
  };
}

function mouseEvent(type: string, clientX: number, clientY: number): MouseEvent {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, button: 0 });
}

function plotToClient(h: TestHarness, cx: number, cy: number): { clientX: number; clientY: number } {
  return { clientX: cx + h.store.plotBox.left, clientY: cy + h.store.plotBox.top };
}

function touchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>, changedTouches?: Array<{ clientX: number; clientY: number }>): TouchEvent {
  const makeTouchList = (items: Array<{ clientX: number; clientY: number }>): TouchList => {
    const arr = items.map(t => ({
      clientX: t.clientX, clientY: t.clientY,
      identifier: 0, target: null,
      pageX: t.clientX, pageY: t.clientY,
      screenX: t.clientX, screenY: t.clientY,
      radiusX: 0, radiusY: 0, rotationAngle: 0, force: 1,
    }));
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return arr as unknown as TouchList;
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ev = new Event(type, { bubbles: true, cancelable: true }) as unknown as TouchEvent;
  Object.defineProperty(ev, 'touches', { value: makeTouchList(touches) });
  Object.defineProperty(ev, 'changedTouches', { value: makeTouchList(changedTouches ?? touches) });
  Object.defineProperty(ev, 'preventDefault', { value: () => {} });
  return ev;
}

describe('Horizontal bars: drag-to-zoom (default leftDrag → zoomX)', () => {
  let h: TestHarness;
  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('vertical drag narrows the x-scale (categories), leaving y-scale untouched', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const yScale = h.store.scaleManager.getScale('y')!;

    // Plot is 700 wide × 560 tall. Drag from plotY=100 to plotY=400 (a vertical band).
    const start = plotToClient(h, 350, 100);
    const end   = plotToClient(h, 350, 400);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup',   end.clientX, end.clientY));

    expect(xScale.auto).toBe(false);
    expect(xScale.max! - xScale.min!).toBeLessThan(100);
    // Y scale untouched
    expect(yScale.min).toBe(0);
    expect(yScale.max).toBe(100);
  });

  it('horizontal-only drag does not zoom (no extent along the x-scale\'s axis)', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const start = plotToClient(h, 100, 280);
    const end   = plotToClient(h, 400, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup',   end.clientX, end.clientY));

    expect(xScale.min).toBe(0);
    expect(xScale.max).toBe(100);
  });

  it('selection box during drag spans full width and variable height', () => {
    const start = plotToClient(h, 350, 100);
    const mid   = plotToClient(h, 350, 300);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', mid.clientX, mid.clientY));

    expect(h.store.selectState.show).toBe(true);
    expect(h.store.selectState.left).toBe(0);
    expect(h.store.selectState.width).toBe(h.store.plotBox.width);
    // Height should be the actual drag extent (~200px)
    expect(h.store.selectState.height).toBeCloseTo(200, 0);

    h.el.dispatchEvent(mouseEvent('mouseup', mid.clientX, mid.clientY));
  });
});

describe('Horizontal bars: cursor event coordinates', () => {
  let h: TestHarness;
  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('reports nearest-point pixels using transposed scale orientation', () => {
    const cb = vi.fn<(info: ChartEventInfo) => void>();
    h.store.eventCallbacks.onCursorMove = cb;

    const { clientX, clientY } = plotToClient(h, 490, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    expect(cb).toHaveBeenCalledTimes(1);
    const point = cb.mock.calls[0]![0].point;
    expect(point).not.toBeNull();
    expect(point!.dataIdx).toBe(2);
    expect(point!.pxX).toBeCloseTo(490, 0);
    expect(point!.pxY).toBeCloseTo(280, 0);
    expect(point!.dist).toBeCloseTo(0, 6);
  });
});

describe('Horizontal bars: zoomY (drag horizontally to zoom values)', () => {
  let h: TestHarness;
  beforeEach(() => {
    h = setup();
    // Override default leftDrag to zoomY
    h.store.actionMap.set('leftDrag', 'zoomY');
  });
  afterEach(() => { h.cleanup(); });

  it('horizontal drag narrows the y-scale (values), leaving x-scale untouched', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const yScale = h.store.scaleManager.getScale('y')!;

    const start = plotToClient(h, 100, 280);
    const end   = plotToClient(h, 500, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup',   end.clientX, end.clientY));

    expect(yScale.auto).toBe(false);
    expect(yScale.max! - yScale.min!).toBeLessThan(100);
    expect(xScale.min).toBe(0);
    expect(xScale.max).toBe(100);
  });
});

describe('Horizontal bars: zoomXY', () => {
  let h: TestHarness;
  beforeEach(() => {
    h = setup();
    h.store.actionMap.set('leftDrag', 'zoomXY');
  });
  afterEach(() => { h.cleanup(); });

  it('diagonal drag narrows both scales', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const yScale = h.store.scaleManager.getScale('y')!;

    const start = plotToClient(h, 100, 100);
    const end   = plotToClient(h, 500, 400);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup',   end.clientX, end.clientY));

    expect(xScale.max! - xScale.min!).toBeLessThan(100);
    expect(yScale.max! - yScale.min!).toBeLessThan(100);
  });
});

describe('Horizontal bars: wheel zoom', () => {
  let h: TestHarness;
  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('wheel zoom (default zoomX) zooms the x-scale (categories), not the y-scale', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const yScale = h.store.scaleManager.getScale('y')!;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    // Positive deltaY → zoom in (factor < 1 → range narrows)
    h.el.dispatchEvent(new WheelEvent('wheel', {
      clientX, clientY, deltaY: 200, bubbles: true, cancelable: true,
    }));

    // Wheel zoomed → x-scale narrowed
    expect(xScale.max! - xScale.min!).toBeLessThan(100);
    // y-scale untouched
    expect(yScale.min).toBe(0);
    expect(yScale.max).toBe(100);
  });
});

describe('Horizontal bars: pinch zoom', () => {
  let h: TestHarness;
  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('pinch (default zoomX) zooms the x-scale, not the y-scale', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const yScale = h.store.scaleManager.getScale('y')!;
    const plotBox = h.store.plotBox;
    const cx = plotBox.left + plotBox.width  / 2;
    const cy = plotBox.top  + plotBox.height / 2;

    h.el.dispatchEvent(touchEvent('touchstart', [
      { clientX: cx - 50, clientY: cy - 50 },
      { clientX: cx + 50, clientY: cy + 50 },
    ]));
    // Spread fingers (zoom in)
    h.el.dispatchEvent(touchEvent('touchmove', [
      { clientX: cx - 100, clientY: cy - 100 },
      { clientX: cx + 100, clientY: cy + 100 },
    ]));

    expect(xScale.max! - xScale.min!).toBeLessThan(100);
    expect(yScale.min).toBe(0);
    expect(yScale.max).toBe(100);
  });
});

describe('Horizontal bars: gutter drag (axis pan)', () => {
  let h: TestHarness;
  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('drag on the LEFT axis (now the x-axis in transposed mode) pans the x-scale', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const plotBox = h.store.plotBox;

    // Left axis gutter is at clientX < plotBox.left (50)
    const axisX = 25;
    const startY = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', axisX, startY));
    // Drag down 56px (10% of plot height)
    h.el.dispatchEvent(mouseEvent('mousemove', axisX, startY + 56));

    // x-scale shifted (vertical drag → vertical scale = x in transposed mode)
    expect(xScale.min).toBeCloseTo(10, 0);
    expect(xScale.max).toBeCloseTo(110, 0);
  });

  it('drag on the BOTTOM axis (now the y-axis in transposed mode) pans the y-scale', () => {
    const yScale = h.store.scaleManager.getScale('y')!;
    const plotBox = h.store.plotBox;

    // Bottom axis gutter is at clientY > plotBox.top + plotBox.height (580)
    const axisY = 590;
    const startX = plotBox.left + plotBox.width / 2;

    h.el.dispatchEvent(mouseEvent('mousedown', startX, axisY));
    // Drag right 70px (10% of plot width)
    h.el.dispatchEvent(mouseEvent('mousemove', startX + 70, axisY));

    // y-scale shifted by deltaFrac * range. For horizontal scale: sign = -1 * dir.
    // dir defaults to Forward (+1), so sign = -1, delta = -10. Pan to the right means
    // the visible range slides left → min decreases.
    expect(yScale.min).toBeCloseTo(-10, 0);
    expect(yScale.max).toBeCloseTo(90, 0);
  });
});

describe('Horizontal bars: pan (drag-to-pan)', () => {
  let h: TestHarness;
  beforeEach(() => {
    h = setup();
    h.store.actionMap.set('leftDrag', 'panX');
  });
  afterEach(() => { h.cleanup(); });

  it('panX on transposed chart pans the x-scale based on vertical drag', () => {
    const xScale = h.store.scaleManager.getScale('x')!;
    const start = plotToClient(h, 350, 100);
    const end   = plotToClient(h, 350, 156);  // 56px down

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup',   end.clientX, end.clientY));

    // x-scale (Vertical) is panned by clientY delta. sign = +1 * dir = +1.
    // delta/dim = 56/560 = 0.1, range = 100, so shift = +10.
    expect(xScale.min).toBeCloseTo(10, 0);
    expect(xScale.max).toBeCloseTo(110, 0);
  });
});
