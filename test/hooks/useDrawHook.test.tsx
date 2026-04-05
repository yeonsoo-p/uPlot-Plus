import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects } from '../helpers/rtl';
import { useDrawHook, useCursorDrawHook } from '@/hooks/useDrawHook';
import type { DrawCallback, CursorDrawCallback } from '@/types/hooks';

/** Component that calls useDrawHook with the provided callback */
function DrawHookProbe({ fn, clipped }: { fn: DrawCallback; clipped?: boolean }) {
  useDrawHook(fn, clipped != null ? { clipped } : undefined);
  return null;
}

/** Component that calls useCursorDrawHook */
function CursorDrawHookProbe({ fn }: { fn: CursorDrawCallback }) {
  useCursorDrawHook(fn);
  return null;
}

describe('useDrawHook', () => {
  it('registers callback in store.drawHooks (clipped by default)', async () => {
    const fn = vi.fn();
    const { store } = renderChart({}, <DrawHookProbe fn={fn} />);
    await flushEffects();

    // Store may have existing hooks; just verify ours was added
    const sizeBefore = store.drawHooks.size;
    expect(sizeBefore).toBeGreaterThanOrEqual(1);

    // Verify our fn is callable through one of the wrappers
    const mockDc = {} as Parameters<DrawCallback>[0];
    for (const w of store.drawHooks) w(mockDc);
    expect(fn).toHaveBeenCalledWith(mockDc);
  });

  it('registers callback in store.unclippedDrawHooks when clipped=false', async () => {
    const fn = vi.fn();
    const { store } = renderChart({}, <DrawHookProbe fn={fn} clipped={false} />);
    await flushEffects();

    expect(store.unclippedDrawHooks.size).toBeGreaterThanOrEqual(1);

    const mockDc = {} as Parameters<DrawCallback>[0];
    for (const w of store.unclippedDrawHooks) w(mockDc);
    expect(fn).toHaveBeenCalledWith(mockDc);
  });

  it('removes callback on unmount', async () => {
    const fn = vi.fn();
    const { store, unmount } = renderChart({}, <DrawHookProbe fn={fn} />);
    await flushEffects();

    const sizeBefore = store.drawHooks.size;
    unmount();

    expect(store.drawHooks.size).toBeLessThan(sizeBefore);
  });

  it('wrapper calls latest fn ref after callback swap (no remount)', async () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    // Stateful wrapper that lets us swap the callback without unmounting
    let swapFn: (next: DrawCallback) => void = () => {};
    function SwappableProbe() {
      const [fn, setFn] = useState<DrawCallback>(() => fn1);
      swapFn = (next: DrawCallback) => setFn(() => next);
      useDrawHook(fn);
      return null;
    }

    const { store } = renderChart({}, <SwappableProbe />);
    await flushEffects();

    // Identify our wrapper: invoke all, only ours delegates to fn1
    const mockDc = {} as Parameters<DrawCallback>[0];
    for (const w of store.drawHooks) w(mockDc);
    expect(fn1).toHaveBeenCalled();

    // Find the exact wrapper that called fn1 by testing one-by-one
    let ourWrapper: DrawCallback | undefined;
    fn1.mockClear();
    for (const w of store.drawHooks) {
      fn1.mockClear();
      w(mockDc);
      if (fn1.mock.calls.length > 0) {
        ourWrapper = w;
        break;
      }
    }
    expect(ourWrapper).toBeDefined();

    // Swap callback — triggers re-render + useLayoutEffect updates fnRef
    fn1.mockClear();
    act(() => { swapFn(fn2); });

    // After swap: same wrapper should now delegate to fn2
    ourWrapper!(mockDc);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).not.toHaveBeenCalled();
  });
});

describe('useCursorDrawHook', () => {
  it('registers in store.cursorDrawHooks', async () => {
    const fn = vi.fn();
    const { store } = renderChart({}, <CursorDrawHookProbe fn={fn} />);
    await flushEffects();

    expect(store.cursorDrawHooks.size).toBeGreaterThanOrEqual(1);

    // Verify our fn is callable
    const mockDc = {} as Parameters<CursorDrawCallback>[0];
    const mockCursor = {} as Parameters<CursorDrawCallback>[1];
    for (const w of store.cursorDrawHooks) w(mockDc, mockCursor);
    expect(fn).toHaveBeenCalledWith(mockDc, mockCursor);
  });

  it('removes on unmount', async () => {
    const fn = vi.fn();
    const { store, unmount } = renderChart({}, <CursorDrawHookProbe fn={fn} />);
    await flushEffects();

    const sizeBefore = store.cursorDrawHooks.size;
    unmount();

    expect(store.cursorDrawHooks.size).toBeLessThan(sizeBefore);
  });

  it('wrapper delegates to provided callback', async () => {
    const fn = vi.fn();
    const { store } = renderChart({}, <CursorDrawHookProbe fn={fn} />);
    await flushEffects();

    const mockDc = {} as Parameters<CursorDrawCallback>[0];
    const mockCursor = {} as Parameters<CursorDrawCallback>[1];
    for (const w of store.cursorDrawHooks) w(mockDc, mockCursor);

    expect(fn).toHaveBeenCalledWith(mockDc, mockCursor);
  });
});
