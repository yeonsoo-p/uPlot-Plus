import { describe, it, expect } from 'vitest';
import { renderChart, flushEffects } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { Axis } from '@/components/Axis';
import { Scale } from '@/components/Scale';
import { Band } from '@/components/Band';
import { Side } from '@/types';

describe('Series config registration', () => {
  it('registers series config on mount', async () => {
    const { store } = renderChart({}, <Series group={0} index={0} label="S1" stroke="red" />);
    await flushEffects();
    expect(store.seriesConfigs.length).toBe(1);
    expect(store.seriesConfigs[0]?.group).toBe(0);
    expect(store.seriesConfigs[0]?.index).toBe(0);
    expect(store.seriesConfigs[0]?.label).toBe('S1');
  });

  it('unregisters series config on unmount', async () => {
    // autoFillSeries off — otherwise fillSeries re-injects a default at the
    // freed slot. Tested in autoFillSeries.test.tsx.
    const { store, unmount } = renderChart({ autoFillSeries: false }, <Series group={0} index={0} />);
    await flushEffects();
    expect(store.seriesConfigs.length).toBe(1);
    unmount();
    expect(store.seriesConfigs.length).toBe(0);
  });

  it('applies default color when stroke is omitted', async () => {
    const { store } = renderChart({}, <Series group={0} index={0} />);
    await flushEffects();
    expect(store.seriesConfigs[0]?.stroke).toBe('#e74c3c');
  });

  it('registers multiple series', async () => {
    const { store } = renderChart(
      {},
      <>
        <Series group={0} index={0} label="A" stroke="red" />
        <Series group={0} index={1} label="B" stroke="blue" />
      </>,
    );
    await flushEffects();
    expect(store.seriesConfigs.length).toBe(2);
    expect(store.seriesConfigs[0]?.label).toBe('A');
    expect(store.seriesConfigs[1]?.label).toBe('B');
  });

  it('defaults yScale to "y"', async () => {
    const { store } = renderChart({}, <Series group={0} index={0} />);
    await flushEffects();
    expect(store.seriesConfigs[0]?.yScale).toBe('y');
  });

  it('defaults show to true', async () => {
    const { store } = renderChart({}, <Series group={0} index={0} />);
    await flushEffects();
    expect(store.seriesConfigs[0]?.show).toBe(true);
  });
});

describe('Scale config registration', () => {
  it('registers scale on mount', async () => {
    const { store } = renderChart({}, <Scale id="y2" auto={true} />);
    await flushEffects();
    const found = store.scaleConfigs.find(s => s.id === 'y2');
    expect(found).toBeDefined();
    expect(found?.auto).toBe(true);
  });

  it('unregisters scale on unmount', async () => {
    const { store, unmount } = renderChart({}, <Scale id="y2" />);
    await flushEffects();
    expect(store.scaleConfigs.some(s => s.id === 'y2')).toBe(true);
    unmount();
    expect(store.scaleConfigs.some(s => s.id === 'y2')).toBe(false);
  });
});

describe('Axis config registration', () => {
  it('registers axis with default side for x scale', async () => {
    const { store } = renderChart({}, <Axis scale="x" />);
    await flushEffects();
    const found = store.axisConfigs.find(a => a.scale === 'x');
    expect(found).toBeDefined();
    expect(found?.side).toBe(Side.Bottom);
  });

  it('registers axis with default side for y scale', async () => {
    const { store } = renderChart({}, <Axis scale="y" />);
    await flushEffects();
    const found = store.axisConfigs.find(a => a.scale === 'y' && a._default !== true);
    expect(found).toBeDefined();
    expect(found?.side).toBe(Side.Left);
  });

  it('registers axis with explicit side', async () => {
    const { store } = renderChart({}, <Axis scale="y" side={Side.Right} />);
    await flushEffects();
    const found = store.axisConfigs.find(a => a.scale === 'y' && a.side === Side.Right);
    expect(found).toBeDefined();
  });

  it('unregisters axis on unmount', async () => {
    const { store, unmount } = renderChart({}, <Axis scale="y" side={Side.Right} />);
    await flushEffects();
    expect(store.axisConfigs.some(a => a.scale === 'y' && a.side === Side.Right)).toBe(true);
    unmount();
    expect(store.axisConfigs.some(a => a.scale === 'y' && a.side === Side.Right)).toBe(false);
  });
});

describe('Band config registration', () => {
  it('registers band on mount', async () => {
    const { store } = renderChart(
      {},
      <>
        <Series group={0} index={0} />
        <Series group={0} index={1} />
        <Band group={0} series={[0, 1]} fill="rgba(0,0,255,0.2)" />
      </>,
    );
    await flushEffects();
    expect(store.bandConfigs.length).toBe(1);
    expect(store.bandConfigs[0]?.fill).toBe('rgba(0,0,255,0.2)');
  });

  it('unregisters band on unmount', async () => {
    const { store, unmount } = renderChart(
      {},
      <Band group={0} series={[0, 1]} fill="blue" />,
    );
    await flushEffects();
    expect(store.bandConfigs.length).toBe(1);
    unmount();
    expect(store.bandConfigs.length).toBe(0);
  });
});
