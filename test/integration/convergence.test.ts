import { describe, it, expect } from 'vitest';
import { convergeSize } from '@/axes/layout';
import { createAxisState } from '@/axes/ticks';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Side } from '@/types';

function makeScale(min: number, max: number): ScaleState {
  return { ...createScaleState({ id: 's' }), min, max };
}

describe('convergeSize integration', () => {
  it('single y-axis produces correct plotBox', () => {
    const axes = [createAxisState({ scale: 'y', side: Side.Left })];
    const scales: Record<string, ScaleState> = { y: makeScale(-10, 10) };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    // Y-axis gutter is 50px + 8px top margin for tick overflow
    expect(plotBox.left).toBe(50);
    expect(plotBox.width).toBe(750);
    expect(plotBox.height).toBe(592); // 600 - 8px top margin
  });

  it('x + y axes produce correct plotBox', () => {
    const axes = [
      createAxisState({ scale: 'x', side: Side.Bottom }),
      createAxisState({ scale: 'y', side: Side.Left }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 1000),
      y: makeScale(-100, 100),
    };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    // Y-axis left gutter ~50px, x-axis bottom gutter ~50px, 8px top margin
    expect(plotBox.left).toBe(50);
    expect(plotBox.top).toBe(8);
    expect(plotBox.width).toBe(750);
    expect(plotBox.height).toBe(542);
    expect(plotBox.width + plotBox.left).toBe(800);
    expect(plotBox.height + plotBox.top).toBeLessThanOrEqual(600);
  });

  it('is deterministic across multiple calls', () => {
    const makeAxes = () => [
      createAxisState({ scale: 'x', side: Side.Bottom }),
      createAxisState({ scale: 'y', side: Side.Left }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 100),
      y: makeScale(0, 100),
    };

    const box1 = convergeSize(800, 600, makeAxes(), id => scales[id]);
    const box2 = convergeSize(800, 600, makeAxes(), id => scales[id]);

    expect(box1).toEqual(box2);
    // Should produce same layout as x+y case
    expect(box1.left).toBe(50);
    expect(box1.width).toBe(750);
    expect(box1.height).toBe(542);
  });

  it('handles dual y-axes', () => {
    const axes = [
      createAxisState({ scale: 'x', side: Side.Bottom }),
      createAxisState({ scale: 'y1', side: Side.Left }),
      createAxisState({ scale: 'y2', side: Side.Right }),
    ];
    const scales: Record<string, ScaleState> = {
      x: makeScale(0, 100),
      y1: makeScale(0, 100),
      y2: makeScale(0, 1000),
    };
    const plotBox = convergeSize(800, 600, axes, id => scales[id]);

    // Left y-axis: 50px, right y-axis: ~54px, total gutter ~104px
    expect(plotBox.left).toBe(50);
    expect(plotBox.width + plotBox.left).toBeLessThan(800); // right y-axis takes space
    expect(plotBox.width).toBeGreaterThan(600); // most of the 800px is plot
    expect(plotBox.width).toBeLessThan(750); // but less than single-axis case
  });
});
