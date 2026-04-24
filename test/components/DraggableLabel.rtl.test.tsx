import React from 'react';
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects, defaultData } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { useDraggableOverlay } from '@/hooks/useDraggableOverlay';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';

function bumpCursorOnly(store: ChartStore, left: number, top: number): void {
  store.cursorManager.state.left = left;
  store.cursorManager.state.top = top;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

function HookProbe({
  mode,
  countRef,
}: {
  mode: 'cursor' | 'draggable';
  countRef: React.MutableRefObject<number>;
}): null {
  countRef.current += 1;
  useDraggableOverlay({
    mode,
    show: true,
    position: 'top-left',
    offset: { x: 0, y: 0 },
    idleOpacity: 0.8,
    estimatedSize: { w: 100, h: 28 },
  });
  return null;
}

describe('useDraggableOverlay subscribe-channel selection', () => {
  it('draggable mode does not re-render on cursor-only notifies', async () => {
    const renders = { current: 0 };

    const { store } = renderChart(
      { data: defaultData },
      <>
        <Series group={0} index={0} label="A" stroke="red" />
        <HookProbe mode="draggable" countRef={renders} />
      </>,
    );
    await flushEffects();

    const baseline = renders.current;
    expect(baseline).toBeGreaterThan(0);

    act(() => {
      bumpCursorOnly(store, 100, 100);
      bumpCursorOnly(store, 110, 110);
      bumpCursorOnly(store, 120, 120);
    });
    await flushEffects();

    // Draggable mode subscribes to the full-redraw channel — cursor-only
    // notifies must not trigger React commits.
    expect(renders.current).toBe(baseline);
  });

  it('cursor mode does re-render on cursor-only notifies (positive control)', async () => {
    const renders = { current: 0 };

    const { store } = renderChart(
      { data: defaultData },
      <>
        <Series group={0} index={0} label="A" stroke="red" />
        <HookProbe mode="cursor" countRef={renders} />
      </>,
    );
    await flushEffects();

    const baseline = renders.current;

    act(() => { bumpCursorOnly(store, 100, 100); });
    await flushEffects();

    // Cursor mode reads snap.left/snap.top → must commit when cursor moves.
    expect(renders.current).toBeGreaterThan(baseline);
  });
});
