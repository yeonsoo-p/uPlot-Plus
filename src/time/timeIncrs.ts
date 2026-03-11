/**
 * Time increment constants (in seconds) for time-scale axes.
 * Covers sub-second to multi-year intervals.
 */

export const SEC = 1;
export const MIN = 60;
export const HOUR = 3600;
export const DAY = 86400;
export const WEEK = 604800;
export const MONTH = 2592000;   // 30 days approx
export const YEAR = 31536000;   // 365 days

/**
 * Standard time increments from 1 second to 1 year.
 * Each entry is in seconds.
 */
export const timeIncrs: readonly number[] = [
  // Seconds
  1,
  5,
  10,
  15,
  30,
  // Minutes
  MIN,
  5 * MIN,
  10 * MIN,
  15 * MIN,
  30 * MIN,
  // Hours
  HOUR,
  2 * HOUR,
  3 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  // Days
  DAY,
  2 * DAY,
  3 * DAY,
  7 * DAY,
  14 * DAY,
  // Months (approximate)
  MONTH,
  2 * MONTH,
  3 * MONTH,
  6 * MONTH,
  // Years
  YEAR,
];
