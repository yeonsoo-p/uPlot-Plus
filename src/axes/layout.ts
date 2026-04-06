import type { ScaleState, BBox } from '../types';
import type { AxisState } from '../types/axes';
import type { ResolvedTheme } from '../rendering/theme';
import { Side, Orientation, Distribution, sideOrientation } from '../types';
import { ceil } from '../math/utils';
import { isScaleReady } from '../core/Scale';
import {
  getIncrSpace,
  numAxisSplits,
  numAxisVals,
  logAxisSplits,
  logAxisValFilter,
  asinhAxisSplits,
  computeAxisSize,
} from './ticks';
import { timeIncrs } from '../time/timeIncrs';
import { timeAxisSplits } from '../time/timeSplits';
import { timeAxisVals, findTimeIncr } from '../time/timeVals';

const CYCLE_LIMIT = 3;

/**
 * Run one cycle of axis calculation.
 * For each visible axis, compute tick positions, labels, and size.
 * Returns true if all axis sizes have converged.
 *
 * Ported from uPlot uPlot.js axesCalc.
 */
export function axesCalc(
  axisStates: AxisState[],
  getScale: (id: string) => ScaleState | undefined,
  plotWidCss: number,
  plotHgtCss: number,
  cycleNum: number,
  theme?: ResolvedTheme,
  locale?: string,
  timezone?: string,
): boolean {
  let converged = true;

  for (const axis of axisStates) {
    const config = axis.config;
    if (config.show === false)
      continue;

    const scale = getScale(config.scale);

    if (!scale || !isScaleReady(scale)) {
      if (axis._show) {
        converged = false;
        axis._show = false;
      }
      continue;
    } else {
      if (!axis._show) {
        converged = false;
        axis._show = true;
      }
    }

    const side = config.side;
    const ori = sideOrientation(side);
    const fullDim = ori === Orientation.Horizontal ? plotWidCss : plotHgtCss;

    const min = scale.min;
    const max = scale.max;

    let _incr: number;
    let _space: number;

    if (scale.time) {
      // Time scale: use time-specific increments
      const minSpace = config.space ?? 80;
      [_incr, _space] = findTimeIncr(min, max, timeIncrs, fullDim, minSpace);
    } else {
      const tickFont = config.font ?? theme?.tickFont;
      [_incr, _space] = getIncrSpace(config, min, max, fullDim, tickFont, locale);
    }

    // Discrete x-data: force integer-only ticks
    if (scale._discrete && _incr > 0 && _incr < 1) {
      _incr = 1;
    }

    axis._incr = _incr;
    axis._space = _space;

    if (_space === 0)
      continue;

    // Generate splits (tick positions)
    if (config.splits) {
      axis._splits = config.splits(min, max, _incr, _space);
    } else if (scale.time) {
      axis._splits = timeAxisSplits(min, max, _incr);
    } else if (scale.distr === Distribution.Log) {
      axis._splits = logAxisSplits(min, max, scale.log);
    } else if (scale.distr === Distribution.Asinh) {
      axis._splits = asinhAxisSplits(min, max, scale.asinh);
    } else {
      const forceMin = scale.distr === Distribution.Ordinal || scale._discrete;
      axis._splits = numAxisSplits(min, max, _incr, _space, forceMin);
    }

    // Generate values (tick labels)
    if (config.values) {
      axis._values = config.values(axis._splits, _space, _incr);
    } else if (scale.time) {
      axis._values = timeAxisVals(axis._splits, _incr, timezone, locale);
    } else if (scale.distr === Distribution.Log) {
      // For log scales, only label power-of-base values; intermediate ticks still drawn as grid
      const filter = logAxisValFilter(axis._splits, scale.log);
      const allVals = numAxisVals(axis._splits, locale);
      axis._values = allVals.map((v, i) => filter[i] ? v : '');
    } else if (scale.distr === Distribution.Asinh) {
      axis._values = numAxisVals(axis._splits, locale);
    } else {
      axis._values = numAxisVals(axis._splits, locale);
    }

    // Rotating of labels only supported on bottom x-axis
    axis._rotate = side === Side.Bottom ? (config.rotate ?? 0) : 0;

    // Compute size
    const oldSize = axis._size;
    const sizeFont = config.font ?? theme?.tickFont;
    axis._size = ceil(computeAxisSize(config, axis._values, cycleNum, sizeFont));

    if (oldSize !== axis._size)
      converged = false;
  }

  return converged;
}

