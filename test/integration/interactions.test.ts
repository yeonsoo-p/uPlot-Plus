import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChartStore, type ChartStore } from '@/hooks/useChartStore';
import { setupInteraction } from '@/hooks/useInteraction';
import { createScaleState } from '@/core/Scale';

/**
 * Integration tests for chart interactions.
 *
 * Uses the extracted `setupInteraction` function to attach event listeners
 * to a real DOM element, then dispatches events and asserts on store state.
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

  // Don't set store.canvas — prevents async redraws from overwriting plotBox
  store.pxRatio = 1;
  store.width = 800;
  store.height = 600;
  store.plotBox = { left: 50, top: 20, width: 700, height: 560 };

  // Add horizontal x-scale and vertical y-scale with explicit ranges
  store.scaleManager.addScale({ id: 'x', min: 0, max: 100 });
  const yState = store.scaleManager.getScale('y') ?? createScaleState({ id: 'y' });
  // Manually set y-scale since addScale infers orientation from id
  store.scaleManager.addScale({ id: 'y', min: 0, max: 100 });
  store.scaleManager.setGroupXScale(0, 'x');

  // Register a series and set data
  store.registerSeries({ group: 0, index: 0, yScale: 'y', stroke: 'red', show: true });
  store.dataStore.setData([{
    x: [0, 25, 50, 75, 100],
    series: [[10, 40, 70, 30, 90]],
  }]);
  store.dataStore.updateWindows((gi) => {
    const key = store.scaleManager.getGroupXScaleKey(gi);
    return key != null ? store.scaleManager.getScale(key) : undefined;
  });

  // Also store scale configs for dblclick zoom reset
  store.scaleConfigs = [
    { id: 'x', min: 0, max: 100 },
    { id: 'y', min: 0, max: 100 },
  ];

  // Mock getBoundingClientRect
  el.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, x: 0, y: 0, toJSON() { return ''; },
  });

  const removeListeners = setupInteraction(store, el);

  return {
    store,
    el,
    cleanup() {
      removeListeners();
      document.body.removeChild(el);
    },
  };
}

/** Create a MouseEvent at given clientX/clientY */
function mouseEvent(type: string, clientX: number, clientY: number, opts?: Partial<MouseEventInit>): MouseEvent {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, button: 0, ...opts });
}

/** Convert plot-relative coords to clientX/clientY for the test harness */
function plotToClient(h: TestHarness, cx: number, cy: number): { clientX: number; clientY: number } {
  return {
    clientX: cx + h.store.plotBox.left,
    clientY: cy + h.store.plotBox.top,
  };
}

