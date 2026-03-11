import { describe, it, expect, vi } from 'vitest';
import { createChartStore } from '@/hooks/useChartStore';
import type { DrawContext } from '@/types/hooks';

function makeDC(): DrawContext {
  return {
    ctx: {} as CanvasRenderingContext2D,
    plotBox: { left: 10, top: 10, width: 780, height: 380 },
    pxRatio: 1,
    getScale: () => undefined,
    valToX: () => null,
    valToY: () => null,
  };
}

describe('Draw hooks on ChartStore', () => {
  it('stores and iterates drawHooks', () => {
    const store = createChartStore();
    const fn = vi.fn();
    store.drawHooks.add(fn);

    const dc = makeDC();
    for (const hook of store.drawHooks) hook(dc);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(dc);
  });

  it('supports multiple draw hooks in order', () => {
    const store = createChartStore();
    const order: number[] = [];
    store.drawHooks.add(() => order.push(1));
    store.drawHooks.add(() => order.push(2));
    store.drawHooks.add(() => order.push(3));

    const dc = makeDC();
    for (const hook of store.drawHooks) hook(dc);

    expect(order).toEqual([1, 2, 3]);
  });

  it('supports cursor draw hooks', () => {
    const store = createChartStore();
    const fn = vi.fn();
    store.cursorDrawHooks.add(fn);

    const dc = makeDC();
    const cursor = { left: 100, top: 50, activeGroup: 0, activeSeriesIdx: 1, activeDataIdx: 5 };
    for (const hook of store.cursorDrawHooks) hook(dc, cursor);

    expect(fn).toHaveBeenCalledWith(dc, cursor);
  });

  it('removing a hook by deleting works', () => {
    const store = createChartStore();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    store.drawHooks.add(fn1);
    store.drawHooks.add(fn2);

    // Remove fn1
    store.drawHooks.delete(fn1);

    const dc = makeDC();
    for (const hook of store.drawHooks) hook(dc);

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });
});
