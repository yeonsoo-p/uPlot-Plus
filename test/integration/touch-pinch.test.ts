import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createChartStore, type ChartStore } from '@/hooks/useChartStore';
import { setupInteraction } from '@/hooks/useInteraction';

/**
 * Integration tests for touch and pinch-to-zoom interactions.
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

function touchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>, changedTouches?: Array<{ clientX: number; clientY: number }>): TouchEvent {
  const makeTouchList = (items: Array<{ clientX: number; clientY: number }>): TouchList =>
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    items.map(t => ({
      clientX: t.clientX, clientY: t.clientY,
      identifier: 0, target: null,
      pageX: t.clientX, pageY: t.clientY,
      screenX: t.clientX, screenY: t.clientY,
      radiusX: 0, radiusY: 0, rotationAngle: 0, force: 1,
    })) as unknown as TouchList;

  // jsdom TouchEvent constructor is limited — use Event + manual properties
  const ev: TouchEvent =
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    new Event(type, { bubbles: true, cancelable: true }) as unknown as TouchEvent;
  Object.defineProperty(ev, 'touches', { value: makeTouchList(touches) });
  Object.defineProperty(ev, 'changedTouches', { value: makeTouchList(changedTouches ?? touches) });
  Object.defineProperty(ev, 'preventDefault', { value: () => {} });
  return ev;
}

describe('Interaction: single touch', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('single touch in plot updates cursor', () => {
    const cx = 350 + h.store.plotBox.left;
    const cy = 280 + h.store.plotBox.top;

    h.el.dispatchEvent(touchEvent('touchstart', [{ clientX: cx, clientY: cy }]));
    h.el.dispatchEvent(touchEvent('touchmove', [{ clientX: cx, clientY: cy }]));

    expect(h.store.cursorManager.state.left).toBe(350);
    expect(h.store.cursorManager.state.top).toBe(280);
  });

  it('single touch drag triggers zoom', () => {
    const plotBox = h.store.plotBox;
    const startX = plotBox.left + 100;
    const endX = plotBox.left + 400;
    const y = plotBox.top + 280;

    h.el.dispatchEvent(touchEvent('touchstart', [{ clientX: startX, clientY: y }]));
    h.el.dispatchEvent(touchEvent('touchmove', [{ clientX: endX, clientY: y }]));
    h.el.dispatchEvent(touchEvent('touchend', [], [{ clientX: endX, clientY: y }]));

    const xScale = h.store.scaleManager.getScale('x');
    expect(xScale).toBeDefined();
    // After drag-to-zoom, x-scale range should be narrower
    expect(xScale!.max! - xScale!.min!).toBeLessThan(100);
  });
});

describe('Interaction: pinch zoom', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('two-finger pinch zooms x-scale', () => {
    const plotBox = h.store.plotBox;
    const centerX = plotBox.left + plotBox.width / 2;
    const centerY = plotBox.top + plotBox.height / 2;

    // Start with fingers 100px apart
    const finger1Start = { clientX: centerX - 50, clientY: centerY };
    const finger2Start = { clientX: centerX + 50, clientY: centerY };

    h.el.dispatchEvent(touchEvent('touchstart', [finger1Start, finger2Start]));

    // Spread fingers to 200px apart (zoom in)
    const finger1End = { clientX: centerX - 100, clientY: centerY };
    const finger2End = { clientX: centerX + 100, clientY: centerY };

    h.el.dispatchEvent(touchEvent('touchmove', [finger1End, finger2End]));

    const xScale = h.store.scaleManager.getScale('x');
    // Pinch out → zoom in → range narrows
    expect(xScale!.max! - xScale!.min!).toBeLessThan(100);
  });

  it('pinch in (fingers closer) zooms out', () => {
    const plotBox = h.store.plotBox;
    const centerX = plotBox.left + plotBox.width / 2;
    const centerY = plotBox.top + plotBox.height / 2;

    // Start 200px apart
    const finger1Start = { clientX: centerX - 100, clientY: centerY };
    const finger2Start = { clientX: centerX + 100, clientY: centerY };

    h.el.dispatchEvent(touchEvent('touchstart', [finger1Start, finger2Start]));

    // Pinch to 50px apart
    const finger1End = { clientX: centerX - 25, clientY: centerY };
    const finger2End = { clientX: centerX + 25, clientY: centerY };

    h.el.dispatchEvent(touchEvent('touchmove', [finger1End, finger2End]));

    const xScale = h.store.scaleManager.getScale('x');
    // Pinch in → zoom out → range widens
    expect(xScale!.max! - xScale!.min!).toBeGreaterThan(100);
  });

  it('touchend after pinch resets pinch state (no zoom-on-release)', () => {
    const plotBox = h.store.plotBox;
    const centerX = plotBox.left + plotBox.width / 2;
    const centerY = plotBox.top + plotBox.height / 2;

    h.el.dispatchEvent(touchEvent('touchstart', [
      { clientX: centerX - 50, clientY: centerY },
      { clientX: centerX + 50, clientY: centerY },
    ]));

    h.el.dispatchEvent(touchEvent('touchmove', [
      { clientX: centerX - 100, clientY: centerY },
      { clientX: centerX + 100, clientY: centerY },
    ]));

    const xScale = h.store.scaleManager.getScale('x');
    const rangeAfterPinch = xScale!.max! - xScale!.min!;

    // Release
    h.el.dispatchEvent(touchEvent('touchend', [], [
      { clientX: centerX - 100, clientY: centerY },
    ]));

    // Range should not change after touchend
    expect(xScale!.max! - xScale!.min!).toBe(rangeAfterPinch);
  });

  it('pinch cancels any active drag', () => {
    const plotBox = h.store.plotBox;
    const startX = plotBox.left + 100;
    const y = plotBox.top + 280;
    const centerX = plotBox.left + plotBox.width / 2;

    // Start a single touch (drag)
    h.el.dispatchEvent(touchEvent('touchstart', [{ clientX: startX, clientY: y }]));

    // Second finger arrives → switches to pinch
    h.el.dispatchEvent(touchEvent('touchstart', [
      { clientX: centerX - 50, clientY: y },
      { clientX: centerX + 50, clientY: y },
    ]));

    // Move pinch
    h.el.dispatchEvent(touchEvent('touchmove', [
      { clientX: centerX - 100, clientY: y },
      { clientX: centerX + 100, clientY: y },
    ]));

    // Release all
    h.el.dispatchEvent(touchEvent('touchend', [], [
      { clientX: centerX, clientY: y },
    ]));

    // Should NOT have triggered drag-to-zoom (scale should reflect pinch, not drag)
    const xScale = h.store.scaleManager.getScale('x');
    expect(xScale!.max! - xScale!.min!).toBeLessThan(100);
  });
});
