import { describe, it, expect } from 'vitest';
import { renderChart, flushEffects } from '../helpers/rtl';
import { Candlestick } from '@/components/Candlestick';
import { Series } from '@/components/Series';
import { Legend } from '@/components/Legend';
import type { DataInput } from '@/types/data';

/** OHLC data: 5 bars with open, high, low, close series */
const ohlcData: DataInput = [
  {
    x: [1, 2, 3, 4, 5],
    series: [
      [10, 12, 11, 13, 14],  // open
      [15, 16, 14, 17, 18],  // high
      [8, 9, 7, 10, 11],     // low
      [13, 11, 13, 15, 16],  // close
    ],
  },
];

describe('Candlestick internal series', () => {
  it('auto-registered OHLC series have internal source flag', async () => {
    const { store } = renderChart(
      { data: ohlcData },
      <Candlestick />,
    );
    await flushEffects();

    // Candlestick registers 4 hidden OHLC series (indices 0-3) — these claim
    // every data slot, so fillSeries() injects nothing.
    expect(store.seriesConfigs.length).toBe(4);
    for (const cfg of store.seriesConfigs) {
      expect(cfg._source).toBe('internal');
      expect(cfg.show).toBe(false);
    }
  });

  it('internal series do not appear in Legend', async () => {
    const { container } = renderChart(
      { data: ohlcData },
      <>
        <Candlestick />
        <Legend />
      </>,
    );
    await flushEffects();

    const items = container.querySelectorAll('[data-testid^="legend-item-"]');
    expect(items.length).toBe(0);
  });

  it('explicit user Series wins over internal Candlestick helper', async () => {
    const { store } = renderChart(
      { data: ohlcData },
      <>
        <Series group={0} index={0} label="My Open" stroke="red" />
        <Candlestick />
      </>,
    );
    await flushEffects();

    // The explicit user Series for (0,0) should win
    const cfg = store.seriesConfigMap.get('0:0');
    expect(cfg).toBeDefined();
    expect(cfg!.label).toBe('My Open');
    expect(cfg!._source).toBeUndefined();
  });

  it('explicit user Series wins regardless of JSX order', async () => {
    const { store } = renderChart(
      { data: ohlcData },
      <>
        <Candlestick />
        <Series group={0} index={0} label="My Open" stroke="red" />
      </>,
    );
    await flushEffects();

    const cfg = store.seriesConfigMap.get('0:0');
    expect(cfg).toBeDefined();
    expect(cfg!.label).toBe('My Open');
    expect(cfg!._source).toBeUndefined();
  });

  it('exposeUnderlyingSeries makes helpers visible in Legend', async () => {
    const { container } = renderChart(
      { data: ohlcData },
      <>
        <Candlestick exposeUnderlyingSeries />
        <Legend />
      </>,
    );
    await flushEffects();

    const items = container.querySelectorAll('[data-testid^="legend-item-"]');
    expect(items.length).toBe(4);
  });
});
