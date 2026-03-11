import type { ScaleConfig, ScaleState } from '../types';
import { log10, log2, sinh, asinh } from '../math/utils';

/** Create a ScaleState from config with defaults */
export function createScaleState(cfg: ScaleConfig): ScaleState {
  return {
    id: cfg.id,
    min: cfg.min ?? null,
    max: cfg.max ?? null,
    distr: cfg.distr ?? 1,
    log: cfg.log ?? 10,
    asinh: cfg.asinh ?? 1,
    ori: cfg.ori ?? 0,
    dir: cfg.dir ?? 1,
    time: cfg.time ?? false,
    auto: cfg.auto ?? true,
    range: cfg.range ?? null,
    _min: null,
    _max: null,
  };
}

/** Invalidate cached transformed min/max (call when min/max change) */
export function invalidateScaleCache(scale: ScaleState): void {
  scale._min = null;
  scale._max = null;
}

/** Get transformed min value (cached for log/asinh) */
function getTransformedMin(scale: ScaleState): number {
  if (scale._min != null) return scale._min;
  const { min, distr } = scale;
  if (min == null) return 0;
  if (distr === 3) {
    const safeMin = min > 0 ? min : 1e-10;
    scale._min = (scale.log === 10 ? log10 : log2)(safeMin);
  } else if (distr === 4) {
    scale._min = asinh(min, scale.asinh);
  } else {
    scale._min = min;
  }
  return scale._min;
}

/** Get transformed max value (cached for log/asinh) */
function getTransformedMax(scale: ScaleState): number {
  if (scale._max != null) return scale._max;
  const { max, distr } = scale;
  if (max == null) return 0;
  if (distr === 3) {
    const safeMax = max > 0 ? max : 1e-10;
    scale._max = (scale.log === 10 ? log10 : log2)(safeMax);
  } else if (distr === 4) {
    scale._max = asinh(max, scale.asinh);
  } else {
    scale._max = max;
  }
  return scale._max;
}

/**
 * Convert a data value to a 0-1 fraction within the scale range.
 * Uses cached transformed min/max for log/asinh distributions.
 */
export function valToPct(val: number, scale: ScaleState): number {
  if (scale.min == null || scale.max == null) return 0;

  const tMin = getTransformedMin(scale);
  const tMax = getTransformedMax(scale);
  const range = tMax - tMin;
  if (range === 0) return 0;

  const { distr } = scale;

  if (distr === 3) {
    const logFn = scale.log === 10 ? log10 : log2;
    const safeVal = val > 0 ? val : 1e-10;
    return (logFn(safeVal) - tMin) / range;
  }

  if (distr === 4) {
    return (asinh(val, scale.asinh) - tMin) / range;
  }

  // Linear (distr 1) and ordinal (distr 2)
  return (val - tMin) / range;
}

/**
 * Convert a 0-1 fraction to a data value within the scale range.
 */
export function pctToVal(pct: number, scale: ScaleState): number {
  if (scale.min == null || scale.max == null) return 0;

  const tMin = getTransformedMin(scale);
  const tMax = getTransformedMax(scale);
  const { distr } = scale;

  if (distr === 3) {
    return Math.pow(scale.log, tMin + pct * (tMax - tMin));
  }

  if (distr === 4) {
    return sinh(tMin + pct * (tMax - tMin), scale.asinh);
  }

  return tMin + pct * (tMax - tMin);
}

/**
 * Convert a data value to a CSS pixel position within a dimension.
 */
export function valToPos(val: number, scale: ScaleState, dim: number, off: number): number {
  const pct = valToPct(val, scale);
  let pos: number;

  if (scale.ori === 0) {
    // Horizontal: left-to-right when dir=1
    pos = scale.dir === 1 ? pct : 1 - pct;
  } else {
    // Vertical: bottom-to-top when dir=1 (canvas Y is inverted)
    pos = scale.dir === 1 ? 1 - pct : pct;
  }

  return off + pos * dim;
}

/**
 * Convert a CSS pixel position to a data value.
 */
export function posToVal(pos: number, scale: ScaleState, dim: number, off: number): number {
  let pct = (pos - off) / dim;

  if (scale.ori === 0) {
    if (scale.dir === -1) pct = 1 - pct;
  } else {
    // Vertical: invert by default (canvas Y grows downward)
    if (scale.dir !== -1) pct = 1 - pct;
  }

  return pctToVal(pct, scale);
}
