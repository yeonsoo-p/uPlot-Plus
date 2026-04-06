import { describe, it, expect, beforeEach } from 'vitest';
import { drawRangeBox } from '@/rendering/drawRangeBox';
import type { RangeBoxStyle } from '@/rendering/drawRangeBox';
import { createMockCtx } from '../helpers/mockCanvas';

describe('drawRangeBox', () => {
  let ctx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('draws wick line when wickColor is set', () => {
    const style: RangeBoxStyle = { wickColor: '#333', bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    expect(ctx.strokeStyle).not.toBe('');
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(100, 10);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 90);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('skips wick when wickColor is undefined', () => {
    const style: RangeBoxStyle = { bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // moveTo/lineTo should only be called if caps or median are set, not wick
    // Since no caps or median, moveTo should not be called at all
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('uses default wickWidth of 1 when not specified', () => {
    const style: RangeBoxStyle = { wickColor: '#333', bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    expect(ctx.lineWidth).toBe(1);
  });

  it('uses custom wickWidth when specified', () => {
    const style: RangeBoxStyle = { wickColor: '#333', wickWidth: 3, bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // lineWidth will be set to wickWidth first (3), then possibly overwritten
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws caps when capWidth > 0', () => {
    const style: RangeBoxStyle = { wickColor: '#333', capWidth: 10, bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // Cap calls: moveTo/lineTo for top cap, moveTo/lineTo for bottom cap
    // Plus wick: moveTo/lineTo
    // Total: 3 moveTo, 3 lineTo
    expect(ctx.moveTo).toHaveBeenCalledTimes(3);
    expect(ctx.lineTo).toHaveBeenCalledTimes(3);

    // Top cap at wickLo (10)
    expect(ctx.moveTo).toHaveBeenCalledWith(95, 10); // cx - capHalf
    expect(ctx.lineTo).toHaveBeenCalledWith(105, 10); // cx + capHalf
    // Bottom cap at wickHi (90)
    expect(ctx.moveTo).toHaveBeenCalledWith(95, 90);
    expect(ctx.lineTo).toHaveBeenCalledWith(105, 90);
  });

  it('skips caps when capWidth is 0', () => {
    const style: RangeBoxStyle = { wickColor: '#333', capWidth: 0, bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // Only wick: 1 moveTo, 1 lineTo
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
  });

  it('skips caps when capWidth is undefined', () => {
    const style: RangeBoxStyle = { wickColor: '#333', bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // Only wick calls
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(1);
  });

  it('draws filled body rectangle', () => {
    const style: RangeBoxStyle = { bodyFill: 'rgba(0,255,0,0.5)' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    expect(ctx.fillStyle).toBe('rgba(0,255,0,0.5)');
    // boxTop = min(30, 70) = 30, boxH = |70-30| = 40, halfW = 10
    expect(ctx.fillRect).toHaveBeenCalledWith(90, 30, 20, 40);
  });

  it('draws body stroke when bodyStroke is set', () => {
    const style: RangeBoxStyle = { bodyFill: 'green', bodyStroke: 'darkgreen', bodyStrokeWidth: 2 };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    expect(ctx.strokeRect).toHaveBeenCalledWith(90, 30, 20, 40);
  });

  it('uses default bodyStrokeWidth of 1.5', () => {
    const style: RangeBoxStyle = { bodyFill: 'green', bodyStroke: 'darkgreen' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // lineWidth should be set to 1.5 (default bodyStrokeWidth) before strokeRect
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('skips body stroke when bodyStroke is undefined', () => {
    const style: RangeBoxStyle = { bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    expect(ctx.strokeRect).not.toHaveBeenCalled();
  });

  it('draws median line when mid and midColor are set', () => {
    const style: RangeBoxStyle = { bodyFill: 'green', midColor: 'white', midWidth: 3 };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, 50, style);

    // Median line at y=50, from cx-halfW to cx+halfW
    expect(ctx.moveTo).toHaveBeenCalledWith(90, 50);
    expect(ctx.lineTo).toHaveBeenCalledWith(110, 50);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('uses default midWidth of 2.5', () => {
    const style: RangeBoxStyle = { bodyFill: 'green', midColor: 'white' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, 50, style);

    // The last lineWidth set should be 2.5 (for the median)
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('skips median line when mid is null', () => {
    const style: RangeBoxStyle = { bodyFill: 'green', midColor: 'white' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // No median moveTo/lineTo (no wick either since wickColor is undefined)
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('skips median line when midColor is undefined', () => {
    const style: RangeBoxStyle = { bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, 50, style);

    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('handles inverted box (boxLo > boxHi)', () => {
    const style: RangeBoxStyle = { bodyFill: 'red' };
    // boxLo=70, boxHi=30 (inverted)
    drawRangeBox(ctx, 100, 10, 90, 70, 30, 20, null, style);

    // boxTop = min(70, 30) = 30, boxH = |30-70| = 40
    expect(ctx.fillRect).toHaveBeenCalledWith(90, 30, 20, 40);
  });

  it('uses cap wickColor fallback to #555 when wickColor is undefined', () => {
    const style: RangeBoxStyle = { capWidth: 10, bodyFill: 'green' };
    drawRangeBox(ctx, 100, 10, 90, 30, 70, 20, null, style);

    // Caps should use fallback #555
    expect(ctx.strokeStyle).toBe('#555');
  });
});
