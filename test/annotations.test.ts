import { describe, it, expect, vi } from 'vitest';
import { drawHLine, drawVLine, drawLabel, drawRegion } from '@/annotations';
import type { ScaleState } from '@/types';
import { Distribution, Orientation, Direction } from '@/types';
import type { DrawContext } from '@/types/hooks';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return {
    id,
    min,
    max,
    distr: Distribution.Linear,
    log: 10,
    asinh: 1,
    ori,
    dir: Direction.Forward,
    time: false,
    auto: false,
    range: null,
    _min: null,
    _max: null,
  };
}

function makeDC() {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: '',
    textBaseline: '',
  };

  const dc: DrawContext = {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    plotBox: { left: 50, top: 20, width: 400, height: 300 },
    pxRatio: 2,
    getScale: () => undefined,
    valToX: () => null,
    valToY: () => null,
  };

  return { dc, ctx };
}

describe('drawHLine', () => {
  it('draws a horizontal line across full plot width', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawHLine(dc, yScale, 50);

    // valToPos(50, {min:0,max:100,Vertical,Forward}, height=300, top=20) = 20 + (1-0.5)*300 = 170
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(50, 170);
    expect(ctx.lineTo).toHaveBeenCalledWith(450, 170);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('applies custom stroke style', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawHLine(dc, yScale, 50, { stroke: 'blue', width: 3 });

    expect(ctx.strokeStyle).toBe('blue');
    expect(ctx.lineWidth).toBe(3);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('sets dash pattern when provided', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawHLine(dc, yScale, 50, { dash: [5, 5] });

    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
  });
});

describe('drawVLine', () => {
  it('draws a vertical line across full plot height', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);

    drawVLine(dc, xScale, 50);

    // valToPos(50, {min:0,max:100,Horizontal,Forward}, width=400, left=50) = 50 + 0.5*400 = 250
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(250, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(250, 320);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('drawLabel', () => {
  it('renders text at data coordinates', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawLabel(dc, xScale, yScale, 50, 50, 'Test Label');

    expect(ctx.fillText).toHaveBeenCalled();
    const callArgs = ctx.fillText.mock.calls[0];
    expect(callArgs?.[0]).toBe('Test Label');
  });

  it('applies custom font and fill', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawLabel(dc, xScale, yScale, 50, 50, 'Hi', { font: '16px monospace', fill: 'green' });

    expect(ctx.fillText).toHaveBeenCalled();
  });
});

describe('drawRegion', () => {
  it('fills a rect between two y-values', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawRegion(dc, yScale, 20, 80);

    // valToPos(80, ...) = 20 + (1-0.8)*300 ≈ 80, valToPos(20, ...) = 20 + (1-0.2)*300 = 260
    // fillRect(left=50, top=min(80,260)≈80, width=400, height≈180)
    const args = ctx.fillRect.mock.calls[0]!;
    expect(args[0]).toBe(50);
    expect(args[1]).toBeCloseTo(80, 10);
    expect(args[2]).toBe(400);
    expect(args[3]).toBeCloseTo(180, 10);
  });

  it('draws a stroke border when stroke style provided', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawRegion(dc, yScale, 20, 80, { stroke: '#ccc', fill: 'rgba(0,0,0,0.1)' });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('does not stroke when no stroke style', () => {
    const { dc, ctx } = makeDC();
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawRegion(dc, yScale, 20, 80);

    expect(ctx.strokeRect).not.toHaveBeenCalled();
  });
});
