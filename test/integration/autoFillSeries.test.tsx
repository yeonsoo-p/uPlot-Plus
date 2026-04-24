import { describe, it, expect } from 'vitest';
import { renderChart, flushEffects } from '../helpers/rtl';
import { Series } from '@/components/Series';
import type { DataInput } from '@/types/data';

describe('autoFillSeries', () => {
  it('renders one fill config for {x,y} data with no Series children', async () => {
    const data: DataInput = { x: [1, 2, 3], y: [10, 20, 30] };
    const { store } = renderChart({ data });
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(1);
    expect(store.seriesConfigs[0]).toMatchObject({
      group: 0,
      index: 0,
      yScale: 'y',
      show: true,
      _source: 'fill',
    });
  });

  it('renders one fill per series in a multi-series group', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60], [70, 80, 90]] }];
    const { store } = renderChart({ data });
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(3);
    for (const cfg of store.seriesConfigs) {
      expect(cfg._source).toBe('fill');
    }
    expect(store.seriesConfigs.map(c => c.index)).toEqual([0, 1, 2]);
  });

  it('renders fills across multiple x-groups', async () => {
    const data: DataInput = [
      { x: [1, 2, 3], series: [[10, 20, 30]] },
      { x: [4, 5, 6], series: [[40, 50, 60]] },
    ];
    const { store } = renderChart({ data });
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(2);
    expect(store.seriesConfigs.map(c => ({ g: c.group, i: c.index }))).toEqual([
      { g: 0, i: 0 },
      { g: 1, i: 0 },
    ]);
  });

  it('explicit Series at slot (0,0) replaces the fill at that slot only', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60], [70, 80, 90]] }];
    const { store } = renderChart(
      { data },
      <Series group={0} index={0} label="A" stroke="red" />,
    );
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(3);
    const slot00 = store.seriesConfigMap.get('0:0');
    expect(slot00?._source).toBeUndefined();
    expect(slot00?.label).toBe('A');
    expect(slot00?.stroke).toBe('red');
    // Other two slots remain auto-filled
    expect(store.seriesConfigMap.get('0:1')?._source).toBe('fill');
    expect(store.seriesConfigMap.get('0:2')?._source).toBe('fill');
  });

  it('autoFillSeries={false} renders no series when no Series children', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] }];
    const { store } = renderChart({ data, autoFillSeries: false });
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(0);
  });

  it('autoFillSeries={false} still renders explicit Series children', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] }];
    const { store } = renderChart(
      { data, autoFillSeries: false },
      <Series group={0} index={0} label="A" />,
    );
    await flushEffects();

    expect(store.seriesConfigs).toHaveLength(1);
    expect(store.seriesConfigs[0]?.label).toBe('A');
  });

  it('bare <Series /> auto-bumps to next unclaimed slot', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60], [70, 80, 90]] }];
    const { store } = renderChart(
      { data },
      <>
        <Series label="A" />
        <Series label="B" />
      </>,
    );
    await flushEffects();

    // Two explicit + one fill (slot 0:2)
    expect(store.seriesConfigs).toHaveLength(3);
    expect(store.seriesConfigMap.get('0:0')?.label).toBe('A');
    expect(store.seriesConfigMap.get('0:1')?.label).toBe('B');
    expect(store.seriesConfigMap.get('0:2')?._source).toBe('fill');
  });

  it('unregistering an explicit Series re-injects a fill at that slot', async () => {
    const data: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30], [40, 50, 60]] }];
    const { store } = renderChart(
      { data },
      <Series group={0} index={0} label="A" stroke="red" />,
    );
    await flushEffects();
    expect(store.seriesConfigMap.get('0:0')?.label).toBe('A');
    expect(store.seriesConfigMap.get('0:0')?._source).toBeUndefined();

    store.unregisterSeries(0, 0);
    expect(store.seriesConfigMap.get('0:0')?._source).toBe('fill');
  });

  it('reshape: adding a series in data injects a new fill', async () => {
    const data1: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30]] }];
    const { store } = renderChart({ data: data1 });
    await flushEffects();
    expect(store.seriesConfigs).toHaveLength(1);

    store.setData([
      { x: new Float64Array([1, 2, 3]), series: [new Float64Array([10, 20, 30]), new Float64Array([40, 50, 60])] },
    ]);
    expect(store.seriesConfigs).toHaveLength(2);
    expect(store.seriesConfigMap.get('0:1')?._source).toBe('fill');
  });

  it('streaming setData with same shape does not invalidate fills', async () => {
    const data1: DataInput = [{ x: [1, 2, 3], series: [[10, 20, 30]] }];
    const { store } = renderChart({ data: data1 });
    await flushEffects();

    const beforeFill = store.seriesConfigMap.get('0:0');
    expect(beforeFill?._source).toBe('fill');
    const beforeStroke = beforeFill?.stroke;

    // Same shape (1 group, 1 series) — fillSeries should NOT re-run
    store.setData([
      { x: new Float64Array([2, 3, 4]), series: [new Float64Array([15, 25, 35])] },
    ]);
    await flushEffects();

    const afterFill = store.seriesConfigMap.get('0:0');
    expect(afterFill?._source).toBe('fill');
    // Same reference — fill wasn't dropped + recreated
    expect(afterFill).toBe(beforeFill);
    expect(afterFill?.stroke).toBe(beforeStroke);
  });
});
