import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RenderScheduler } from '@/core/RenderScheduler';

// DirtyFlag is a const enum, so we replicate values here
const None   = 0;
const Scales = 1;
const Axes   = 2;
const Paths  = 4;
const Cursor = 8;
const Select = 16;
const Size   = 32;
const Full   = 63;

describe('RenderScheduler', () => {
  let sched: RenderScheduler;

  beforeEach(() => {
    sched = new RenderScheduler();
  });

  it('starts with no dirty flags', () => {
    expect(sched.dirty).toBe(None);
    expect(sched.has(Scales)).toBe(false);
    expect(sched.has(Full)).toBe(false);
  });

  it('mark() sets the given flag', () => {
    sched.mark(Scales);
    expect(sched.has(Scales)).toBe(true);
    expect(sched.has(Axes)).toBe(false);
  });

  it('mark() accumulates multiple flags via bitwise OR', () => {
    sched.mark(Scales);
    sched.mark(Paths);
    sched.mark(Cursor);

    expect(sched.has(Scales)).toBe(true);
    expect(sched.has(Paths)).toBe(true);
    expect(sched.has(Cursor)).toBe(true);
    expect(sched.has(Axes)).toBe(false);
    expect(sched.dirty).toBe(Scales | Paths | Cursor);
  });

  it('clear() resets all flags to None', () => {
    sched.mark(Full);
    expect(sched.dirty).toBe(Full);

    sched.clear();
    expect(sched.dirty).toBe(None);
  });

  it('has() checks individual flags correctly', () => {
    sched.mark(Scales | Axes);

    expect(sched.has(Scales)).toBe(true);
    expect(sched.has(Axes)).toBe(true);
    expect(sched.has(Paths)).toBe(false);
    expect(sched.has(Cursor)).toBe(false);
  });

  it('onRedraw callback fires once per frame via RAF', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);

    sched.mark(Scales);
    sched.mark(Axes);
    sched.mark(Paths);

    // RAF is mocked as microtask — wait for it
    await Promise.resolve();
    await Promise.resolve();

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('multiple mark() calls coalesce to a single callback', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);

    // Mark 5 times — should only fire once
    sched.mark(Scales);
    sched.mark(Axes);
    sched.mark(Paths);
    sched.mark(Cursor);
    sched.mark(Select);

    await Promise.resolve();
    await Promise.resolve();

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('flags are cleared after the callback fires', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);

    sched.mark(Scales | Paths);

    await Promise.resolve();
    await Promise.resolve();

    expect(sched.dirty).toBe(None);
  });

  it('callback can read accumulated flags before clear', async () => {
    let capturedFlags = 0;
    sched.onRedraw(() => {
      capturedFlags = sched.dirty;
    });

    sched.mark(Scales);
    sched.mark(Cursor);

    await Promise.resolve();
    await Promise.resolve();

    expect(capturedFlags).toBe(Scales | Cursor);
    // After callback, flags are cleared
    expect(sched.dirty).toBe(None);
  });

  it('cancel() prevents pending frame from firing', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);

    sched.mark(Scales);
    sched.cancel();

    await Promise.resolve();
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('dispose() cleans up callback and flags', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);
    sched.mark(Full);

    sched.dispose();

    expect(sched.dirty).toBe(None);

    await Promise.resolve();
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('new marks after callback trigger another frame', async () => {
    const cb = vi.fn();
    sched.onRedraw(cb);

    sched.mark(Scales);
    await Promise.resolve();
    await Promise.resolve();
    expect(cb).toHaveBeenCalledTimes(1);

    // Second batch
    sched.mark(Paths);
    await Promise.resolve();
    await Promise.resolve();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('mark with no callback does not throw', async () => {
    // No onRedraw set
    expect(() => sched.mark(Scales)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });

  it('Size flag can be set and checked independently', () => {
    sched.mark(Size);
    expect(sched.has(Size)).toBe(true);
    expect(sched.has(Scales)).toBe(false);
    expect(sched.dirty).toBe(Size);
  });

  it('re-entrant mark() during callback survives and schedules a new frame', async () => {
    let callCount = 0;
    let secondCallDirty = 0;
    sched.onRedraw(() => {
      callCount++;
      if (callCount === 1) {
        // Re-entrant mark during the first callback
        sched.mark(Paths);
      } else if (callCount === 2) {
        secondCallDirty = sched.dirty;
      }
    });

    sched.mark(Scales);
    // Flush enough microtasks for both the initial and re-entrant RAF callbacks
    for (let i = 0; i < 6; i++) await Promise.resolve();
    expect(callCount).toBe(2);
    expect(secondCallDirty).toBe(Paths);
  });
});
