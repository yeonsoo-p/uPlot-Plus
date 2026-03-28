import { fmtDate } from './time/fmtDate';

/** Axis value formatter compatible with AxisConfig.values */
export type AxisValueFormatter = (splits: number[], space: number, incr: number) => string[];

/**
 * Format numbers compactly with SI suffixes: 1200 → "1.2K", 2500000 → "2.5M".
 * Handles negative values and zero. Useful for log scales and large-range axes.
 */
export function fmtCompact(opts?: { decimals?: number }): AxisValueFormatter {
  const dec = opts?.decimals ?? 1;
  return (splits: number[]) =>
    splits.map(v => {
      const abs = Math.abs(v);
      if (abs >= 1e9) return (v / 1e9).toFixed(dec) + 'B';
      if (abs >= 1e6) return (v / 1e6).toFixed(dec) + 'M';
      if (abs >= 1e3) return (v / 1e3).toFixed(dec) + 'K';
      return v.toFixed(abs >= 1 ? 0 : dec);
    });
}

/**
 * Append a suffix to each formatted value: fmtSuffix('%') → "42%", fmtSuffix('°C', 1) → "23.5°C".
 */
export function fmtSuffix(suffix: string, decimals = 0): AxisValueFormatter {
  return (splits: number[]) =>
    splits.map(v => v.toFixed(decimals) + suffix);
}

/**
 * Prepend a prefix to each formatted value: fmtPrefix('$') → "$42", fmtPrefix('Q') → "Q1".
 */
export function fmtPrefix(prefix: string, decimals = 0): AxisValueFormatter {
  return (splits: number[]) =>
    splits.map(v => prefix + v.toFixed(decimals));
}

/**
 * Wrap each formatted value with a prefix and suffix: fmtWrap('$', 'K') → "$42K".
 */
export function fmtWrap(prefix: string, suffix: string, decimals = 0): AxisValueFormatter {
  return (splits: number[]) =>
    splits.map(v => prefix + v.toFixed(decimals) + suffix);
}

/**
 * Format unix timestamps (seconds) as HH:MM.
 */
export function fmtHourMin(opts?: { utc?: boolean }): AxisValueFormatter {
  const utc = opts?.utc ?? false;
  return (splits: number[]) =>
    splits.map(v => {
      if (utc) {
        return fmtDate(v, { hour: '2-digit', minute: '2-digit', hour12: false }, 'UTC');
      }
      return fmtDate(v, { hour: '2-digit', minute: '2-digit', hour12: false });
    });
}

/**
 * Format unix timestamps (seconds) as month names: "Jan", "Feb", etc.
 */
export function fmtMonthName(opts?: { utc?: boolean; format?: 'short' | 'long' }): AxisValueFormatter {
  const tz = opts?.utc ? 'UTC' : undefined;
  const month = opts?.format ?? 'short';
  return (splits: number[]) =>
    splits.map(v => fmtDate(v, { month }, tz));
}

/**
 * Format unix timestamps (seconds) using arbitrary Intl.DateTimeFormat options.
 */
export function fmtDateStr(opts?: Intl.DateTimeFormatOptions & { tz?: string }): AxisValueFormatter {
  const { tz, ...fmtOpts } = opts ?? {};
  return (splits: number[]) =>
    splits.map(v => fmtDate(v, fmtOpts, tz));
}

/**
 * Map numeric indices to labels from an array.
 * Useful for categorical/ordinal axes: fmtLabels(['Jan','Feb','Mar']).
 * @param offset - subtract this from the split value before indexing (default 0)
 */
export function fmtLabels(labels: readonly string[], offset = 0): AxisValueFormatter {
  return (splits: number[]) =>
    splits.map(v => {
      const i = Math.round(v) - offset;
      return labels[i] ?? String(v);
    });
}
