import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderChart, flushEffects, twoSeriesData } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { Legend } from '@/components/Legend';

describe('Legend component', () => {
  it('renders a legend item for each registered series', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temperature" stroke="red" />
        <Series group={0} index={1} label="Humidity" stroke="blue" />
        <Legend />
      </>,
    );
    await flushEffects();

    const items = container.querySelectorAll('[data-testid^="legend-item-"]');
    expect(items.length).toBe(2);
  });

  it('shows series labels', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Temperature" stroke="red" />
        <Series group={0} index={1} label="Humidity" stroke="blue" />
        <Legend />
      </>,
    );
    await flushEffects();

    expect(container.textContent).toContain('Temperature');
    expect(container.textContent).toContain('Humidity');
  });

  it('displays color swatches matching series stroke', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Legend />
      </>,
    );
    await flushEffects();

    const item = container.querySelector('[data-testid="legend-item-0-0"]');
    expect(item).toBeInTheDocument();
    const swatch = item!.querySelector('span');
    expect(swatch!.style.backgroundColor).toBe('red');
  });

  it('clicking a legend item toggles series visibility', async () => {
    const { store, getByText } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="Toggle Me" stroke="red" />
        <Legend />
      </>,
    );
    await flushEffects();

    expect(store.seriesConfigs[0]?.show).not.toBe(false);

    fireEvent.click(getByText('Toggle Me'));
    await flushEffects();

    expect(store.seriesConfigs[0]?.show).toBe(false);
  });

  it('hides when show={false}', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Legend show={false} />
      </>,
    );
    await flushEffects();

    // Legend should not render any wrapper div with flex layout
    const legendWrapper = container.querySelector('[data-testid="legend"]');
    expect(legendWrapper).toBeNull();
  });

  it('renders at top with order:-1 when position="top"', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Legend position="top" />
      </>,
    );
    await flushEffects();

    const legendWrapper = container.querySelector<HTMLElement>('[data-testid="legend"]')!;
    expect(legendWrapper).toBeInTheDocument();
    expect(legendWrapper.style.order).toBe('-1');
  });

  it('renders at bottom with order:1 when position="bottom"', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Legend position="bottom" />
      </>,
    );
    await flushEffects();

    const legendWrapper = container.querySelector<HTMLElement>('[data-testid="legend"]')!;
    expect(legendWrapper).toBeInTheDocument();
    expect(legendWrapper.style.order).toBe('1');
  });

  it('applies className to wrapper', async () => {
    const { container } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <Legend className="my-legend" />
      </>,
    );
    await flushEffects();

    const el = container.querySelector('.my-legend');
    expect(el).toBeInTheDocument();
  });

  it('shows default label when series has no label prop', async () => {
    const { getByText } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} stroke="red" />
        <Legend />
      </>,
    );
    await flushEffects();

    expect(getByText('Series 0')).toBeInTheDocument();
  });
});
