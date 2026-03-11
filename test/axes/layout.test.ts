import { describe, it, expect } from 'vitest';
import { axesCalc, calcPlotRect, calcAxesRects, convergeSize } from '@/axes/layout';
import { createAxisState } from '@/axes/ticks';
import type { ScaleState } from '@/types';
import type { AxisState } from '@/types/axes';
import { createScaleState } from '@/core/Scale';

function makeScale(min: number, max: number, distr: 1 | 2 | 3 | 4 = 1): ScaleState {
  return { ...createScaleState({ id: 'test', distr }), min, max };
}

function makeGetScale(scales: Record<string, ScaleState>) {
  return (id: string) => scales[id];
}

// ---- calcPlotRect ----
describe('calcPlotRect', () => {
  it('no axes: full chart area', () => {
    const box = calcPlotRect(800, 600, []);
    expect(box).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it('bottom x-axis reduces height', () => {
    const axes: AxisState[] = [
      { ...createAxisState({ scale: 'x', side: 2 }), _show: true, _size: 50 },
    ];
    const box = calcPlotRect(800, 600, axes);
    expect(box.height).toBe(550);
    expect(box.top).toBe(0);
  });

  it('left y-axis reduces width and shifts left', () => {
    const axes: AxisState[] = [
      { ...createAxisState({ scale: 'y', side: 3 }), _show: true, _size: 60 },
    ];
    const box = calcPlotRect(800, 600, axes);
    expect(box.width).toBe(740);
    expect(box.left).toBe(60);
  });

  it('axes on all four sides', () => {
    const axes: AxisState[] = [
      { ...createAxisState({ scale: 'a', side: 0 }), _show: true, _size: 30 },
      { ...createAxisState({ scale: 'b', side: 1 }), _show: true, _size: 40 },
      { ...createAxisState({ scale: 'c', side: 2 }), _show: true, _size: 50 },
      { ...createAxisState({ scale: 'd', side: 3 }), _show: true, _size: 60 },
    ];
    const box = calcPlotRect(800, 600, axes);
    expect(box.left).toBe(60);
    expect(box.top).toBe(30);
    expect(box.width).toBe(800 - 40 - 60);
    expect(box.height).toBe(600 - 30 - 50);
  });

  it('hidden axes ignored', () => {
    const axes: AxisState[] = [
      { ...createAxisState({ scale: 'y', side: 3 }), _show: false, _size: 60 },
    ];
    const box = calcPlotRect(800, 600, axes);
    expect(box.width).toBe(800);
  });

  it('never goes negative', () => {
    const axes: AxisState[] = [
      { ...createAxisState({ scale: 'a', side: 3 }), _show: true, _size: 500 },
      { ...createAxisState({ scale: 'b', side: 1 }), _show: true, _size: 500 },
    ];
    const box = calcPlotRect(800, 600, axes);
    expect(box.width).toBeGreaterThanOrEqual(0);
  });
});

// ---- axesCalc ----
describe('axesCalc', () => {
  it('computes splits and values for numeric axis', () => {
    const axis = createAxisState({ scale: 'y', side: 3 });
    const scale = makeScale(0, 100);
    const converged = axesCalc([axis], makeGetScale({ y: scale }), 600, 400, 1);

    expect(axis._splits).not.toBeNull();
    expect(axis._splits!.length).toBeGreaterThan(0);
    expect(axis._values).not.toBeNull();
    expect(axis._values!.length).toBe(axis._splits!.length);
    expect(converged).toBe(true);
  });

  it('hides axis when scale has no range', () => {
    const axis = createAxisState({ scale: 'y', side: 3 });
    const scale = createScaleState({ id: 'y' }); // min/max null
    axesCalc([axis], makeGetScale({ y: scale }), 600, 400, 1);
    expect(axis._show).toBe(false);
  });

  it('uses logAxisSplits for log scale', () => {
    const axis = createAxisState({ scale: 'y', side: 3 });
    const scale = makeScale(1, 1000, 3);
    axesCalc([axis], makeGetScale({ y: scale }), 600, 400, 1);

    expect(axis._splits).not.toBeNull();
    // Log splits should include powers of 10
    expect(axis._splits!).toContain(1);
    expect(axis._splits!).toContain(10);
    expect(axis._splits!).toContain(100);
  });
});

// ---- calcAxesRects ----
describe('calcAxesRects', () => {
  it('positions axes from plot edges outward', () => {
    const axisBottom = createAxisState({ scale: 'x', side: 2 });
    axisBottom._show = true;
    axisBottom._size = 50;

    const axisLeft = createAxisState({ scale: 'y', side: 3 });
    axisLeft._show = true;
    axisLeft._size = 60;

    const plotBox = { left: 60, top: 0, width: 740, height: 550 };
    calcAxesRects([axisBottom, axisLeft], plotBox);

    // Bottom axis positioned at bottom of plot, left axis at left edge
    expect(axisBottom._pos).toBe(550);
    expect(axisLeft._pos).toBe(60);
  });
});

// ---- convergeSize ----
describe('convergeSize', () => {
  it('converges within 3 cycles', () => {
    const axes = [
      createAxisState({ scale: 'x', side: 2 }),
      createAxisState({ scale: 'y', side: 3 }),
    ];
    const scales = {
      x: makeScale(0, 100),
      y: makeScale(0, 100),
    };

    const plotBox = convergeSize(800, 600, axes, makeGetScale(scales));
    expect(plotBox.width).toBeGreaterThan(0);
    expect(plotBox.height).toBeGreaterThan(0);
    expect(plotBox.left).toBeGreaterThanOrEqual(0);
    expect(plotBox.top).toBeGreaterThanOrEqual(0);
  });

  it('resets _size to 0 at start (regression: hover stability)', () => {
    const axes = [
      createAxisState({ scale: 'y', side: 3 }),
    ];
    // Simulate previous redraw leaving _size = 50
    axes[0]!._size = 50;

    const scales = { y: makeScale(-10, 10) };
    const plotBox1 = convergeSize(800, 600, axes, makeGetScale(scales));

    // Simulate second redraw (should produce same result)
    axes[0]!._size = 50; // as if syncAxisStates preserved it
    const plotBox2 = convergeSize(800, 600, axes, makeGetScale(scales));

    expect(plotBox1.width).toBe(plotBox2.width);
    expect(plotBox1.height).toBe(plotBox2.height);
  });

  it('calculates axis positions', () => {
    const axes = [
      createAxisState({ scale: 'x', side: 2 }),
      createAxisState({ scale: 'y', side: 3 }),
    ];
    const scales = {
      x: makeScale(0, 100),
      y: makeScale(0, 100),
    };

    convergeSize(800, 600, axes, makeGetScale(scales));

    // After convergence, positions should be set
    expect(axes[0]!._pos).toBeGreaterThan(0);
  });
});
