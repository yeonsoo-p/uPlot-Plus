import type { AxisConfig, AxisState } from '../types/axes';
import {
  roundDec,
  incrRoundUp,
  fmtNum,
  fixedDec,
  closestIdx,
  findIncr,
  floor,
  pow,
  log10,
  log2,
  abs,
} from '../math/utils';
import { numIncrs } from '../math/increments';

/**
 * Generate tick split positions for a numeric (linear) axis.
 * Ported from uPlot opts.js numAxisSplits.
 */
export function numAxisSplits(
  scaleMin: number,
  scaleMax: number,
  foundIncr: number,
  _foundSpace: number,
  forceMin: boolean,
): number[] {
  const splits: number[] = [];

  const numDec = fixedDec.get(foundIncr) ?? 0;

  const startMin = forceMin ? scaleMin : roundDec(incrRoundUp(scaleMin, foundIncr), numDec);

  for (let val = startMin; val <= scaleMax; val = roundDec(val + foundIncr, numDec))
    splits.push(Object.is(val, -0) ? 0 : val);

  return splits;
}

/**
 * Format tick values as strings for a numeric axis.
 * Ported from uPlot opts.js numAxisVals.
 */
export function numAxisVals(splits: number[]): string[] {
  return splits.map(v => fmtNum(v));
}

/**
 * Generate tick split positions for a log-scale axis.
 * Ported from uPlot opts.js logAxisSplits.
 */
export function logAxisSplits(
  scaleMin: number,
  scaleMax: number,
  logBase: number,
): number[] {
  if (scaleMin <= 0 || scaleMax <= 0 || scaleMin >= scaleMax) return [];

  const splits: number[] = [];

  const logFn = logBase === 10 ? log10 : log2;
  const exp = floor(logFn(scaleMin));

  let foundIncr = pow(logBase, exp);

  // Correct floating point for base-10
  if (logBase === 10)
    foundIncr = numIncrs[closestIdx(foundIncr, numIncrs)] ?? foundIncr;

  let split = foundIncr;
  let nextMagIncr = foundIncr * logBase;

  if (logBase === 10)
    nextMagIncr = numIncrs[closestIdx(nextMagIncr, numIncrs)] ?? nextMagIncr;

  do {
    if (split >= scaleMin)
      splits.push(split);

    split = split + foundIncr;

    if (logBase === 10 && !fixedDec.has(split)) {
      const dec = fixedDec.get(foundIncr) ?? 0;
      split = roundDec(split, dec);
    }

    if (split >= nextMagIncr) {
      foundIncr = split;
      nextMagIncr = foundIncr * logBase;

      if (logBase === 10)
        nextMagIncr = numIncrs[closestIdx(nextMagIncr, numIncrs)] ?? nextMagIncr;
    }
  } while (split <= scaleMax);

  return splits;
}

/**
 * Generate tick split positions for an asinh (symmetric log) axis.
 * Produces linear ticks near zero and logarithmic ticks at larger magnitudes.
 *
 * @param scaleMin - minimum value on the scale
 * @param scaleMax - maximum value on the scale
 * @param linthresh - linear threshold (values within [-linthresh, linthresh] are linear)
 */
export function asinhAxisSplits(
  scaleMin: number,
  scaleMax: number,
  linthresh = 1,
): number[] {
  const splits: number[] = [];

  // Determine the order of magnitude for the range
  const absMax = Math.max(abs(scaleMin), abs(scaleMax));
  if (absMax === 0) return [0];

  // Generate negative ticks (large magnitude to small)
  if (scaleMin < 0) {
    const negMax = abs(scaleMin);
    let mag = pow(10, floor(log10(Math.max(negMax, linthresh))));

    while (mag >= linthresh) {
      const val = -mag;
      if (val >= scaleMin && val <= scaleMax) splits.push(val);
      mag /= 10;
    }
  }

  // Linear region around zero
  if (scaleMin <= 0 && scaleMax >= 0) {
    splits.push(0);
  }

  // Generate positive ticks (small magnitude to large)
  if (scaleMax > 0) {
    let mag = linthresh;
    const posMax = scaleMax;

    while (mag <= posMax) {
      if (mag >= scaleMin && mag <= scaleMax) splits.push(mag);
      mag *= 10;
    }
  }

  // Sort and deduplicate
  splits.sort((a, b) => a - b);
  const unique: number[] = [];
  for (const s of splits) {
    if (unique.length === 0 || unique[unique.length - 1] !== s) {
      unique.push(s);
    }
  }

  return unique;
}