describe('Interaction: cursor tracking', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('mousemove over plot area updates cursor state', () => {
    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    expect(h.store.cursorManager.state.left).toBe(350);
    expect(h.store.cursorManager.state.top).toBe(280);
  });

  it('mousemove fires onCursorMove callback', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onCursorMove = cb;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].plotX).toBe(350);
    expect(cb.mock.calls[0][0].plotY).toBe(280);
  });

  it('mousemove snaps to nearest data point', () => {
    // x=50 is at index 2, which maps to plot center (350px at width=700, range 0-100)
    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    expect(h.store.cursorManager.state.activeDataIdx).toBe(2);
    expect(h.store.cursorManager.state.activeGroup).toBe(0);
  });

  it('mouseleave hides cursor', () => {
    // First move into plot
    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));
    expect(h.store.cursorManager.state.left).toBe(350);

    // Then leave
    h.el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(h.store.cursorManager.state.left).toBe(-10);
    expect(h.store.cursorManager.state.activeDataIdx).toBe(-1);
  });

  it('mouseleave fires onCursorLeave callback', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onCursorLeave = cb;

    h.el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('Interaction: click events', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('click in plot area fires onClick callback', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onClick = cb;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('click', clientX, clientY));

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0].plotX).toBe(350);
  });

  it('click outside plot area does not fire onClick', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onClick = cb;

    // Click in the axis gutter (left of plot)
    h.el.dispatchEvent(mouseEvent('click', 10, 300));

    expect(cb).not.toHaveBeenCalled();
  });

  it('contextmenu fires onContextMenu callback', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onContextMenu = cb;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('contextmenu', clientX, clientY));

    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('Interaction: drag-to-zoom', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('drag >5px triggers zoom (x-scale range narrows)', () => {
    const xScale = h.store.scaleManager.getScale('x');
    expect(xScale?.min).toBe(0);
    expect(xScale?.max).toBe(100);

    // Drag from plot x=100 to x=400 (covering roughly 14% to 57% of 700px width)
    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));

    // x-scale should be narrower than 0-100
    expect(xScale?.auto).toBe(false);
    expect(xScale!.min!).toBeGreaterThan(0);
    expect(xScale!.max!).toBeLessThan(100);
    expect(xScale!.max! - xScale!.min!).toBeLessThan(100);
  });

  it('drag <5px does NOT trigger zoom', () => {
    const xScale = h.store.scaleManager.getScale('x');

    const start = plotToClient(h, 200, 280);
    const end = plotToClient(h, 203, 280); // 3px drag

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));

    expect(xScale?.min).toBe(0);
    expect(xScale?.max).toBe(100);
  });

  it('click does not fire after drag', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onClick = cb;

    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('click', end.clientX, end.clientY));

    expect(cb).not.toHaveBeenCalled();
  });

  it('onSelect callback fires with SelectEventInfo', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onSelect = cb;

    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));

    expect(cb).toHaveBeenCalledTimes(1);
    const info = cb.mock.calls[0][0];
    expect(info.left).toBeGreaterThan(0);
    expect(info.right).toBeGreaterThan(info.left);
    expect(info.ranges.x).toEqual(expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }));
    expect(info.ranges.x.min).toBeGreaterThan(0);
    expect(info.ranges.x.max).toBeLessThan(100);
  });

  it('onSelect returning false prevents zoom', () => {
    h.store.eventCallbacks.onSelect = () => false;

    const xScale = h.store.scaleManager.getScale('x');

    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);

    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));

    // Scale should NOT have changed
    expect(xScale?.min).toBe(0);
    expect(xScale?.max).toBe(100);
  });
});

describe('Interaction: double-click zoom reset', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('dblclick restores scales to original state', () => {
    // First zoom in
    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);
    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));
    expect(h.store.scaleManager.getScale('x')!.min!).toBeGreaterThan(0);

    // Double-click to reset
    const center = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('dblclick', center.clientX, center.clientY));

    // addScale creates new ScaleState objects, so re-fetch
    const xScale = h.store.scaleManager.getScale('x');
    expect(xScale?.min).toBe(0);
    expect(xScale?.max).toBe(100);
  });

  it('onDblClick callback fires', () => {
    const cb = vi.fn();
    h.store.eventCallbacks.onDblClick = cb;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('dblclick', clientX, clientY));

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onDblClick returning false prevents zoom reset', () => {
    h.store.eventCallbacks.onDblClick = () => false;

    // Zoom in
    const start = plotToClient(h, 100, 280);
    const end = plotToClient(h, 400, 280);
    h.el.dispatchEvent(mouseEvent('mousedown', start.clientX, start.clientY));
    h.el.dispatchEvent(mouseEvent('mousemove', end.clientX, end.clientY));
    h.el.dispatchEvent(mouseEvent('mouseup', end.clientX, end.clientY));

    const xScale = h.store.scaleManager.getScale('x');
    const zoomedMin = xScale!.min;
    const zoomedMax = xScale!.max;
    expect(zoomedMin!).toBeGreaterThan(0);

    // Double-click (prevented)
    const center = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('dblclick', center.clientX, center.clientY));

    // Should still be zoomed (same object, not replaced by addScale)
    expect(xScale?.min).toBe(zoomedMin);
    expect(xScale?.max).toBe(zoomedMax);
  });
});

