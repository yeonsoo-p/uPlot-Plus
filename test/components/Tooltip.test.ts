import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { renderChart, flushEffects } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { Tooltip } from '@/components/Tooltip';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';
import type { TooltipData } from '@/types/tooltip';
import type { DataInput } from '@/types/data';
import React from 'react';

/**
 * Tests for the Tooltip component's data extraction, positioning, and modes.
 *
 * These tests render the real Tooltip component inside a <Chart> and drive
 * cursor state via the store — the same approach used by the RTL test suite.
 * A custom children render function captures the TooltipData that the
 * component would pass to any render prop, letting us assert on the exact
 * values without mirroring internal logic.
 */

const testData: DataInput = [
  { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90], [20, 50, 80, 40, 100]] },
];

function simulateCursor(store: ChartStore, dataIdx: number, opts?: { left?: number; top?: number; group?: number }) {
  store.cursorManager.state.left = opts?.left ?? 100;
  store.cursorManager.state.top = opts?.top ?? 100;
  store.cursorManager.state.activeGroup = opts?.group ?? 0;
  store.cursorManager.state.activeSeriesIdx = 0;
  store.cursorManager.state.activeDataIdx = dataIdx;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

function clearCursor(store: ChartStore) {
  store.cursorManager.state.left = -1;
  store.cursorManager.state.top = -1;
  store.cursorManager.state.activeGroup = -1;
  store.cursorManager.state.activeSeriesIdx = -1;
  store.cursorManager.state.activeDataIdx = -1;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

describe('Tooltip data extraction', () => {
  it('extracts x label and series values at cursor position', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', { 'data-testid': 'spy' }, data.xLabel);
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { children: spy }),
      ),
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    expect(captured).not.toBeNull();
    expect(captured!.xLabel).toBe('50');
    expect(captured!.items).toHaveLength(2);
    expect(captured!.items[0]!.label).toBe('Temperature');
    expect(captured!.items[0]!.value).toBe(70);
    expect(captured!.items[1]!.label).toBe('Pressure');
    expect(captured!.items[1]!.value).toBe(80);
  });

  it('returns no panel when activeDataIdx is -1', async () => {
    const { container } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Tooltip, null),
      ),
    );
    await flushEffects();

    // Cursor is inactive by default — no tooltip
    const tooltip = container.querySelector('[data-testid="tooltip-panel"]');
    expect(tooltip).toBeNull();
  });

  it('excludes hidden series', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { children: spy }),
      ),
    );
    await flushEffects();

    // Hide Pressure series
    act(() => { store.toggleSeries(0, 1); });

    act(() => { simulateCursor(store, 2); });

    expect(captured).not.toBeNull();
    expect(captured!.items).toHaveLength(1);
    expect(captured!.items[0]!.label).toBe('Temperature');
  });

  it('formats x label with specified precision', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Tooltip, { precision: 4, children: spy }),
      ),
    );
    await flushEffects();

    act(() => { simulateCursor(store, 1); });

    expect(captured).not.toBeNull();
    expect(captured!.xLabel).toBe('25');
  });
});

describe('Tooltip position clamping', () => {
  it('positions tooltip absolutely with left/top style', async () => {
    const { store, container } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Tooltip, null),
      ),
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    const tooltip = container.querySelector<HTMLElement>('[data-testid="tooltip-panel"]');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.style.position).toBe('absolute');
  });
});

describe('Tooltip draggable mode data extraction', () => {
  it('shows series values when cursor is on chart', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { mode: 'draggable', children: spy }),
      ),
    );
    await flushEffects();

    act(() => { simulateCursor(store, 2); });

    expect(captured).not.toBeNull();
    expect(captured!.xLabel).toBe('50');
    expect(captured!.items).toHaveLength(2);
    expect(captured!.items[0]!.value).toBe(70);
    expect(captured!.items[1]!.value).toBe(80);
  });

  it('shows null values (dashes) when cursor is off chart', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { mode: 'draggable', children: spy }),
      ),
    );
    await flushEffects();

    // Ensure cursor is cleared (off-chart)
    act(() => { clearCursor(store); });

    expect(captured).not.toBeNull();
    expect(captured!.xLabel).toBe('');
    expect(captured!.items).toHaveLength(2);
    expect(captured!.items[0]!.label).toBe('Temperature');
    expect(captured!.items[0]!.value).toBeNull();
    expect(captured!.items[1]!.label).toBe('Pressure');
    expect(captured!.items[1]!.value).toBeNull();
  });

  it('excludes hidden series in draggable mode', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { mode: 'draggable', children: spy }),
      ),
    );
    await flushEffects();

    act(() => { store.toggleSeries(0, 1); }); // hide Pressure
    act(() => { clearCursor(store); });

    expect(captured).not.toBeNull();
    expect(captured!.items).toHaveLength(1);
    expect(captured!.items[0]!.label).toBe('Temperature');
  });

  it('preserves item colors from series config', async () => {
    let captured: TooltipData | null = null;
    const spy = (data: TooltipData) => {
      captured = data;
      return React.createElement('span', null, 'spy');
    };

    const { store } = renderChart(
      { data: testData },
      React.createElement(React.Fragment, null,
        React.createElement(Series, { group: 0, index: 0, label: 'Temperature', stroke: 'red' }),
        React.createElement(Series, { group: 0, index: 1, label: 'Pressure', stroke: 'blue' }),
        React.createElement(Tooltip, { children: spy }),
      ),
    );
    await flushEffects();

    act(() => { simulateCursor(store, 0); });

    expect(captured).not.toBeNull();
    expect(captured!.items[0]!.color).toBe('red');
    expect(captured!.items[1]!.color).toBe('blue');
  });
});
