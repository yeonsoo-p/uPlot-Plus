import { describe, it, expect } from 'vitest';
import { renderChart, flushEffects } from '../helpers/rtl';
import { BoxWhisker } from '@/components/BoxWhisker';
import type { DataInput } from '@/types/data';

const boxes = [
  { min: 5, q1: 15, median: 25, q3: 35, max: 45 },
  { min: 10, q1: 20, median: 30, q3: 40, max: 50 },
  { min: 0, q1: 10, median: 20, q3: 30, max: 60 },
];

/** Minimal placeholder data for BoxWhisker */
const placeholderData: DataInput = [
  { x: [1, 2, 3], series: [[0, 0, 0]] },
];

describe('BoxWhisker convenience mode', () => {
  it('auto-registers x and y scales from box data', async () => {
    const { store } = renderChart(
      { data: placeholderData },
      <BoxWhisker boxes={boxes} />,
    );
    await flushEffects();

    // x scale: [0.5, boxes.length + 0.5]
    const xScale = store.scaleConfigs.find(s => s.id === 'x');
    expect(xScale).toBeDefined();
    expect(xScale!.min).toBe(0.5);
    expect(xScale!.max).toBe(3.5);

    // y scale: inferred from min/max across boxes with 10% padding
    const yScale = store.scaleConfigs.find(s => s.id === 'y');
    expect(yScale).toBeDefined();
    // Global min=0, max=60 → range=60, pad=6 → min=-6, max=66
    expect(yScale!.min).toBe(-6);
    expect(yScale!.max).toBe(66);
  });

  it('registers internal placeholder series', async () => {
    const { store } = renderChart(
      { data: placeholderData },
      <BoxWhisker boxes={boxes} />,
    );
    await flushEffects();

    const cfg = store.seriesConfigs.find(s => s.group === 0 && s.index === 0);
    expect(cfg).toBeDefined();
    expect(cfg!._source).toBe('internal');
    expect(cfg!.show).toBe(false);
  });

  it('skips auto-provisioning when autoScales is false', async () => {
    const { store } = renderChart(
      { data: placeholderData, autoFillSeries: false },
      <BoxWhisker boxes={boxes} autoScales={false} />,
    );
    await flushEffects();

    // No BoxWhisker-registered series or fill-injected ones
    expect(store.seriesConfigs.length).toBe(0);
  });

  it('exposeUnderlyingSeries clears the internal source flag', async () => {
    const { store } = renderChart(
      { data: placeholderData },
      <BoxWhisker boxes={boxes} exposeUnderlyingSeries />,
    );
    await flushEffects();

    const cfg = store.seriesConfigs.find(s => s.group === 0 && s.index === 0);
    expect(cfg).toBeDefined();
    expect(cfg!._source).toBeUndefined();
  });

  it('empty boxes array does not register NaN scales', async () => {
    const { store } = renderChart(
      { data: placeholderData },
      <BoxWhisker boxes={[]} />,
    );
    await flushEffects();

    // With an empty boxes array, BoxWhisker should not register fixed scales
    // with NaN bounds. Any y scale present should have valid (finite or undefined) bounds.
    for (const s of store.scaleConfigs) {
      if (s.min != null) expect(Number.isFinite(s.min)).toBe(true);
      if (s.max != null) expect(Number.isFinite(s.max)).toBe(true);
    }
  });
});
