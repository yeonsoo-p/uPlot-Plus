import { describe, it, expect, beforeEach } from 'vitest';
import { drawSeriesPath } from '@/rendering/drawSeries';
import type { SeriesConfig } from '@/types';
import type { SeriesPaths } from '@/paths/types';
import { createMockCtx } from '../helpers/mockCanvas';

function makePaths(): SeriesPaths {
  return {
    stroke: new Path2D(),
    fill: new Path2D(),
    clip: null,
    band: null,
    gaps: null,
  };
}

describe('drawSeriesPath', () => {
  let ctx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    ctx = createMockCtx();
    Object.defineProperty(ctx, 'canvas', { value: { width: 800, height: 600 }, writable: true });
  });

  it('draws stroke with correct style', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', width: 2, show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.strokeStyle).toBe('red');
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.stroke).toHaveBeenCalledWith(paths.stroke);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('draws fill when config.fill is set', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', fill: 'rgba(255,0,0,0.3)', show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.fillStyle).toBe('rgba(255,0,0,0.3)');
    expect(ctx.fill).toHaveBeenCalledWith(paths.fill);
  });

  it('does not draw fill when config.fill is not set', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'blue', show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.fill).not.toHaveBeenCalled();
  });

  it('respects show=false — does nothing', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: false };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.save).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fill).not.toHaveBeenCalled();
  });

  it('applies clip path when paths.clip is set', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: true };
    const paths = makePaths();
    paths.clip = new Path2D();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.clip).toHaveBeenCalledWith(paths.clip);
  });

  it('does not clip when paths.clip is null', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.clip).not.toHaveBeenCalled();
  });

  it('applies alpha when config.alpha < 1', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: true, alpha: 0.5 };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.globalAlpha).toBe(0.5);
  });

  it('applies dash pattern when config.dash is set', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: true, dash: [5, 3] };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 3]);
  });

  it('scales line width by pxRatio', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', width: 1, show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 2);

    expect(ctx.lineWidth).toBe(2); // 1 * pxRatio=2
  });

  it('applies lineJoin and lineCap from config', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: 'red', show: true, join: 'bevel', cap: 'round' };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.lineJoin).toBe('bevel');
    expect(ctx.lineCap).toBe('round');
  });

  it('does not draw stroke when config.stroke is not set', () => {
    const config: SeriesConfig = { group: 0, index: 0, yScale: 'y', fill: 'blue', show: true };
    const paths = makePaths();

    drawSeriesPath(ctx, config, paths, 1);

    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});
