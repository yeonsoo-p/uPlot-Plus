import { describe, it, expect, vi } from 'vitest';
import { drawHLine, drawVLine, drawRegion } from '@/annotations';
import type { DrawContext } from '@/types/hooks';
import type { ScaleState } from '@/types';
import { Distribution } from '@/types';

/** Minimal scale state for testing */
function makeScale(min: number, max: number): ScaleState {
  return { min, max, distr: Distribution.Linear, log: 10, clamp: false, asinh: 1 };
}

function makeDC(overrides?: Partial<DrawContext>): DrawContext {
  const mockCtx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx: mockCtx,
    plotBox: { left: 50, top: 20, width: 700, height: 400 },
    pxRatio: 1,
    getScale: () => undefined,
    valToX: () => null,
    valToY: () => null,
    ...overrides,
  };
}

describe('drawHLine (imperative)', () => {
  it('draws a horizontal line at the correct position', () => {
    const scale = makeScale(0, 100);
    const dc = makeDC();
    drawHLine(dc, scale, 50, { stroke: 'red', width: 2 });

    expect(dc.ctx.beginPath).toHaveBeenCalled();
    expect(dc.ctx.stroke).toHaveBeenCalled();
    expect(dc.ctx.strokeStyle).toBe('red');
    expect(dc.ctx.lineWidth).toBe(2);
  });

  it('applies dash pattern and resets', () => {
    const scale = makeScale(0, 100);
    const dc = makeDC();
    drawHLine(dc, scale, 50, { dash: [6, 4] });

    expect(dc.ctx.setLineDash).toHaveBeenCalledWith([6, 4]);
    expect(dc.ctx.setLineDash).toHaveBeenCalledWith([]);
  });
});

describe('drawVLine (imperative)', () => {
  it('draws a vertical line', () => {
    const scale = makeScale(0, 200);
    const dc = makeDC();
    drawVLine(dc, scale, 100, { stroke: 'blue' });

    expect(dc.ctx.beginPath).toHaveBeenCalled();
    expect(dc.ctx.stroke).toHaveBeenCalled();
    expect(dc.ctx.strokeStyle).toBe('blue');
  });
});

describe('drawRegion (imperative)', () => {
  it('draws a filled rectangle', () => {
    const scale = makeScale(0, 100);
    const dc = makeDC();
    drawRegion(dc, scale, 25, 75, { fill: 'rgba(0,255,0,0.2)' });

    expect(dc.ctx.fillRect).toHaveBeenCalled();
    expect(dc.ctx.fillStyle).toBe('rgba(0,255,0,0.2)');
  });

  it('draws border when stroke is provided', () => {
    const scale = makeScale(0, 100);
    const dc = makeDC();
    drawRegion(dc, scale, 25, 75, { fill: 'rgba(0,0,0,0.1)', stroke: 'green', width: 2 });

    expect(dc.ctx.strokeRect).toHaveBeenCalled();
    expect(dc.ctx.strokeStyle).toBe('green');
  });
});
