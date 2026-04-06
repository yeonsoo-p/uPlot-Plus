import { SortOrder } from '../types';

// Math shortcuts
const M = Math;
export const PI = M.PI;
export const abs = M.abs;
export const floor = M.floor;
export const round = M.round;
export const ceil = M.ceil;
export const min = M.min;
export const max = M.max;
export const pow = M.pow;
export const sqrt = M.sqrt;
export const sign = M.sign;
export const log10 = M.log10;
export const log2 = M.log2;
export const sinh = (v: number, linthresh = 1) => M.sinh(v) * linthresh;
export const asinh = (v: number, linthresh = 1) => M.asinh(v / linthresh);
export const inf = Infinity;
export const isInt = Number.isInteger;

/** Safely read an array element, returning 0 for out-of-bounds */
function at(arr: ArrayLike<number>, i: number): number {
  return arr[i] ?? 0;
}

/** Binary search for index of closest value in a sorted array */
export function closestIdx(num: number, arr: ArrayLike<number>, lo = 0, hi = arr.length - 1): number {
  let mid: number;
  const bitwise = hi <= 2147483647;

  while (hi - lo > 1) {
    mid = bitwise ? (lo + hi) >> 1 : floor((lo + hi) / 2);

    if (at(arr, mid) < num)
      lo = mid;
    else
      hi = mid;
  }

  if (num - at(arr, lo) <= at(arr, hi) - num)
    return lo;

  return hi;
}

type IndexPredicate = (v: number | null | undefined) => boolean;

const notNullish: IndexPredicate = (v) => v != null;
const isPositive: IndexPredicate = (v) => v != null && v > 0;

/** Factory for index-of-first/last functions with a predicate */
function makeIndexOfs(predicate: IndexPredicate) {
  return (data: ArrayLike<number | null | undefined>, _i0: number, _i1: number): [number, number] => {
    let i0 = -1;
    let i1 = -1;

    for (let i = _i0; i <= _i1; i++) {
      if (predicate(data[i])) {
        i0 = i;
        break;
      }
    }

    for (let i = _i1; i >= _i0; i--) {
      if (predicate(data[i])) {
        i1 = i;
        break;
      }
    }

    return [i0, i1];
  };
}

/** Find first and last non-null indices in a range */
export const nonNullIdxs = makeIndexOfs(notNullish);

/** Find first and last positive indices in a range (for log scales) */
export const positiveIdxs = makeIndexOfs(isPositive);

/** Get min and max of a data array within index range */
export function getMinMax(
  data: ArrayLike<number | null>,
  _i0: number,
  _i1: number,
  sorted: SortOrder = SortOrder.Unsorted,
  log = false,
): [number, number] {
  const getEdgeIdxs = log ? positiveIdxs : nonNullIdxs;
  const predicate = log ? isPositive : notNullish;

  const [i0, i1] = getEdgeIdxs(data, _i0, _i1);

  let _min = data[i0] ?? inf;
  let _max = data[i0] ?? -inf;

  if (i0 > -1) {
    if (sorted === SortOrder.Ascending) {
      _min = data[i0] ?? inf;
      _max = data[i1] ?? -inf;
    } else if (sorted === SortOrder.Descending) {
      _min = data[i1] ?? inf;
      _max = data[i0] ?? -inf;
    } else {
      for (let i = i0; i <= i1; i++) {
        const v = data[i];
        if (v != null && predicate(v)) {
          if (v < _min) _min = v;
          else if (v > _max) _max = v;
        }
      }
    }
  }

  return [_min, _max];
}

/** Round to a specified number of decimal places (half away from zero) */
export function roundDec(val: number, dec = 0): number {
  if (isInt(val))
    return val;

  const p = 10 ** dec;
  const n = (val * p) * (1 + Number.EPSILON);
  return round(n) / p;
}

const fixedDecMap = new Map<number, number>();

export { fixedDecMap as fixedDec };

/** Guess the number of decimal places in a number */
export function guessDec(num: number): number {
  return (String(num).split(".")[1] ?? "").length;
}

const regex6 = /\.\d*?(?=9{6,}|0{6,})/gm;

/** Fix floating point artifacts like 17999.204999999998 -> 17999.205 */
function fixFloat(val: number): number {
  if (isInt(val) || fixedDecMap.has(val))
    return val;

  const str = `${val}`;
  const match = str.match(regex6);

  if (match == null)
    return val;

  const len = match[0].length - 1;

  if (str.indexOf('e-') !== -1) {
    const parts = str.split('e');
    const base = parts[0] ?? '0';
    const exp = parts[1] ?? '0';
    return +`${fixFloat(+base)}e${exp}`;
  }

  return roundDec(val, len);
}

