import { describe, it, expect } from 'vitest';
import { convergeSize } from '@/axes/layout';
import { createAxisState } from '@/axes/ticks';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';

function makeScale(min: number, max: number): ScaleState {
  return { ...createScaleState({ id: 's' }), min, max };
}

describe('convergeSize integration', () => {
  it('single y-axis produces correct plotBox', () => {
    const axes = [createAxisState({ scale: 'y', side: 3 })];
    const scales: Record<string, ScaleState> = { y: makeScale(-10, 10) };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    expect(plotBox.left).toBeGreaterThan(0); // y-axis takes space
    expect(plotBox.width).toBeLessThan(800);
    expect(plotBox.height).toBe(600); // no x-axis
  });

  it('x + y axes produce correct plotBox', () => {
    const axes = [
      createAxisState({ scale: 'x', side: 2 }),
      createAxisState({ scale: 'y', side: 3 }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 1000),
      y: makeScale(-100, 100),
    };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    expect(plotBox.left).toBeGreaterThan(0);
    expect(plotBox.top).toBe(0);
    expect(plotBox.width).toBeLessThan(800);
    expect(plotBox.height).toBeLessThan(600);
    expect(plotBox.width + plotBox.left).toBeLessThanOrEqual(800);
    expect(plotBox.height + plotBox.top).toBeLessThanOrEqual(600);
  });

  it('is deterministic across multiple calls', () => {
    const makeAxes = () => [
      createAxisState({ scale: 'x', side: 2 }),
      createAxisState({ scale: 'y', side: 3 }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 100),
      y: makeScale(0, 100),
    };

    const box1 = convergeSize(800, 600, makeAxes(), id => scales[id]);
    const box2 = convergeSize(800, 600, makeAxes(), id => scales[id]);

    expect(box1).toEqual(box2);
  });

  it('handles dual y-axes', () => {
    const axes = [
      createAxisState({ scale: 'x', side: 2 }),
      createAxisState({ scale: 'y1', side: 3 }),
      createAxisState({ scale: 'y2', side: 1 }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 100),
      y1: makeScale(0, 100),
      y2: makeScale(0, 1000),
    };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    expect(plotBox.left).toBeGreaterThan(0); // left y-axis
    expect(plotBox.width + plotBox.left).toBeLessThan(800); // right y-axis
  });
});
