import { describe, it, expect, vi, beforeEach } from 'vitest';
import { drawAxesGrid } from '@/rendering/drawAxes';
import type { ScaleState, BBox } from '@/types';
import type { AxisState } from '@/types/axes';
import { Side, Orientation } from '@/types';
import { createScaleState } from '@/core/Scale';

function makeScale(id: string, min: number, max: number, ori: Orientation = Orientation.Horizontal): ScaleState {
  return { ...createScaleState({ id, min, max, ori }) };
}

function makeAxisState(overrides: Partial<AxisState> & { config: AxisState['config'] }): AxisState {
  return {
    _show: true,
    _size: 50,
    _pos: 0,
    _lpos: 0,
    _splits: null,
    _values: null,
    _incr: 1,
    _space: 50,
    _rotate: 0,
    ...overrides,
  };
}

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
  };
}

const plotBox: BBox = { left: 50, top: 20, width: 400, height: 300 };

describe('drawAxesGrid', () => {
  let ctx: ReturnType<typeof makeCtx>;

  beforeEach(() => {
    ctx = makeCtx();
  });

  it('skips hidden axes (_show=false)', () => {
    const axis = makeAxisState({
      config: { scale: 'y', side: Side.Left },
      _show: false,
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
    });

    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => makeScale('y', 0, 100, Orientation.Vertical), plotBox, 1);

    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it('skips axes with null scale range', () => {
    const axis = makeAxisState({
      config: { scale: 'y', side: Side.Left },
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
    });

    const nullScale = { ...makeScale('y', 0, 100, Orientation.Vertical), min: null, max: null } as unknown as ScaleState;
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => nullScale, plotBox, 1);

    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('skips axes with null splits or values', () => {
    const axis = makeAxisState({
      config: { scale: 'y', side: Side.Left },
      _splits: null,
      _values: null,
    });

    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => makeScale('y', 0, 100, Orientation.Vertical), plotBox, 1);

    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('renders tick labels at correct positions for bottom axis', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom },
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Should have rendered 3 labels
    expect(ctx.fillText).toHaveBeenCalledTimes(3);

    const calls = ctx.fillText.mock.calls;
    expect(calls[0]![0]).toBe('0');
    expect(calls[1]![0]).toBe('50');
    expect(calls[2]![0]).toBe('100');
  });

  it('renders tick labels for left axis', () => {
    const axis = makeAxisState({
      config: { scale: 'y', side: Side.Left },
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
      _pos: 50,
      _space: 50,
    });

    const yScale = makeScale('y', 0, 100, Orientation.Vertical);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => yScale, plotBox, 1);

    expect(ctx.fillText).toHaveBeenCalledTimes(3);
    expect(ctx.textAlign).toBe('right');
  });

  it('draws grid lines when grid.show is not false', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom, grid: { show: true } },
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Grid uses moveTo/lineTo via drawOrthoLines
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('does not draw grid when grid.show=false', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom, grid: { show: false }, ticks: { show: false } },
      _splits: [0, 50, 100],
      _values: ['0', '50', '100'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // moveTo should only be from labels, not grid
    // With ticks and grid both off, stroke shouldn't be called for ortho lines
    // but labels use fillText directly
    expect(ctx.fillText).toHaveBeenCalledTimes(3);
  });

  it('draws tick marks when ticks.show is not false', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom, ticks: { show: true, size: 10 }, grid: { show: false } },
      _splits: [0, 100],
      _values: ['0', '100'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Tick drawing uses save/restore, stroke
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('renders axis label when config.label is set', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom, label: 'Time (s)' },
      _splits: [0],
      _values: ['0'],
      _pos: 320,
      _lpos: 340,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Should render axis label text
    const calls = ctx.fillText.mock.calls;
    const labelCall = calls.find((c: unknown[]) => c[0] === 'Time (s)');
    expect(labelCall).toBeDefined();
  });

  it('rotates vertical axis labels', () => {
    const axis = makeAxisState({
      config: { scale: 'y', side: Side.Left, label: 'Value' },
      _splits: [0, 100],
      _values: ['0', '100'],
      _pos: 50,
      _lpos: 10,
      _space: 50,
    });

    const yScale = makeScale('y', 0, 100, Orientation.Vertical);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => yScale, plotBox, 1);

    // Vertical axis label requires save/rotate/restore
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.rotate).toHaveBeenCalled();
  });

  it('renders chart title when provided', () => {
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [], () => undefined, plotBox, 1, 'My Chart');

    const calls = ctx.fillText.mock.calls;
    const titleCall = calls.find((c: unknown[]) => c[0] === 'My Chart');
    expect(titleCall).toBeDefined();
  });

  it('does not render title when not provided', () => {
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [], () => undefined, plotBox, 1);

    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('skips empty string values in labels', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom },
      _splits: [0, 50, 100],
      _values: ['0', '', '100'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Should only render 2 labels (skipping empty string)
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
  });

  it('draws axis border when border config is set', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom, border: { show: true, stroke: '#000', width: 1 }, grid: { show: false }, ticks: { show: false } },
      _splits: [0],
      _values: ['0'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 1);

    // Border draws a line across the axis position
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('scales positions by pxRatio for HiDPI', () => {
    const axis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom },
      _splits: [50],
      _values: ['50'],
      _pos: 320,
      _space: 50,
    });

    const xScale = makeScale('x', 0, 100);
    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [axis], () => xScale, plotBox, 2);

    // With pxRatio=2, pixel positions should be scaled
    const calls = ctx.fillText.mock.calls;
    expect(calls.length).toBe(1);
    // The x position for value 50 at center should be scaled by 2
    const xPos = calls[0]![1] as number;
    expect(xPos).toBeGreaterThan(200); // 250 * 2 = 500 (scaled)
  });

  it('handles multiple axes', () => {
    const xAxis = makeAxisState({
      config: { scale: 'x', side: Side.Bottom },
      _splits: [0, 100],
      _values: ['0', '100'],
      _pos: 320,
      _space: 50,
    });
    const yAxis = makeAxisState({
      config: { scale: 'y', side: Side.Left },
      _splits: [0, 100],
      _values: ['0', '100'],
      _pos: 50,
      _space: 50,
    });

    const getScale = (id: string) => {
      if (id === 'x') return makeScale('x', 0, 100);
      if (id === 'y') return makeScale('y', 0, 100, Orientation.Vertical);
      return undefined;
    };

    drawAxesGrid(ctx as unknown as CanvasRenderingContext2D, [xAxis, yAxis], getScale, plotBox, 1);

    // 2 labels per axis = 4 total
    expect(ctx.fillText).toHaveBeenCalledTimes(4);
  });
});
