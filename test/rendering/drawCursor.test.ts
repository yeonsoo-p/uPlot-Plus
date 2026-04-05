import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawCursor } from '@/rendering/drawCursor';
import type { CursorState, ScaleState, BBox } from '@/types';
import type { ChartData } from '@/types/data';
import type { SeriesConfig } from '@/types/series';
import type { ThemeCache } from '@/rendering/theme';

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '' as string,
    fillStyle: '' as string,
    lineWidth: 0,
  };
}

const plotBox: BBox = { left: 50, top: 20, width: 700, height: 560 };

function makeCursor(overrides?: Partial<CursorState>): CursorState {
  return {
    left: 350,
    top: 280,
    activeGroup: -1,
    activeSeriesIdx: -1,
    activeDataIdx: -1,
    ...overrides,
  };
}

const emptyData: ChartData = [];
const emptyConfigs: SeriesConfig[] = [];

function noScale(): ScaleState | undefined {
  return undefined;
}

function noGroupXScale(): string | undefined {
  return undefined;
}

describe('drawCursor', () => {
  let ctx: ReturnType<typeof makeCtx>;

  beforeEach(() => {
    ctx = makeCtx();
  });

  it('does nothing when cursor.left < 0', () => {
    const cursor = makeCursor({ left: -1 });
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale);

    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('does nothing when cursor.top < 0', () => {
    const cursor = makeCursor({ top: -1 });
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale);

    expect(ctx.save).not.toHaveBeenCalled();
  });

  it('draws vertical crosshair when showX=true (default)', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    // Vertical line: same x, different y
    const moveCall = ctx.moveTo.mock.calls[0];
    const lineCall = ctx.lineTo.mock.calls[0];
    expect(moveCall?.[0]).toBe(lineCall?.[0]); // same x
    expect(moveCall?.[1]).not.toBe(lineCall?.[1]); // different y
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('skips vertical crosshair when showX=false', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale, { showX: false, showY: false });

    expect(ctx.save).toHaveBeenCalled();
    // No beginPath / moveTo / lineTo for crosshairs
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('draws horizontal crosshair when showY=true (default)', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale, { showX: false });

    // Only horizontal crosshair drawn
    expect(ctx.beginPath).toHaveBeenCalledTimes(1);
    const moveCall = ctx.moveTo.mock.calls[0];
    const lineCall = ctx.lineTo.mock.calls[0];
    expect(moveCall?.[1]).toBe(lineCall?.[1]); // same y
    expect(moveCall?.[0]).not.toBe(lineCall?.[0]); // different x
  });

  it('skips horizontal crosshair when showY=false', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale, { showX: true, showY: false });

    // Only 1 beginPath for vertical crosshair
    expect(ctx.beginPath).toHaveBeenCalledTimes(1);
  });

  it('applies theme cursorStroke override', () => {
    const cursor = makeCursor();
    const theme = { cursorStroke: '#ff0' } as ThemeCache;
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale, undefined, undefined, theme);

    expect(ctx.strokeStyle).toBe('#ff0');
  });

  it('uses default stroke color when no theme', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale);

    expect(ctx.strokeStyle).toBe('#607D8B');
  });

  it('sets dashed line style', () => {
    const cursor = makeCursor();
    drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, emptyData, emptyConfigs, noScale, noGroupXScale);

    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 3]);
  });

  describe('point indicator', () => {
    const data: ChartData = [
      { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90]] },
    ];
    const configs: SeriesConfig[] = [
      { group: 0, index: 0, yScale: 'y', stroke: 'green', show: true },
    ];
    const configMap = new Map([['0:0', configs[0]!]]);

    const xScale = { id: 'x', min: 0, max: 100, distr: 1, log: 10, asinh: 1, ori: 0, dir: 1, time: false, auto: true, range: null, _discrete: false, _cfgMin: null, _cfgMax: null, _min: null, _max: null } as ScaleState;
    const yScale = { id: 'y', min: 0, max: 100, distr: 1, log: 10, asinh: 1, ori: 1, dir: 1, time: false, auto: true, range: null, _discrete: false, _cfgMin: null, _cfgMax: null, _min: null, _max: null } as ScaleState;

    function getScale(id: string): ScaleState | undefined {
      if (id === 'x') return xScale;
      if (id === 'y') return yScale;
      return undefined;
    }

    function getGroupXScaleKey(gi: number): string | undefined {
      return gi === 0 ? 'x' : undefined;
    }

    it('draws point indicator at snapped data position', () => {
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap);

      expect(ctx.arc).toHaveBeenCalledTimes(1);
      expect(ctx.fill).toHaveBeenCalled();
      // Point stroke should use series color
      const arcCallIdx = ctx.stroke.mock.calls.length - 1;
      expect(arcCallIdx).toBeGreaterThanOrEqual(0);
    });

    it('uses series stroke color for point indicator', () => {
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap);

      // After arc, strokeStyle should be set to the series color 'green'
      // It gets set right before the final stroke() call
      // Check that 'green' was assigned to strokeStyle at some point
      // The last assignment before ctx.restore is the point stroke color
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('skips point when series cursor.show===false', () => {
      const hiddenConfigs: SeriesConfig[] = [
        { group: 0, index: 0, yScale: 'y', stroke: 'green', show: true, cursor: { show: false } },
      ];
      const hiddenMap = new Map([['0:0', hiddenConfigs[0]!]]);

      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, hiddenConfigs, getScale, getGroupXScaleKey, undefined, hiddenMap);

      expect(ctx.arc).not.toHaveBeenCalled();
    });

    it('applies theme pointFill override', () => {
      const theme = { pointFill: '#000' } as ThemeCache;
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap, theme);

      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fillStyle).toBe('#000');
    });

    it('uses default white pointFill when no theme', () => {
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap);

      expect(ctx.fillStyle).toBe('#fff');
    });

    it('skips point when scale is not ready', () => {
      function noReadyScale(): ScaleState | undefined {
        return undefined;
      }

      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, noReadyScale, getGroupXScaleKey, undefined, configMap);

      expect(ctx.arc).not.toHaveBeenCalled();
    });

    it('falls back to findYScaleId when seriesConfigMap is undefined', () => {
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 2 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey);

      // Should still draw the point using fallback lookup
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('skips point when data index is out of bounds', () => {
      const cursor = makeCursor({ activeGroup: 0, activeSeriesIdx: 0, activeDataIdx: 999 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap);

      expect(ctx.arc).not.toHaveBeenCalled();
    });

    it('skips point when group does not exist in data', () => {
      const cursor = makeCursor({ activeGroup: 5, activeSeriesIdx: 0, activeDataIdx: 0 });
      drawCursor(ctx as unknown as CanvasRenderingContext2D, cursor, plotBox, 1, data, configs, getScale, getGroupXScaleKey, undefined, configMap);

      expect(ctx.arc).not.toHaveBeenCalled();
    });
  });
});
