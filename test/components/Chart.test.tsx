import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { Chart } from '@/components/Chart';
import { renderChart, flushEffects, defaultData, StoreProbe } from '../helpers/rtl';
import type { ChartStore } from '@/hooks/useChartStore';

describe('Chart component', () => {
  it('renders a canvas element inside the container', () => {
    const { container } = renderChart();
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('sets container dimensions via inline style', () => {
    const { container } = renderChart({ width: 800, height: 600 });
    const inner = container.querySelector('div[tabindex]') as HTMLElement;
    expect(inner).toBeInTheDocument();
    expect(inner.style.width).toBe('800px');
    expect(inner.style.height).toBe('600px');
  });

  it('applies className to the outer wrapper div', () => {
    const { container } = renderChart({ className: 'my-chart' });
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('my-chart');
  });

  it('renders children inside the context provider', () => {
    const { getByTestId } = renderChart({}, <div data-testid="child">Hello</div>);
    expect(getByTestId('child')).toBeInTheDocument();
    expect(getByTestId('child').textContent).toBe('Hello');
  });

  it('provides ChartStore via context', () => {
    const { store } = renderChart();
    expect(store).toBeDefined();
    expect(store.scaleManager).toBeDefined();
    expect(store.dataStore).toBeDefined();
  });

  it('sets canvas element on store', async () => {
    const { store, container } = renderChart();
    await flushEffects();
    const canvas = container.querySelector('canvas');
    expect(store.canvas).toBe(canvas);
  });

  it('syncs size to store', async () => {
    const { store } = renderChart({ width: 800, height: 600 });
    await flushEffects();
    expect(store.width).toBe(800);
    expect(store.height).toBe(600);
  });

  it('updates store size when width/height props change', async () => {
    const storeRef: React.MutableRefObject<ChartStore | null> = { current: null };

    const result = render(
      <Chart width={800} height={600} data={defaultData}>
        <StoreProbe storeRef={storeRef} />
      </Chart>,
    );
    await act(async () => {});

    const store = storeRef.current!;
    expect(store.width).toBe(800);
    expect(store.height).toBe(600);

    result.rerender(
      <Chart width={1000} height={400} data={defaultData}>
        <StoreProbe storeRef={storeRef} />
      </Chart>,
    );
    await act(async () => {});

    expect(store.width).toBe(1000);
    expect(store.height).toBe(400);
  });

  it('loads data into store', async () => {
    const { store } = renderChart({ data: defaultData });
    await flushEffects();
    expect(store.dataStore.data.length).toBeGreaterThan(0);
    expect(store.dataStore.data[0]?.x.length).toBe(5);
  });

  it('syncs event callback props to store', async () => {
    const onClick = vi.fn();
    const onCursorMove = vi.fn();
    const { store } = renderChart({ onClick, onCursorMove });
    await flushEffects();
    expect(store.eventCallbacks.onClick).toBe(onClick);
    expect(store.eventCallbacks.onCursorMove).toBe(onCursorMove);
  });

  it('sets title and axis labels on store', async () => {
    const { store } = renderChart({ title: 'My Chart', xlabel: 'Time', ylabel: 'Value' });
    await flushEffects();
    expect(store.title).toBe('My Chart');
    expect(store.xlabel).toBe('Time');
    expect(store.ylabel).toBe('Value');
  });

  it('cleans up canvas on unmount', async () => {
    const { store, unmount } = renderChart();
    await flushEffects();
    expect(store.canvas).not.toBeNull();
    unmount();
    expect(store.canvas).toBeNull();
  });
});
