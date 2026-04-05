import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawSelection } from '@/rendering/drawSelect';
import type { SelectDrawConfig } from '@/rendering/drawSelect';
import type { SelectState, BBox } from '@/types';
import type { ThemeCache } from '@/rendering/theme';

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillStyle: '' as string,
    strokeStyle: '' as string,
    lineWidth: 0,
  };
}

const plotBox: BBox = { left: 50, top: 20, width: 700, height: 560 };

function makeSelect(overrides?: Partial<SelectState>): SelectState {
  return {
    show: true,
    left: 100,
    top: 0,
    width: 200,
    height: 560,
    ...overrides,
  };
}

describe('drawSelection', () => {
  let ctx: ReturnType<typeof makeCtx>;

  beforeEach(() => {
    ctx = makeCtx();
  });

  it('does nothing when show=false', () => {
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect({ show: false }), plotBox, 1);

    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('does nothing when width <= 0', () => {
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect({ width: 0 }), plotBox, 1);

    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('draws fill rect with default colors', () => {
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 1);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.fillStyle).toBe('rgba(0,0,0,0.07)');
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('draws stroke rect with default colors', () => {
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 1);

    expect(ctx.strokeStyle).toBe('rgba(0,0,0,0.15)');
    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('skips stroke when config width=0', () => {
    const config: SelectDrawConfig = { width: 0 };
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 1, config);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).not.toHaveBeenCalled();
  });

  it('applies themed fill/stroke colors', () => {
    const theme = { selectFill: 'red', selectStroke: 'blue' } as ThemeCache;
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 1, undefined, theme);

    expect(ctx.fillStyle).toBe('red');
    expect(ctx.strokeStyle).toBe('blue');
  });

  it('config overrides theme', () => {
    const theme = { selectFill: 'red', selectStroke: 'blue' } as ThemeCache;
    const config: SelectDrawConfig = { fill: 'yellow', stroke: 'purple' };
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 1, config, theme);

    expect(ctx.fillStyle).toBe('yellow');
    expect(ctx.strokeStyle).toBe('purple');
  });

  it('scales coordinates by pxRatio', () => {
    const select = makeSelect({ left: 100, top: 0, width: 200, height: 560 });
    drawSelection(ctx as unknown as CanvasRenderingContext2D, select, plotBox, 2);

    // With pxRatio=2: x = round((50+100)*2)=300, y = round((20+0)*2)=40, w=round(200*2)=400, h=round(560*2)=1120
    expect(ctx.fillRect).toHaveBeenCalledWith(300, 40, 400, 1120);
  });

  it('scales stroke lineWidth by pxRatio', () => {
    drawSelection(ctx as unknown as CanvasRenderingContext2D, makeSelect(), plotBox, 2);

    // Default width is 1, scaled by pxRatio 2 = round(1*2) = 2
    expect(ctx.lineWidth).toBe(2);
  });
});