/** Round num to nearest multiple of incr */
export function incrRound(num: number, incr: number, _fixFloat = true): number {
  return _fixFloat ? fixFloat(roundDec(fixFloat(num / incr)) * incr) : roundDec(num / incr) * incr;
}

/** Round num up to nearest multiple of incr */
export function incrRoundUp(num: number, incr: number, _fixFloat = true): number {
  return _fixFloat ? fixFloat(ceil(fixFloat(num / incr)) * incr) : ceil(num / incr) * incr;
}

/** Round num down to nearest multiple of incr */
export function incrRoundDn(num: number, incr: number, _fixFloat = true): number {
  return _fixFloat ? fixFloat(floor(fixFloat(num / incr)) * incr) : floor(num / incr) * incr;
}

/** Generate a pixel-rounding function from a pxAlign value (ported from uPlot) */
export function pxRoundGen(pxAlign: number): (v: number) => number {
  return pxAlign === 0 ? (v: number) => v : pxAlign === 1 ? round : (v: number) => incrRound(v, pxAlign);
}

/** Generate increment values for tick spacing */
export function genIncrs(base: number, minExp: number, maxExp: number, mults: number[]): number[] {
  const incrs: number[] = [];
  const multDec = mults.map(guessDec);

  for (let exp = minExp; exp < maxExp; exp++) {
    const expa = abs(exp);
    const mag = roundDec(pow(base, exp), expa);

    for (let i = 0; i < mults.length; i++) {
      const mult = mults[i] ?? 0;
      const mDec = multDec[i] ?? 0;
      const _incr = base === 10 ? +`${mult}e${exp}` : mult * mag;
      const dec = (exp >= 0 ? 0 : expa) + (exp >= mDec ? 0 : mDec);
      const incr = base === 10 ? _incr : roundDec(_incr, dec);
      incrs.push(incr);
      fixedDecMap.set(incr, dec);
    }
  }

  return incrs;
}

/** Clamp a value between min and max */
export function clamp(num: number, _min: number, _max: number): number {
  return min(max(num, _min), _max);
}

/** Number formatter (locale-aware with caching) */
const numFmtCache = new Map<string, Intl.NumberFormat>();
export function fmtNum(val: number, locale?: string): string {
  const key = locale ?? '';
  let fmt = numFmtCache.get(key);
  if (fmt == null) {
    fmt = new Intl.NumberFormat(locale);
    numFmtCache.set(key, fmt);
  }
  return fmt.format(val);
}

/** Check if range has any non-null data */
export function hasData(data: ArrayLike<number | null>, idx0: number, idx1: number): boolean {
  while (idx0 <= idx1) {
    if (data[idx0] != null)
      return true;
    idx0++;
  }
  return false;
}

/** Range padding/soft config for auto-ranging */
export interface RangePartConfig {
  pad: number;
  soft: number | null;
  mode: number;
  hard?: number;
}

export const rangePad = 0.1;

export const autoRangePart: RangePartConfig = {
  mode: 3,
  pad: rangePad,
  soft: null,
};

/** Shared mutable range config for the dual-mode rangeNum wrapper */
const _eqRangePart: RangePartConfig = { pad: 0, soft: null, mode: 0 };
const _eqRange = { min: _eqRangePart, max: _eqRangePart };

/**
 * Compute a nice range for numeric data with padding and soft/hard limits.
 * Supports both (min, max, cfg) and (min, max, mult, extra) calling conventions.
 */
