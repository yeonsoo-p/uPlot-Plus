import { describe, it, expect, vi } from 'vitest';
import { drawHLine, drawVLine, drawRegion } from '@/annotations';
import type { DrawContext } from '@/types/hooks';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';

/** Minimal scale state for testing */
function makeScale(min: number, max: number): ScaleState {
  return { ...createScaleState({ id: 'y', min, max }) };
}

function makeMockCtx() {
  return {
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
  };
}

function makeDC(overrides?: Partial<DrawContext>) {
  const mockCtx = makeMockCtx();
  const dc: DrawContext = {
    ctx: mockCtx as unknown as CanvasRenderingContext2D,
    plotBox: { left: 50, top: 20, width: 700, height: 400 },
    pxRatio: 1,
    getScale: () => undefined,
    valToX: () => null,
    valToY: () => null,
    ...overrides,
  };
  return { dc, mockCtx };
}

describe('drawHLine (imperative)', () => {
  it('draws a horizontal line at the correct position', () => {
    const scale = makeScale(0, 100);
    const { dc, mockCtx } = makeDC();
    drawHLine(dc, scale, 50, { stroke: 'red', width: 2 });

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.strokeStyle).toBe('red');
    expect(mockCtx.lineWidth).toBe(2);
  });

  it('applies dash pattern and resets', () => {
    const scale = makeScale(0, 100);
    const { dc, mockCtx } = makeDC();
    drawHLine(dc, scale, 50, { dash: [6, 4] });

    expect(mockCtx.setLineDash).toHaveBeenCalledWith([6, 4]);
    expect(mockCtx.setLineDash).toHaveBeenCalledWith([]);
  });
});

describe('drawVLine (imperative)', () => {
  it('draws a vertical line', () => {
    const scale = makeScale(0, 200);
    const { dc, mockCtx } = makeDC();
    drawVLine(dc, scale, 100, { stroke: 'blue' });

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.strokeStyle).toBe('blue');
  });
});

describe('drawRegion (imperative)', () => {
  it('draws a filled rectangle', () => {
    const scale = makeScale(0, 100);
    const { dc, mockCtx } = makeDC();
    drawRegion(dc, scale, 25, 75, { fill: 'rgba(0,255,0,0.2)' });

    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.fillStyle).toBe('rgba(0,255,0,0.2)');
  });

  it('draws border when stroke is provided', () => {
    const scale = makeScale(0, 100);
    const { dc, mockCtx } = makeDC();
    drawRegion(dc, scale, 25, 75, { fill: 'rgba(0,0,0,0.1)', stroke: 'green', width: 2 });

    expect(mockCtx.strokeRect).toHaveBeenCalled();
    expect(mockCtx.strokeStyle).toBe('green');
  });
});
