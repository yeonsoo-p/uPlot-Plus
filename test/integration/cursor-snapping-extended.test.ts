import { describe, it, expect } from 'vitest';
import { CursorManager } from '@/core/CursorManager';
import { createScaleState, valToPos } from '@/core/Scale';
import type { ScaleState, ChartData, BBox } from '@/types';
import { Orientation, Direction } from '@/types';
import type { SeriesConfig } from '@/types/series';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id }), min, max, ori };
}

describe('CursorManager: multi-group snapping', () => {
  const plotBox: BBox = { left: 50, top: 10, width: 700, height: 400 };

  const data: ChartData = [
    {
      x: [0, 25, 50, 75, 100],
      series: [[10, 50, 30, 80, 60]],
    },
    {
      x: [10, 40, 70],
      series: [[20, 90, 40]],
    },
  ];

  const seriesConfigs: SeriesConfig[] = [
    { group: 0, index: 0, yScale: 'y' },
    { group: 1, index: 0, yScale: 'y' },
  ];

  const scales: Record<string, ScaleState> = {
    x: makeScale('x', 0, 100),
    y: { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward },
  };

  const getScale = (id: string) => scales[id];
  const getWindow = (_gi: number): [number, number] => {
    if (_gi === 0) return [0, 4];
    return [0, 2];
  };
  const getGroupXScaleKey = () => 'x';

  it('picks the nearest point across multiple groups', () => {
    const mgr = new CursorManager();

    // Place cursor near x=40 (group 1, index 1, yVal=90)
    // Group 0 has x=25 (index 1, y=50) and x=50 (index 2, y=30)
    // Group 1 has x=40 (index 1, y=90) — exact x match
    const xPixel = valToPos(40, scales['x']!, plotBox.width, plotBox.left);
    const yPixel = valToPos(90, scales['y']!, plotBox.height, plotBox.top);

    mgr.update(
      xPixel - plotBox.left,
      yPixel - plotBox.top,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeGroup).toBe(1);
    expect(mgr.state.activeDataIdx).toBe(1);
  });

  it('falls back to group 0 when equidistant', () => {
    const mgr = new CursorManager();

    // Place cursor at x=0, near group 0 index 0 (x=0, y=10)
    const xPixel = valToPos(0, scales['x']!, plotBox.width, plotBox.left);
    const yPixel = valToPos(10, scales['y']!, plotBox.height, plotBox.top);

    mgr.update(
      xPixel - plotBox.left,
      yPixel - plotBox.top,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeGroup).toBe(0);
    expect(mgr.state.activeDataIdx).toBe(0);
  });
});

describe('CursorManager: hidden series', () => {
  const plotBox: BBox = { left: 50, top: 10, width: 700, height: 400 };

  const data: ChartData = [
    {
      x: [0, 50, 100],
      series: [
        [10, 50, 90],  // series 0 — will be hidden
        [90, 50, 10],  // series 1 — visible
      ],
    },
  ];

  const scales: Record<string, ScaleState> = {
    x: makeScale('x', 0, 100),
    y: { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward },
  };

  const getScale = (id: string) => scales[id];
  const getWindow = (): [number, number] => [0, 2];
  const getGroupXScaleKey = () => 'x';

  it('skips hidden series (show: false)', () => {
    const mgr = new CursorManager();

    const seriesConfigs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: false },
      { group: 0, index: 1, yScale: 'y', show: true },
    ];

    // Place cursor at x=50, y=50 — both series have y=50 at index 1
    // But series 0 is hidden, so should snap to series 1
    const xPixel = valToPos(50, scales['x']!, plotBox.width, plotBox.left);
    const yPixel = valToPos(50, scales['y']!, plotBox.height, plotBox.top);

    mgr.update(
      xPixel - plotBox.left,
      yPixel - plotBox.top,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeSeriesIdx).toBe(1);
  });

  it('returns no active series when all are hidden', () => {
    const mgr = new CursorManager();

    const seriesConfigs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', show: false },
      { group: 0, index: 1, yScale: 'y', show: false },
    ];

    const xPixel = valToPos(50, scales['x']!, plotBox.width, plotBox.left);

    mgr.update(
      xPixel - plotBox.left,
      200,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeGroup).toBe(-1);
    expect(mgr.state.activeSeriesIdx).toBe(-1);
  });
});

describe('CursorManager: null data handling', () => {
  const plotBox: BBox = { left: 50, top: 10, width: 700, height: 400 };

  const scales: Record<string, ScaleState> = {
    x: makeScale('x', 0, 100),
    y: { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward },
  };

  const getScale = (id: string) => scales[id];
  const getWindow = (): [number, number] => [0, 4];
  const getGroupXScaleKey = () => 'x';

  it('skips null y-values', () => {
    const mgr = new CursorManager();

    const data: ChartData = [
      {
        x: [0, 25, 50, 75, 100],
        series: [[10, null, 50, null, 90]],
      },
    ];

    const seriesConfigs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y' },
    ];

    // Cursor near x=25 (index 1) which has null y — should snap to index 0 or 2
    const xPixel = valToPos(25, scales['x']!, plotBox.width, plotBox.left);

    mgr.update(
      xPixel - plotBox.left,
      200,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    // Should have found a valid point (not index 1 which is null)
    expect(mgr.state.activeDataIdx).not.toBe(1);
    expect(mgr.state.activeGroup).toBe(0);
  });
});

describe('CursorManager: syncToValue', () => {
  const plotBox: BBox = { left: 50, top: 10, width: 700, height: 400 };

  it('syncs cursor to the closest x-value', () => {
    const mgr = new CursorManager();

    const data: ChartData = [
      {
        x: [0, 25, 50, 75, 100],
        series: [[10, 50, 30, 80, 60]],
      },
    ];

    const scales: Record<string, ScaleState> = {
      x: makeScale('x', 0, 100),
      y: { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward },
    };

    const store = {
      dataStore: {
        data,
        getWindow: (): [number, number] => [0, 4],
      },
      scaleManager: {
        getGroupXScaleKey: (): string | undefined => 'x',
        getScale: (id: string) => scales[id],
      },
      seriesConfigs: [
        { group: 0, index: 0, yScale: 'y' },
      ],
      plotBox,
    };

    mgr.syncToValue(50, store);

    expect(mgr.state.activeDataIdx).toBe(2);
    expect(mgr.state.activeGroup).toBe(0);
    // CSS position should correspond to x=50
    const expectedLeft = valToPos(50, scales['x']!, plotBox.width, plotBox.left) - plotBox.left;
    expect(mgr.state.left).toBeCloseTo(expectedLeft, 1);
  });

  it('syncs to edge when value is beyond data range', () => {
    const mgr = new CursorManager();

    const data: ChartData = [
      {
        x: [10, 20, 30],
        series: [[50, 60, 70]],
      },
    ];

    const scales: Record<string, ScaleState> = {
      x: makeScale('x', 0, 100),
      y: { ...makeScale('y', 0, 100), ori: Orientation.Vertical, dir: Direction.Forward },
    };

    const store = {
      dataStore: {
        data,
        getWindow: (): [number, number] => [0, 2],
      },
      scaleManager: {
        getGroupXScaleKey: (): string | undefined => 'x',
        getScale: (id: string) => scales[id],
      },
      seriesConfigs: [
        { group: 0, index: 0, yScale: 'y' },
      ],
      plotBox,
    };

    mgr.syncToValue(0, store);

    // Should snap to the leftmost point (x=10, index 0)
    expect(mgr.state.activeDataIdx).toBe(0);
    expect(mgr.state.activeGroup).toBe(0);
  });
});