export function rangeNum(
  _min: number,
  _max: number,
  cfgOrMult: { min: RangePartConfig; max: RangePartConfig } | number,
  extra?: boolean,
): [number, number] {
  let cfg: { min: RangePartConfig; max: RangePartConfig };

  if (typeof cfgOrMult === 'number') {
    _eqRangePart.pad = cfgOrMult;
    _eqRangePart.soft = extra ? 0 : null;
    _eqRangePart.mode = extra ? 3 : 0;
    cfg = _eqRange;
  } else {
    cfg = cfgOrMult;
  }
  const cmin = cfg.min;
  const cmax = cfg.max;

  const padMin = cmin.pad;
  const padMax = cmax.pad;

  const hardMin = cmin.hard ?? -inf;
  const hardMax = cmax.hard ?? inf;

  const softMin = cmin.soft ?? inf;
  const softMax = cmax.soft ?? -inf;

  const softMinMode = cmin.mode;
  const softMaxMode = cmax.mode;

  let delta = _max - _min;
  const deltaMag = log10(delta);

  const scalarMax = max(abs(_min), abs(_max));
  const scalarMag = log10(scalarMax);

  const scalarMagDelta = abs(scalarMag - deltaMag);

  if (delta < 1e-24 || scalarMagDelta > 10) {
    delta = 0;

    if (_min === 0 || _max === 0) {
      delta = 1e-24;

    }
  }

  const nonZeroDelta = delta || scalarMax || 1e3;
  const mag = log10(nonZeroDelta);
  const base = pow(10, floor(mag));

  const _padMin = nonZeroDelta * (delta === 0 ? (_min === 0 ? 0.1 : 1) : padMin);
  const _newMin = roundDec(incrRoundDn(_min - _padMin, base / 10), 24);
  const useSoftMin = softMinMode === 1 || (softMinMode === 3 && _newMin <= softMin) || (softMinMode === 2 && _newMin >= softMin);
  const _softMin = (_min >= softMin && useSoftMin) ? softMin : inf;
  const minLim = max(hardMin, (_newMin < _softMin && _min >= _softMin) ? _softMin : min(_softMin, _newMin));

  const _padMax = nonZeroDelta * (delta === 0 ? (_max === 0 ? 0.1 : 1) : padMax);
  const _newMax = roundDec(incrRoundUp(_max + _padMax, base / 10), 24);
  const useSoftMax = softMaxMode === 1 || (softMaxMode === 3 && _newMax >= softMax) || (softMaxMode === 2 && _newMax <= softMax);
  const _softMax = (_max <= softMax && useSoftMax) ? softMax : -inf;
  const maxLim = min(hardMax, (_newMax > _softMax && _max <= _softMax) ? _softMax : max(_softMax, _newMax));

  if (minLim === maxLim && minLim === 0)
    return [-1, 1];

  return [minLim, maxLim];
}

/** Compute range for log scales */
export function rangeLog(min_: number, max_: number, base: number, fullMags: boolean): [number, number] {
  if (base === 2)
    fullMags = true;

  const minSign = sign(min_);
  const maxSign = sign(max_);

  if (min_ === max_) {
    if (minSign === -1) {
      min_ *= base;
      max_ /= base;
    } else {
      min_ /= base;
      max_ *= base;
    }
  }

  const logFn = base === 10 ? log10 : log2;

  const growMinAbs = minSign === 1 ? floor : ceil;
  const growMaxAbs = maxSign === 1 ? ceil : floor;

  const minLogAbs = logFn(abs(min_));
  const maxLogAbs = logFn(abs(max_));

  const minExp = growMinAbs(minLogAbs);
  const maxExp = growMaxAbs(maxLogAbs);

  let minIncr = pow(base, minExp);
  let maxIncr = pow(base, maxExp);

  if (base === 10) {
    if (minExp < 0)
      minIncr = roundDec(minIncr, -minExp);
    if (maxExp < 0)
      maxIncr = roundDec(maxIncr, -maxExp);
  }

  if (fullMags) {
    min_ = minIncr * minSign;
    max_ = maxIncr * maxSign;
  } else {
    min_ = incrRoundDn(min_, pow(base, floor(minLogAbs)), false);
    max_ = incrRoundUp(max_, pow(base, floor(maxLogAbs)), false);
  }

  return [min_, max_];
}

/** Compute range for asinh scales */
export function rangeAsinh(min_: number, max_: number, base: number, fullMags: boolean): [number, number] {
  const minMax = rangeLog(min_, max_, base, fullMags);

  if (min_ === 0)
    minMax[0] = 0;
  if (max_ === 0)
    minMax[1] = 0;

  return minMax;
}

/** Count integer digits of a number (for axis label width estimation) */
export function numIntDigits(x: number): number {
  return (log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}

/**
 * Find the optimal tick increment for a given value range.
 * Searches the increments array for the smallest increment that gives
 * at least `minSpace` pixels between ticks.
 */
export function findIncr(
  minVal: number,
  maxVal: number,
  incrs: readonly number[],
  dim: number,
  minSpace: number,
): [number, number] {
  const intDigits = max(numIntDigits(minVal), numIntDigits(maxVal));
  const delta = maxVal - minVal;

  let incrIdx = max(0, closestIdx((minSpace / dim) * delta, incrs) - 1);

  do {
    const foundIncr = incrs[incrIdx] ?? 0;
    const foundSpace = dim * foundIncr / delta;

    if (foundSpace >= minSpace * 0.9 && intDigits + (foundIncr < 5 ? (fixedDecMap.get(foundIncr) ?? 0) : 0) <= 17)
      return [foundIncr, foundSpace];
  } while (++incrIdx < incrs.length);

  return [0, 0];
}
