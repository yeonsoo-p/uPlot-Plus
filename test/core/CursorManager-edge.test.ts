import { describe, it, expect, beforeEach } from 'vitest';
import { CursorManager } from '@/core/CursorManager';
import type { ChartData } from '@/types/data';
import type { SeriesConfig } from '@/types/series';
import { createScaleState } from '@/core/Scale';
import type { ScaleState, BBox } from '@/types';
import { Orientation } from '@/types/common';

function makeScale(id: string, min: number, max: number, ori = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id, min, max, ori }) };
}

const plotBox: BBox = { left: 50, top: 20, width: 700, height: 560 };

const scales = new Map<string, ScaleState>([
  ['x', makeScale('x', 0, 100)],
  ['y', makeScale('y', 0, 100, Orientation.Vertical)],
]);

function getScale(id: string): ScaleState | undefined {
  return scales.get(id);
}

function getGroupXScaleKey(_gi: number): string | undefined {
  return 'x';
}

function getWindow(_gi: number): [number, number] {
  return [0, 4];
}

describe('CursorManager: edge cases', () => {
  let mgr: CursorManager;

  beforeEach(() => {
    mgr = new CursorManager();
  });

  it('handles empty data array without crashing', () => {
    const data: ChartData = [];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);

    expect(mgr.state.activeGroup).toBe(-1);
    expect(mgr.state.activeDataIdx).toBe(-1);
  });

  it('handles group with empty x array', () => {
    const data: ChartData = [{ x: [], series: [[]] }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);

    expect(mgr.state.activeGroup).toBe(-1);
  });

  it('handles missing x-scale key', () => {
    const data: ChartData = [{ x: [0, 50, 100], series: [[10, 50, 90]] }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow,
      () => undefined, // no x-scale key
    );

    expect(mgr.state.activeGroup).toBe(-1);
  });

  it('handles missing y-scale', () => {
    const data: ChartData = [{ x: [0, 50, 100], series: [[10, 50, 90]] }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'nonexistent', show: true }];

    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);

    // Should not snap to anything since y-scale is missing
    expect(mgr.state.activeGroup).toBe(-1);
  });

  it('handles scale with null min/max', () => {
    const nullScales = new Map<string, ScaleState>([
      ['x', { ...makeScale('x', 0, 100), min: null as unknown as number }],
      ['y', makeScale('y', 0, 100, Orientation.Vertical)],
    ]);
    const data: ChartData = [{ x: [0, 50, 100], series: [[10, 50, 90]] }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    mgr.update(350, 280, plotBox, data, configs,
      (id) => nullScales.get(id), getWindow, getGroupXScaleKey,
    );

    expect(mgr.state.activeGroup).toBe(-1);
  });

  it('skips null y-values when snapping', () => {
    const data: ChartData = [{
      x: [0, 25, 50, 75, 100],
      series: [[null, null, 50, null, null]],
    }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    mgr.update(350, 280, plotBox, data, configs, getScale,
      () => [0, 4] as [number, number], getGroupXScaleKey,
    );

    // Should snap to index 2 (the only non-null value)
    expect(mgr.state.activeDataIdx).toBe(2);
  });

  it('window boundary constrains candidate indices', () => {
    const data: ChartData = [{
      x: [0, 25, 50, 75, 100],
      series: [[10, 40, 70, 30, 90]],
    }];
    const configs: SeriesConfig[] = [{ group: 0, index: 0, yScale: 'y', show: true }];

    // Window only shows indices 1-3
    mgr.update(350, 280, plotBox, data, configs, getScale,
      () => [1, 3] as [number, number], getGroupXScaleKey,
    );

    // Should snap within window bounds
    expect(mgr.state.activeDataIdx).toBeGreaterThanOrEqual(1);
    expect(mgr.state.activeDataIdx).toBeLessThanOrEqual(3);
  });
});

describe('CursorManager: grouped configs cache', () => {
  let mgr: CursorManager;

  beforeEach(() => {
    mgr = new CursorManager();
  });

  it('filters out hidden series (show: false)', () => {
    const data: ChartData = [{
      x: [0, 50, 100],
      series: [[10, 50, 90], [20, 60, 80]],
    }];
    const configs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: false },
      { group: 0, index: 1, yScale: 'y', show: true },
    ];

    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);

    // Should snap to series 1, not series 0
    expect(mgr.state.activeSeriesIdx).toBe(1);
  });

  it('invalidateGroupedConfigs forces rebuild on next update', () => {
    const data: ChartData = [{
      x: [0, 50, 100],
      series: [[10, 50, 90], [20, 60, 80]],
    }];
    const configs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: true },
      { group: 0, index: 1, yScale: 'y', show: true },
    ];

    // First update caches grouped configs
    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);
    const firstIdx = mgr.state.activeSeriesIdx;

    // Invalidate and update with same reference — should still work
    mgr.invalidateGroupedConfigs();
    mgr.update(350, 280, plotBox, data, configs, getScale, getWindow, getGroupXScaleKey);

    expect(mgr.state.activeSeriesIdx).toBe(firstIdx);
  });

  it('cache rebuilds when seriesConfigs reference changes', () => {
    const data: ChartData = [{
      x: [0, 50, 100],
      series: [[10, 50, 90]],
    }];
    const configs1: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: true },
    ];

    mgr.update(350, 280, plotBox, data, configs1, getScale, getWindow, getGroupXScaleKey);
    expect(mgr.state.activeSeriesIdx).toBe(0);

    // New reference with show: false
    const configs2: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: false },
    ];
    mgr.update(350, 280, plotBox, data, configs2, getScale, getWindow, getGroupXScaleKey);

    // No visible series
    expect(mgr.state.activeGroup).toBe(-1);
  });
});

describe('CursorManager: syncToValue edge cases', () => {
  let mgr: CursorManager;

  beforeEach(() => {
    mgr = new CursorManager();
  });

  it('handles empty data', () => {
    const store = {
      dataStore: { data: [] as ChartData, getWindow: () => [0, 0] as [number, number] },
      scaleManager: {
        getGroupXScaleKey: () => 'x',
        getScale: (id: string) => scales.get(id),
      },
      seriesConfigs: [] as SeriesConfig[],
      plotBox,
    };

    mgr.syncToValue(50, store);

    // Should not crash, cursor stays hidden
    expect(mgr.state.left).toBe(-10);
  });

  it('handles all null y-values — falls back to center y', () => {
    const store = {
      dataStore: {
        data: [{ x: [0, 50, 100], series: [[null, null, null]] }] as ChartData,
        getWindow: () => [0, 2] as [number, number],
      },
      scaleManager: {
        getGroupXScaleKey: () => 'x',
        getScale: (id: string) => scales.get(id),
      },
      seriesConfigs: [{ group: 0, index: 0, yScale: 'y', show: true }] as SeriesConfig[],
      plotBox,
    };

    mgr.syncToValue(50, store);

    // Y should fall back to plotBox.height / 2
    expect(mgr.state.top).toBe(plotBox.height / 2);
  });
});
