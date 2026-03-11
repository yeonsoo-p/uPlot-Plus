import { describe, it, expect } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';

describe('canvas sizing on mount', () => {
  it('setSize updates canvas dimensions when canvas is assigned', () => {
    const store = createChartStore();
    const canvas = document.createElement('canvas');
    store.pxRatio = 2;

    // Simulate the mount sequence: assign canvas, then setSize
    store.canvas = canvas;
    store.setSize(800, 600);

    expect(canvas.width).toBe(1600);  // 800 * 2
    expect(canvas.height).toBe(1200); // 600 * 2
    expect(canvas.style.width).toBe('800px');
    expect(canvas.style.height).toBe('600px');
    expect(store.width).toBe(800);
    expect(store.height).toBe(600);
  });

  it('setSize does NOT update canvas when store.canvas is null', () => {
    const store = createChartStore();
    store.pxRatio = 2;
    store.canvas = null;

    store.setSize(800, 600);

    // Store dimensions should still be updated
    expect(store.width).toBe(800);
    expect(store.height).toBe(600);
    // But no canvas to size — this was the bug
  });

  it('simulates the fixed mount order: canvas ref available before setSize', () => {
    const store = createChartStore();
    const canvas = document.createElement('canvas');
    store.pxRatio = 1;

    // This simulates the fixed Chart.tsx dimension effect:
    // if (canvasRef.current && store.canvas !== canvasRef.current) store.canvas = canvasRef.current;
    // store.setSize(width, height);
    if (store.canvas !== canvas) {
      store.canvas = canvas;
    }
    store.setSize(400, 300);

    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
    expect(canvas.style.width).toBe('400px');
    expect(canvas.style.height).toBe('300px');
  });
});
