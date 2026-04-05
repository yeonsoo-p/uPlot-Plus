import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects, twoSeriesData } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { HoverLabel } from '@/components/HoverLabel';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';

function simulateCursor(store: ChartStore, dataIdx: number, seriesIdx = 0) {
  store.cursorManager.state.left = 100;
  store.cursorManager.state.top = 100;
  store.cursorManager.state.activeGroup = 0;
  store.cursorManager.state.activeSeriesIdx = seriesIdx;
  store.cursorManager.state.activeDataIdx = dataIdx;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

function clearCursor(store: ChartStore) {
  store.cursorManager.state.left = -10;
  store.cursorManager.state.top = -10;
  store.cursorManager.state.activeGroup = -1;
  store.cursorManager.state.activeSeriesIdx = -1;
  store.cursorManager.state.activeDataIdx = -1;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

describe('HoverLabel component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when show=false', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <HoverLabel show={false} delay={50} />
      </>,
    );
    await flushEffects();

    act(() => {
      simulateCursor(store, 2, 0);
    });
    act(() => { vi.advanceTimersByTime(100); });

    // No panel should render with Temp label
    expect(container.textContent).not.toContain('Temp');
  });

  it('returns null when cursor is inactive', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <HoverLabel delay={50} />
      </>,
    );
    await flushEffects();

    // No cursor activation — should not render
    act(() => { vi.advanceTimersByTime(200); });

    expect(container.textContent).not.toContain('Temp');
  });

  it('appears after delay when series is focused', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <HoverLabel delay={50} />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2, 0); });

    // Not visible yet — delay hasn't elapsed
    expect(container.textContent).not.toContain('Temp');

    act(() => { vi.advanceTimersByTime(60); });

    // Now visible
    expect(container.textContent).toContain('Temp');
  });

  it('resets timer when active series changes', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <Series group={0} index={1} label="Humidity" stroke="blue" />
        <HoverLabel delay={100} />
      </>,
    );
    await flushEffects();

    // Focus series 0, advance 60ms
    act(() => { simulateCursor(store, 2, 0); });
    act(() => { vi.advanceTimersByTime(60); });
    expect(container.textContent).not.toContain('Temp');

    // Switch to series 1 — timer should reset
    act(() => { simulateCursor(store, 2, 1); });
    act(() => { vi.advanceTimersByTime(60); });

    // Still not visible (only 60ms into new timer, need 100ms)
    expect(container.textContent).not.toContain('Humidity');

    act(() => { vi.advanceTimersByTime(50); });
    expect(container.textContent).toContain('Humidity');
  });

  it('hides immediately when series deactivates', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <HoverLabel delay={50} />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2, 0); });
    act(() => { vi.advanceTimersByTime(60); });
    expect(container.textContent).toContain('Temp');

    // Deactivate cursor
    act(() => { clearCursor(store); });
    expect(container.textContent).not.toContain('Temp');
  });

  it('does not show for series with legend=false', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" legend={false} />
        <HoverLabel delay={50} />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2, 0); });
    act(() => { vi.advanceTimersByTime(60); });

    expect(container.textContent).not.toContain('Temp');
  });

  it('cleans up timer on unmount', async () => {
    const { store, unmount } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temp" stroke="red" />
        <HoverLabel delay={50} />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2, 0); });

    // Unmount before delay fires — should not throw
    unmount();
    expect(() => { vi.advanceTimersByTime(100); }).not.toThrow();
  });
});