/**
 * Filter log axis split values to reduce label density.
 * Keeps only values that are exact powers of the log base.
 * This prevents crowded labels at intermediate ticks (2, 3, 4... between 1 and 10).
 */
export function logAxisValFilter(
  splits: number[],
  logBase: number,
): boolean[] {
  const logFn = logBase === 10 ? log10 : log2;

  return splits.map(v => {
    if (v === 0) return true;
    if (v < 0) return false;
    const logVal = logFn(v);
    // Keep if it's an integer power of the base (within floating-point tolerance)
    return abs(logVal - Math.round(logVal)) < 1e-10;
  });
}

/**
 * Estimate minimum pixel spacing between tick labels based on label width.
 * Avoids overlap for large numbers (e.g., Unix timestamps) without canvas text measurement.
 */
function estimateMinSpace(min: number, max: number): number {
  const maxAbsStr = fmtNum(Math.max(Math.abs(min), Math.abs(max)));
  const estWidth = maxAbsStr.length * 7; // ~7px per char at 12px font
  return Math.max(50, estWidth + 16);    // 16px padding between labels
}

/**
 * Determine optimal tick increment and spacing for an axis.
 * Ported from uPlot uPlot.js getIncrSpace.
 */
export function getIncrSpace(
  axis: AxisConfig,
  min: number,
  max: number,
  fullDim: number,
): [number, number] {
  if (fullDim <= 0)
    return [0, 0];

  const isVertical = axis.side % 2 === 1;
  // Y-axis: vertical spacing based on font height + gap (~30px, matching uPlot yAxisOpts.space).
  // X-axis: horizontal spacing based on label width estimate.
  const minSpace = axis.space ?? (isVertical ? 30 : estimateMinSpace(min, max));
  const incrs = axis.incrs ?? numIncrs;

  return findIncr(min, max, incrs, fullDim, minSpace);
}

/** Default axis size in CSS pixels */
const DEFAULT_AXIS_SIZE = 50;

/**
 * Compute the size of an axis in CSS pixels.
 * For vertical axes, estimates width from the longest tick label.
 * For horizontal axes, uses a fixed height based on font size.
 */
export function computeAxisSize(
  axis: AxisConfig,
  _values: string[] | null,
  _cycleNum: number,
): number {
  if (axis.size != null)
    return axis.size;

  const tickSize = axis.ticks?.show !== false ? (axis.ticks?.size ?? 10) : 0;
  const gap = axis.gap ?? 5;
  const fontSize = 12;

  const isVertical = axis.side % 2 === 1;

  if (isVertical && _values != null) {
    // Estimate max label width from character count
    let maxLen = 0;
    for (const v of _values) {
      if (v.length > maxLen) maxLen = v.length;
    }
    const estLabelWidth = maxLen * 7; // ~7px per char at 12px font
    return Math.max(50, tickSize + gap + estLabelWidth + 4);
  }

  // Horizontal axis: fixed height. Default 50px matches uPlot.
  return Math.max(50, tickSize + gap + fontSize + 3);
}

/**
 * Create an initial AxisState from an AxisConfig.
 */
export function createAxisState(config: AxisConfig): AxisState {
  return {
    config,
    _show: config.show !== false,
    _size: config.size ?? DEFAULT_AXIS_SIZE,
    _pos: 0,
    _lpos: 0,
    _splits: null,
    _values: null,
    _incr: 0,
    _space: 0,
    _rotate: 0,
  };
}
