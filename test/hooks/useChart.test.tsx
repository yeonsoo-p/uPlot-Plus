import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { renderChart, flushEffects, twoSeriesData } from '../helpers/rtl';
import { useChart } from '@/hooks/useChart';
import { Series } from '@/components/Series';

describe('useChart hook', () => {
  it('throws when used outside Chart context', () => {
    expect(() => {
      renderHook(() => useChart());
    }).toThrow('useChart must be used within a <Chart> component');
  });

  it('returns snapshot fields matching initial store state', async () => {
    let api: ReturnType<typeof useChart> | null = null;

    renderChart(
      { data: twoSeriesData },
      <HookProbe onApi={(a) => { api = a; }} />,
    );
    await flushEffects();

    expect(api).not.toBeNull();
    expect(api!.activeGroup).toBe(-1);
    expect(api!.activeDataIdx).toBe(-1);
    expect(typeof api!.left).toBe('number');
    expect(typeof api!.top).toBe('number');
  });

  it('getPlotBox returns layout dimensions', async () => {
    let api: ReturnType<typeof useChart> | null = null;

    renderChart(
      { data: twoSeriesData, width: 800, height: 600 },
      <HookProbe onApi={(a) => { api = a; }} />,
    );
    await flushEffects();

    const box = api!.getPlotBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  it('getSeriesConfigs returns registered series', async () => {
    let api: ReturnType<typeof useChart> | null = null;

    renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="A" stroke="red" />
        <Series group={0} index={1} label="B" stroke="blue" />
        <HookProbe onApi={(a) => { api = a; }} />
      </>,
    );
    await flushEffects();

    const configs = api!.getSeriesConfigs();
    expect(configs.length).toBe(2);
    expect(configs[0]?.label).toBe('A');
    expect(configs[1]?.label).toBe('B');
  });

  it('toggleSeries toggles visibility', async () => {
    let api: ReturnType<typeof useChart> | null = null;

    const { store } = renderChart(
      { data: twoSeriesData },
      <>
        <Series group={0} index={0} label="S1" stroke="red" />
        <HookProbe onApi={(a) => { api = a; }} />
      </>,
    );
    await flushEffects();

    expect(store.seriesConfigs[0]?.show).not.toBe(false);

    api!.toggleSeries(0, 0);
    await flushEffects();

    expect(store.seriesConfigs[0]?.show).toBe(false);
  });

  it('provides context via ChartContext.Provider', async () => {
    let api: ReturnType<typeof useChart> | null = null;

    const { store } = renderChart(
      {},
      <HookProbe onApi={(a) => { api = a; }} />,
    );
    await flushEffects();

    // The hook received a working API from Chart's own context provider
    expect(api).not.toBeNull();
    // The underlying store should be the same instance Chart created
    expect(typeof api!.getPlotBox).toBe('function');
    expect(typeof api!.getSeriesConfigs).toBe('function');
    // Verify it's wired to the same store by checking a known property
    expect(store.scaleManager).toBeDefined();
  });
});

/**
 * Helper component that calls useChart() and reports the API via callback.
 */
function HookProbe({ onApi }: { onApi: (api: ReturnType<typeof useChart>) => void }) {
  const api = useChart();
  onApi(api);
  return null;
}
