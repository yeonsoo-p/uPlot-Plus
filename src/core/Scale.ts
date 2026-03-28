import type { ScaleConfig, ScaleState } from '../types';
import { Orientation, Direction, Distribution } from '../types';
import { log10, log2, sinh, asinh } from '../math/utils';

/** Create a ScaleState from config with defaults */
export function createScaleState(cfg: ScaleConfig): ScaleState {
  return {
    id: cfg.id,
    min: cfg.min ?? null,
    max: cfg.max ?? null,
    distr: cfg.distr ?? Distribution.Linear,
    log: cfg.log ?? 10,
    asinh: cfg.asinh ?? 1,
    ori: cfg.ori ?? (cfg.id === 'x' ? Orientation.Horizontal : Orientation.Vertical),
    dir: cfg.dir ?? Direction.Forward,
    time: cfg.time ?? false,
    auto: cfg.auto ?? true,
    range: cfg.range ?? null,
    _discrete: false,
    _cfgMin: cfg.min ?? null,
    _cfgMax: cfg.max ?? null,
    _min: null,
    _max: null,
  };
}

/** Check whether a scale has valid (non-null) min and max values. */
export function isScaleReady(scale: ScaleState): scale is ScaleState & { min: number; max: number } {
  return scale.min != null && scale.max != null;
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
  if (distr === Distribution.Log) {
    if (min <= 0) {
      console.warn(`[uPlot+] Log scale "${scale.id}": min value ${min} <= 0, clamping to 1e-10`);
    }
    const safeMin = min > 0 ? min : 1e-10;
    scale._min = (scale.log === 10 ? log10 : log2)(safeMin);
  } else if (distr === Distribution.Asinh) {
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
  if (distr === Distribution.Log) {
    if (max <= 0) {
      console.warn(`[uPlot+] Log scale "${scale.id}": max value ${max} <= 0, clamping to 1e-10`);
    }
    const safeMax = max > 0 ? max : 1e-10;
    scale._max = (scale.log === 10 ? log10 : log2)(safeMax);
  } else if (distr === Distribution.Asinh) {
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

  if (distr === Distribution.Log) {
    const logFn = scale.log === 10 ? log10 : log2;
    const safeVal = val > 0 ? val : 1e-10;
    return (logFn(safeVal) - tMin) / range;
  }

  if (distr === Distribution.Asinh) {
    return (asinh(val, scale.asinh) - tMin) / range;
  }

  // Linear and ordinal
  return (val - tMin) / range;
}

/**
 * Convert a 0-1 fraction to a data value within the scale range.
 */
export function pctToVal(pct: number, scale: ScaleState): number {
  if (scale.min == null || scale.max == null) return 0;

  const tMin = getTransformedMin(scale);
  const tMax = getTransformedMax(scale);

  if (tMax === tMin) return scale.min;

  const { distr } = scale;

  if (distr === Distribution.Log) {
    return Math.pow(scale.log, tMin + pct * (tMax - tMin));
  }

  if (distr === Distribution.Asinh) {
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

  if (scale.ori === Orientation.Horizontal) {
    // Horizontal: left-to-right when dir=Fwd
    pos = scale.dir === Direction.Forward ? pct : 1 - pct;
  } else {
    // Vertical: bottom-to-top when dir=Fwd (canvas Y is inverted)
    pos = scale.dir === Direction.Forward ? 1 - pct : pct;
  }

  return off + pos * dim;
}

/**
 * Convert a CSS pixel position to a data value.
 */
export function posToVal(pos: number, scale: ScaleState, dim: number, off: number): number {
  if (dim === 0) return scale.min ?? 0;

  let pct = (pos - off) / dim;

  if (scale.ori === Orientation.Horizontal) {
    if (scale.dir === Direction.Backward) pct = 1 - pct;
  } else {
    // Vertical: invert by default (canvas Y grows downward)
    if (scale.dir !== Direction.Backward) pct = 1 - pct;
  }

  return pctToVal(pct, scale);
}