describe('Interaction: wheel zoom', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('wheel with wheelZoom=false does nothing', () => {
    h.store.wheelZoom = false;
    const xScale = h.store.scaleManager.getScale('x');

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(new WheelEvent('wheel', {
      clientX, clientY, deltaY: 200, bubbles: true,
    }));

    expect(xScale?.min).toBe(0);
    expect(xScale?.max).toBe(100);
  });

  it('wheel with wheelZoom=true zooms x-scale', () => {
    h.store.wheelZoom = true;
    const xScale = h.store.scaleManager.getScale('x');

    const { clientX, clientY } = plotToClient(h, 350, 280);
    // Positive deltaY → factor < 1 → zooms in
    h.el.dispatchEvent(new WheelEvent('wheel', {
      clientX, clientY, deltaY: 200, bubbles: true,
    }));

    // Range should have narrowed (zoomed in)
    expect(xScale!.min!).toBeGreaterThan(0);
    expect(xScale!.max!).toBeLessThan(100);
    expect(xScale?.auto).toBe(false);
  });

  it('wheel zoom is centered around cursor position', () => {
    h.store.wheelZoom = true;
    const xScale = h.store.scaleManager.getScale('x');

    // Zoom at the left quarter of the plot (x=175px, mapping to ~25 in data)
    const { clientX, clientY } = plotToClient(h, 175, 280);
    // Positive deltaY → zooms in, centered near data value 25
    h.el.dispatchEvent(new WheelEvent('wheel', {
      clientX, clientY, deltaY: 200, bubbles: true,
    }));

    // The anchor point (25) should stay within the new range
    expect(xScale!.min!).toBeLessThan(25);
    expect(xScale!.max!).toBeGreaterThan(25);
    // Range is narrower than original 0-100
    expect(xScale!.max! - xScale!.min!).toBeLessThan(100);
  });

  it('onScaleChange fires after wheel zoom', () => {
    h.store.wheelZoom = true;
    const cb = vi.fn();
    h.store.eventCallbacks.onScaleChange = cb;

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(new WheelEvent('wheel', {
      clientX, clientY, deltaY: 200, bubbles: true,
    }));

    expect(cb).toHaveBeenCalled();
    // Should have been called with the x-scale
    const calls = cb.mock.calls.filter((c: unknown[]) => c[0] === 'x');
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe('Interaction: callback error resilience', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('throwing onClick callback does not break subsequent clicks', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let callCount = 0;

    h.store.eventCallbacks.onClick = () => {
      callCount++;
      if (callCount === 1) throw new Error('boom');
    };

    const { clientX, clientY } = plotToClient(h, 350, 280);

    // First click throws
    h.el.dispatchEvent(mouseEvent('click', clientX, clientY));
    expect(callCount).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith('[uPlot+] event callback error:', expect.any(Error));

    // Second click should still work
    h.el.dispatchEvent(mouseEvent('click', clientX, clientY));
    expect(callCount).toBe(2);

    warnSpy.mockRestore();
  });

  it('throwing onCursorMove callback does not kill cursor tracking', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    h.store.eventCallbacks.onCursorMove = () => {
      throw new Error('boom');
    };

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    // Cursor should still have updated despite callback error
    expect(h.store.cursorManager.state.left).toBe(350);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe('Interaction: focus mode', () => {
  let h: TestHarness;

  beforeEach(() => { h = setup(); });
  afterEach(() => { h.cleanup(); });

  it('mousemove with focusAlpha < 1 sets focusedSeries', () => {
    h.store.focusAlpha = 0.15; // Enable focus mode

    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));

    // Should have focused on the nearest series
    expect(h.store.focusedSeries).not.toBeNull();
  });

  it('mouseleave clears focusedSeries', () => {
    h.store.focusAlpha = 0.15;

    // Move in
    const { clientX, clientY } = plotToClient(h, 350, 280);
    h.el.dispatchEvent(mouseEvent('mousemove', clientX, clientY));
    expect(h.store.focusedSeries).not.toBeNull();

    // Leave
    h.el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(h.store.focusedSeries).toBeNull();
  });
});

describe('Interaction: cleanup', () => {
  it('cleanup removes all event listeners', () => {
    const h = setup();
    const removeSpy = vi.spyOn(h.el, 'removeEventListener');

    h.cleanup();

    // Should have removed all 11 listener types
    const removedTypes = removeSpy.mock.calls.map(c => c[0]);
    expect(removedTypes).toContain('mousemove');
    expect(removedTypes).toContain('mousedown');
    expect(removedTypes).toContain('mouseup');
    expect(removedTypes).toContain('click');
    expect(removedTypes).toContain('contextmenu');
    expect(removedTypes).toContain('mouseleave');
    expect(removedTypes).toContain('dblclick');
    expect(removedTypes).toContain('wheel');
    expect(removedTypes).toContain('touchstart');
    expect(removedTypes).toContain('touchmove');
    expect(removedTypes).toContain('touchend');
  });
});
