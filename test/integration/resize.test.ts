import { describe, it, expect } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';

describe('setSize', () => {
  it('updates width and height on the store', () => {
    const store = createChartStore();
    store.setSize(800, 600);
    expect(store.width).toBe(800);
    expect(store.height).toBe(600);
  });

  it('clears renderer cache on resize', () => {
    const store = createChartStore();
    let cleared = false;
    const origClearCache = store.renderer.clearCache.bind(store.renderer);
    store.renderer.clearCache = () => {
      cleared = true;
      origClearCache();
    };

    store.setSize(800, 600);
    expect(cleared).toBe(true);
  });

  it('does not auto-schedule a redraw (caller decides sync vs async)', () => {
    const store = createChartStore();
    let scheduled = false;
    store.scheduleRedraw = () => { scheduled = true; };

    store.setSize(800, 600);
    expect(scheduled).toBe(false);
  });

  it('bails out when dimensions are unchanged', () => {
    const store = createChartStore();
    store.setSize(800, 600);
    let cleared = false;
    store.renderer.clearCache = () => { cleared = true; };

    store.setSize(800, 600);
    expect(cleared).toBe(false);
  });

  it('updates canvas element dimensions if present', () => {
    const store = createChartStore();
    store.pxRatio = 2;

    // Create a mock canvas
    const canvas = document.createElement('canvas');
    store.canvas = canvas;

    store.setSize(400, 300);

    expect(canvas.width).toBe(800);  // 400 * 2
    expect(canvas.height).toBe(600); // 300 * 2
    expect(canvas.style.width).toBe('400px');
    expect(canvas.style.height).toBe('300px');
  });

  it('works without a canvas (no error)', () => {
    const store = createChartStore();
    store.canvas = null;

    // Should not throw
    expect(() => store.setSize(400, 300)).not.toThrow();
    expect(store.width).toBe(400);
    expect(store.height).toBe(300);
  });
});
