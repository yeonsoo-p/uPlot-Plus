import { describe, it, expect } from 'vitest';
import { drawHLine, drawVLine, drawLabel, drawRegion, drawVRegion, drawDiagonalLine, drawSlopeInterceptLine } from '@/annotations';
import { createScaleState } from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Orientation } from '@/types';
import type { DrawContext } from '@/types/hooks';
import { createMockCtx } from './helpers/mockCanvas';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id, min, max, ori }) };
}

function makeDC() {
  const ctx = createMockCtx();

  const dc: DrawContext = {
    ctx,
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
  it('renders text at correct data coordinates', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawLabel(dc, xScale, yScale, 50, 50, 'Test Label');

    expect(ctx.fillText).toHaveBeenCalled();
    const callArgs = ctx.fillText.mock.calls[0];
    expect(callArgs?.[0]).toBe('Test Label');
    // x = valToPos(50, {Horizontal,Forward}, width=400, left=50) = 50 + 0.5*400 = 250
    // y = valToPos(50, {Vertical,Forward}, height=300, top=20) - LABEL_OFFSET_Y(4) = 170 - 4 = 166
    expect(callArgs?.[1]).toBe(250);
    expect(callArgs?.[2]).toBe(166);
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

describe('drawVRegion', () => {
  it('fills a rect between two x-values spanning full height', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);

    drawVRegion(dc, xScale, 20, 80);

    // valToPos(20, {Horizontal,Forward}, width=400, left=50) = 50 + 0.2*400 = 130
    // valToPos(80, {Horizontal,Forward}, width=400, left=50) = 50 + 0.8*400 = 370
    // fillRect(x=130, y=20, w=240, h=300)
    const args = ctx.fillRect.mock.calls[0]!;
    expect(args[0]).toBeCloseTo(130, 10);
    expect(args[1]).toBe(20);
    expect(args[2]).toBeCloseTo(240, 10);
    expect(args[3]).toBe(300);
  });

  it('draws a stroke border when stroke style provided', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);

    drawVRegion(dc, xScale, 20, 80, { stroke: '#ccc', fill: 'rgba(0,0,0,0.1)' });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('does not stroke when no stroke style', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);

    drawVRegion(dc, xScale, 20, 80);

    expect(ctx.strokeRect).not.toHaveBeenCalled();
  });
});

describe('drawDiagonalLine', () => {
  it('draws a line between two data points', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawDiagonalLine(dc, xScale, yScale, 0, 0, 100, 100);

    expect(ctx.beginPath).toHaveBeenCalled();
    // (0,0) -> valToPos x: 50+0*400=50, y: 20+(1-0)*300=320
    // (100,100) -> x: 50+1*400=450, y: 20+(1-1)*300=20
    expect(ctx.moveTo).toHaveBeenCalledWith(50, 320);
    expect(ctx.lineTo).toHaveBeenCalledWith(450, 20);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('applies custom stroke style and dash', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawDiagonalLine(dc, xScale, yScale, 0, 0, 100, 100, { stroke: 'blue', width: 3, dash: [5, 5] });

    expect(ctx.strokeStyle).toBe('blue');
    expect(ctx.lineWidth).toBe(3);
    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
  });

  it('extends line to plot box edges', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    // Line from center (50,50) to (75,75) — should extend to corners
    drawDiagonalLine(dc, xScale, yScale, 50, 50, 75, 75, { extend: true });

    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    // Extended endpoints should reach plot box edges (beyond original points)
    const moveArgs = ctx.moveTo.mock.calls[0]!;
    const lineArgs = ctx.lineTo.mock.calls[0]!;
    // The extended line should go further than the original endpoints
    expect(moveArgs[0]).toBeLessThanOrEqual(250); // original midpoint x=250
    expect(lineArgs[0]).toBeGreaterThanOrEqual(250);
  });

  it('draws label at midpoint', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    drawDiagonalLine(dc, xScale, yScale, 0, 0, 100, 100, { label: 'Trend' });

    expect(ctx.fillText).toHaveBeenCalled();
    const callArgs = ctx.fillText.mock.calls[0]!;
    expect(callArgs[0]).toBe('Trend');
    // Midpoint: x=(50+450)/2=250, y=(320+20)/2=170, offset by LABEL_OFFSET_Y=4
    expect(callArgs[1]).toBe(250);
    expect(callArgs[2]).toBe(166);
  });
});

describe('drawSlopeInterceptLine', () => {
  it('draws line from slope and intercept using scale range', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    // slope=1, intercept=0 → y=x → points (0,0) and (100,100)
    // Same as drawDiagonalLine(0,0,100,100) with extend
    drawSlopeInterceptLine(dc, xScale, yScale, 1, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('defaults to extend behavior', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    // slope=1, intercept=50 → line from (0,50) to (100,150)
    // With extend, should clip to plot box edges
    drawSlopeInterceptLine(dc, xScale, yScale, 1, 50);

    const moveArgs = ctx.moveTo.mock.calls[0]!;
    const lineArgs = ctx.lineTo.mock.calls[0]!;
    // Extended line should reach plot box edges
    expect(moveArgs[0]).toBeGreaterThanOrEqual(50); // plotBox.left
    expect(lineArgs[0]).toBeLessThanOrEqual(450); // plotBox.left + plotBox.width
  });

  it('handles zero slope (horizontal line)', () => {
    const { dc, ctx } = makeDC();
    const xScale = makeScale('x', 0, 100);
    const yScale = makeScale('y', 0, 100, Orientation.Vertical);

    // slope=0, intercept=50 → horizontal line at y=50
    drawSlopeInterceptLine(dc, xScale, yScale, 0, 50);

    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    const moveArgs = ctx.moveTo.mock.calls[0]!;
    const lineArgs = ctx.lineTo.mock.calls[0]!;
    // Both y-coordinates should be the same (y=50 → pixel 170)
    // valToPos(50, yScale) = 20 + (1 - 50/100) * 300 = 20 + 150 = 170
    expect(moveArgs[1]).toBe(170);
    expect(lineArgs[1]).toBe(170);
  });
});
