import { DAY, HOUR, MIN, MONTH, WEEK, YEAR } from './timeIncrs';
import { fmtHourMinute, fmtTimeOnly, fmtFullDateTime, fmtDateOnly, fmtMonthDay, fmtMonthYear, fmtYear } from './fmtDate';

/**
 * Format time axis tick values as strings.
 * Adaptively selects format based on the increment:
 * - Sub-minute: HH:MM:SS
 * - Minutes/hours: HH:MM
 * - Days: "Mon DD"
 * - Months: "Mon YYYY"
 * - Years: "YYYY"
 */
export function timeAxisVals(
  splits: number[],
  incr: number,
  tz?: string,
): string[] {
  let fmt: (ts: number, tz?: string) => string;

  if (incr >= YEAR)
    fmt = fmtYear;
  else if (incr >= MONTH)
    fmt = fmtMonthYear;
  else if (incr >= WEEK)
    fmt = fmtDateOnly;
  else if (incr >= DAY)
    fmt = fmtMonthDay;
  else if (incr >= HOUR)
    fmt = fmtHourMinute;
  else if (incr >= MIN)
    fmt = fmtTimeOnly;
  else
    fmt = fmtFullDateTime;

  return splits.map(ts => fmt(ts, tz));
}

/**
 * Find the best time increment for a given time range and pixel dimension.
 * Returns [increment, spacing] where increment is in seconds.
 */
export function findTimeIncr(
  minSec: number,
  maxSec: number,
  timeIncrs: readonly number[],
  dim: number,
  minSpace: number,
): [number, number] {
  const range = maxSec - minSec;
  if (range <= 0 || dim <= 0) return [0, 0];

  for (const incr of timeIncrs) {
    const nTicks = range / incr;
    const space = dim / nTicks;
    if (space >= minSpace)
      return [incr, space];
  }

  // Fallback: use the largest increment
  const lastIncr = timeIncrs[timeIncrs.length - 1] ?? YEAR;
  return [lastIncr, dim / (range / lastIncr)];
}
