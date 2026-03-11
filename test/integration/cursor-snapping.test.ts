import { describe, it, expect } from 'vitest';
import { CursorManager } from '@/core/CursorManager';
import { createScaleState, valToPos } from '@/core/Scale';
import type { ScaleState, ChartData, BBox } from '@/types';
import type { SeriesConfig } from '@/types/series';

function makeScale(id: string, min: number, max: number, ori: 0 | 1 = 0): ScaleState {
  return { ...createScaleState({ id }), min, max, ori };
}

describe('CursorManager snapping', () => {
  const plotBox: BBox = { left: 50, top: 10, width: 700, height: 400 };

  const data: ChartData = [
    {
      x: [0, 25, 50, 75, 100],
      series: [
        [10, 50, 30, 80, 60],
        [90, 40, 70, 20, 50],
      ],
    },
  ];

  const seriesConfigs: SeriesConfig[] = [
    { group: 0, index: 0, yScale: 'y' },
    { group: 0, index: 1, yScale: 'y' },
  ];

  const scales: Record<string, ScaleState> = {
    x: makeScale('x', 0, 100),
    y: { ...makeScale('y', 0, 100), ori: 1 as const, dir: 1 as const },
  };

  const getScale = (id: string) => scales[id];
  const getWindow = () => [0, 4] as [number, number];
  const getGroupXScaleKey = () => 'x';

  it('snaps to the correct nearest data index', () => {
    const mgr = new CursorManager();

    // Click near x=50 data point (index 2).
    // x=50 maps to pixel: valToPos(50, xScale, 700, 50) = 50 + 0.5*700 = 400
    // So cursor at cssX = 400 - 50 = 350 (relative) should snap to index 2
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

    expect(mgr.state.activeDataIdx).toBe(2);
    expect(mgr.state.activeGroup).toBe(0);
  });

  it('snaps to nearest point when between two x values', () => {
    const mgr = new CursorManager();

    // Place cursor between x=25 (index 1) and x=50 (index 2), closer to x=25
    // x=25 pixel: valToPos(25, ...) = 50 + 0.25*700 = 225
    // x=50 pixel: 50 + 0.5*700 = 400
    // cssX near 225 should snap to index 1
    const nearIdx1 = valToPos(30, scales['x']!, plotBox.width, plotBox.left);

    mgr.update(
      nearIdx1 - plotBox.left,
      200,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeDataIdx).toBe(1);
  });

  it('snaps to edge point when cursor is beyond data range', () => {
    const mgr = new CursorManager();

    // Cursor far to the left, beyond x=0
    mgr.update(
      -100,
      200,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    // Should snap to the leftmost point (index 0)
    expect(mgr.state.activeDataIdx).toBe(0);
    expect(mgr.state.activeGroup).toBe(0);
  });

  it('hide() resets cursor to off-screen and clears active indices', () => {
    const mgr = new CursorManager();
    mgr.update(400, 200, plotBox, data, seriesConfigs, getScale, getWindow, getGroupXScaleKey);
    mgr.hide();

    expect(mgr.state.left).toBe(-10);
    expect(mgr.state.top).toBe(-10);
    expect(mgr.state.activeDataIdx).toBe(-1);
    expect(mgr.state.activeGroup).toBe(-1);
    expect(mgr.state.activeSeriesIdx).toBe(-1);
  });

  it('selects the series closest in y-pixel distance', () => {
    const mgr = new CursorManager();

    // At x=75 (index 3): series[0] has y=80, series[1] has y=20
    // y=80 pixel: valToPos(80, yScale, 400, 10) — with ori=1, dir=1, this maps to top
    // y=20 pixel: maps to bottom
    // Place cursor near the y=80 position to prefer series 0
    const xPixel = valToPos(75, scales['x']!, plotBox.width, plotBox.left);
    const yPixelSeries0 = valToPos(80, scales['y']!, plotBox.height, plotBox.top);

    mgr.update(
      xPixel - plotBox.left,
      yPixelSeries0 - plotBox.top,
      plotBox,
      data,
      seriesConfigs,
      getScale,
      getWindow,
      getGroupXScaleKey,
    );

    expect(mgr.state.activeDataIdx).toBe(3);
    expect(mgr.state.activeSeriesIdx).toBe(0);
  });
});