/**
 * Compute the plot area bounding box by subtracting axis sizes from the chart dimensions.
 *
 * Ported from uPlot uPlot.js calcPlotRect (lines 818-870).
 */
export function calcPlotRect(
  chartWidth: number,
  chartHeight: number,
  axisStates: AxisState[],
  titleHeight = 0,
): BBox {
  let plotWidCss = chartWidth;
  let plotHgtCss = chartHeight - titleHeight;
  let plotLftCss = 0;
  let plotTopCss = titleHeight;

  for (const axis of axisStates) {
    if (!axis._show)
      continue;

    const side = axis.config.side;
    const isVt = sideOrientation(side) === Orientation.Vertical;
    const labelSize = axis.config.label != null ? (axis.config.labelSize ?? 20) : 0;
    const fullSize = axis._size + labelSize;

    if (fullSize > 0) {
      if (isVt) {
        plotWidCss -= fullSize;

        if (side === Side.Left) {
          plotLftCss += fullSize;
        }
      } else {
        plotHgtCss -= fullSize;

        if (side === Side.Top) {
          plotTopCss += fullSize;
        }
      }
    }
  }

  // If no top-side axis, add small margin so the topmost tick label isn't clipped
  const hasTopAxis = axisStates.some(a => a._show && a.config.side === Side.Top);
  if (!hasTopAxis && plotTopCss <= titleHeight) {
    const topMargin = 8;
    plotTopCss += topMargin;
    plotHgtCss -= topMargin;
  }

  return {
    left: plotLftCss,
    top: plotTopCss,
    width: Math.max(plotWidCss, 0),
    height: Math.max(plotHgtCss, 0),
  };
}

/**
 * Compute axis positions (_pos and _lpos) using cumulative offsets from plot edges.
 *
 * Ported from uPlot uPlot.js calcAxesRects (lines 872-899).
 */
export function calcAxesRects(axisStates: AxisState[], plotBox: BBox): void {
  // Cumulative offsets from plot edges
  let off0 = plotBox.top;                         // top edge, decrements outward
  let off1 = plotBox.left + plotBox.width;         // right edge, increments outward
  let off2 = plotBox.top + plotBox.height;         // bottom edge, increments outward
  let off3 = plotBox.left;                         // left edge, decrements outward

  function incrOffset(side: Side, size: number): number {
    switch (side) {
      case Side.Top:    off0 -= size; return off0 + size;
      case Side.Right:  { const pos = off1; off1 += size; return pos; }
      case Side.Bottom: { const pos = off2; off2 += size; return pos; }
      case Side.Left:   off3 -= size; return off3 + size;
      default: return 0;
    }
  }

  for (const axis of axisStates) {
    if (!axis._show)
      continue;

    const side = axis.config.side;

    axis._pos = incrOffset(side, axis._size);

    if (axis.config.label != null) {
      const labelSize = axis.config.labelSize ?? 20;
      axis._lpos = incrOffset(side, labelSize);
    }
  }
}

/**
 * Run the convergence loop: repeatedly calculate axes and plot rect
 * until axis sizes stabilize (or max 3 cycles).
 *
 * Ported from uPlot uPlot.js convergeSize.
 */
export function convergeSize(
  chartWidth: number,
  chartHeight: number,
  axisStates: AxisState[],
  getScale: (id: string) => ScaleState | undefined,
  titleHeight = 0,
  theme?: ResolvedTheme,
  locale?: string,
  timezone?: string,
): BBox {
  // Reset _size so convergence always runs at least 2 cycles.
  // Without this, preserved _size from a previous redraw can cause
  // the loop to converge immediately on cycle 1 (using wrong plotBox).
  for (const axis of axisStates) {
    axis._size = 0;
  }

  let converged = false;
  let cycleNum = 0;
  let plotBox: BBox = { left: 0, top: 0, width: chartWidth, height: chartHeight };

  while (!converged) {
    cycleNum++;

    const axesConverged = axesCalc(
      axisStates,
      getScale,
      plotBox.width,
      plotBox.height,
      cycleNum,
      theme,
      locale,
      timezone,
    );

    converged = cycleNum === CYCLE_LIMIT || axesConverged;

    if (!converged) {
      plotBox = calcPlotRect(chartWidth, chartHeight, axisStates, titleHeight);
    }
  }

  // Final calcPlotRect with converged axis sizes
  plotBox = calcPlotRect(chartWidth, chartHeight, axisStates, titleHeight);

  // Compute axis positions from plot edges
  calcAxesRects(axisStates, plotBox);

  return plotBox;
}
