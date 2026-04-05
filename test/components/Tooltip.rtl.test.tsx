import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects, twoSeriesData } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { Tooltip } from '@/components/Tooltip';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';

/**
 * Simulate cursor activation on the store and notify subscribers.
 * This directly sets cursor state rather than dispatching DOM events,
 * because the interaction layer is already tested separately.
 */
function simulateCursor(store: ChartStore, dataIdx: number) {
  const data = store.dataStore.data;
  const group = data[0];
  if (group == null) return;

  store.cursorManager.state.left = 100;
  store.cursorManager.state.top = 100;
  store.cursorManager.state.activeGroup = 0;
  store.cursorManager.state.activeSeriesIdx = 0;
  store.cursorManager.state.activeDataIdx = dataIdx;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

describe('Tooltip component', () => {
  it('renders nothing when cursor is inactive', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip />
      </>,
    );
    await flushEffects();

    // No tooltip panel should exist when cursor is inactive
    const tooltip = container.querySelector('[data-testid="tooltip-panel"]');
    expect(tooltip).toBeNull();
  });

  it('renders panel when cursor is active', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip />
      </>,
    );
    await flushEffects();

    // Simulate cursor at data index 2
    act(() => { simulateCursor(store, 2); });

    const tooltip = container.querySelector('[data-testid="tooltip-panel"]');
    expect(tooltip).toBeInTheDocument();
  });

  it('hides when show={false} even with active cursor', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip show={false} />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    const tooltip = container.querySelector('[data-testid="tooltip-panel"]');
    expect(tooltip).toBeNull();
  });

  it('uses custom children render function', async () => {
    const { store, getByTestId } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip>
          {(data) => <div data-testid="custom-tooltip">{data.xLabel}</div>}
        </Tooltip>
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    const custom = getByTestId('custom-tooltip');
    expect(custom).toBeInTheDocument();
  });

  it('applies className to tooltip wrapper', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip className="my-tip" />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    const el = container.querySelector('.my-tip');
    expect(el).toBeInTheDocument();
  });

  it('positions tooltip absolutely', async () => {
    const { store, container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Tooltip />
      </>,
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    const tooltip = container.querySelector('[data-testid="tooltip-panel"]') as HTMLElement;
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.style.position).toBe('absolute');
  });
});
