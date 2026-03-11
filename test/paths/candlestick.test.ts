import { describe, it, expect, vi } from 'vitest';
import { drawCandlesticks } from '@/paths/candlestick';
import type { ScaleState } from '@/types';
import { Distribution, Orientation, Direction } from '@/types';
import type { DrawContext } from '@/types/hooks';

function makeScale(id: string, min: number, max: number): ScaleState {
  return {
    id,
    min,
    max,
    distr: Distribution.Linear,
    log: 10,
    asinh: 1,
    ori: id === 'x' ? Orientation.Horizontal : Orientation.Vertical,
    dir: Direction.Forward,
    time: false,
    auto: false,
    range: null,
    _min: null,
    _max: null,
  };
}

function makeDrawContext(): DrawContext & { ctx: Record<string, unknown> } {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
  };
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    plotBox: { left: 0, top: 0, width: 400, height: 300 },
    pxRatio: 1,
    getScale: () => undefined,
    valToX: () => null,
    valToY: () => null,
  } as unknown as DrawContext & { ctx: Record<string, unknown> };
}

describe('drawCandlesticks', () => {
  it('returns a function', () => {
    const fn = drawCandlesticks({
      xValues: [0],
      open: [100],
      high: [110],
      low: [90],
      close: [105],
      xScale: makeScale('x', 0, 10),
      yScale: makeScale('y', 80, 120),
    });
    expect(typeof fn).toBe('function');
  });

  it('calls ctx.fillRect for candle bodies', () => {
    const xScale = makeScale('x', 0, 2);
    const yScale = makeScale('y', 90, 110);

    const fn = drawCandlesticks({
      xValues: [0, 1, 2],
      open: [100, 105, 98],
      high: [110, 108, 102],
      low: [95, 100, 92],
      close: [105, 101, 100],
      xScale,
      yScale,
    });

    const dc = makeDrawContext();
    fn(dc as unknown as DrawContext);

    // 3 candles → 3 fillRect calls for bodies
    expect(dc.ctx.fillRect).toHaveBeenCalledTimes(3);
  });

  it('calls ctx.stroke for wicks', () => {
    const fn = drawCandlesticks({
      xValues: [0, 1],
      open: [100, 105],
      high: [110, 108],
      low: [95, 100],
      close: [105, 101],
      xScale: makeScale('x', 0, 1),
      yScale: makeScale('y', 90, 115),
    });

    const dc = makeDrawContext();
    fn(dc as unknown as DrawContext);

    // 2 wicks → 2 stroke calls
    expect(dc.ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it('skips null values', () => {
    const fn = drawCandlesticks({
      xValues: [0, 1, 2],
      open: [100, null, 98],
      high: [110, null, 102],
      low: [95, null, 92],
      close: [105, null, 100],
      xScale: makeScale('x', 0, 2),
      yScale: makeScale('y', 90, 115),
    });

    const dc = makeDrawContext();
    fn(dc as unknown as DrawContext);

    // Only 2 candles (index 1 is null)
    expect(dc.ctx.fillRect).toHaveBeenCalledTimes(2);
    expect(dc.ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it('does nothing when scale has no min/max', () => {
    const fn = drawCandlesticks({
      xValues: [0],
      open: [100],
      high: [110],
      low: [90],
      close: [105],
      xScale: { ...makeScale('x', 0, 10), min: null },
      yScale: makeScale('y', 80, 120),
    });

    const dc = makeDrawContext();
    fn(dc as unknown as DrawContext);

    expect(dc.ctx.fillRect).not.toHaveBeenCalled();
  });
});
