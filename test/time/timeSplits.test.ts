import { describe, it, expect } from 'vitest';
import { timeAxisSplits } from '@/time/timeSplits';
import { DAY, HOUR, MIN, MONTH, YEAR } from '@/time/timeIncrs';

describe('timeAxisSplits', () => {
  it('generates hourly splits', () => {
    const min = 1700000000; // ~2023-11-14T22:13:20
    const max = min + 12 * HOUR;
    const splits = timeAxisSplits(min, max, HOUR);
    expect(splits.length).toBeGreaterThan(0);
    // All splits should be HOUR-aligned
    for (const s of splits) {
      expect(s % HOUR).toBe(0);
    }
  });

  it('generates daily splits', () => {
    const min = 1700000000;
    const max = min + 7 * DAY;
    const splits = timeAxisSplits(min, max, DAY);
    expect(splits.length).toBeGreaterThanOrEqual(6);
    for (const s of splits) {
      expect(s).toBeGreaterThanOrEqual(min);
      expect(s).toBeLessThanOrEqual(max);
    }
  });

  it('generates minute splits', () => {
    const min = 1700000000;
    const max = min + 60 * MIN;
    const splits = timeAxisSplits(min, max, 5 * MIN);
    expect(splits.length).toBeGreaterThan(0);
    for (const s of splits) {
      expect(s % (5 * MIN)).toBe(0);
    }
  });

  it('generates monthly splits', () => {
    const min = 1700000000;
    const max = min + 6 * MONTH;
    const splits = timeAxisSplits(min, max, MONTH);
    expect(splits.length).toBeGreaterThanOrEqual(5);
  });

  it('generates yearly splits', () => {
    const min = 1700000000;
    const max = min + 3 * YEAR;
    const splits = timeAxisSplits(min, max, YEAR);
    expect(splits.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for invalid range', () => {
    expect(timeAxisSplits(100, 50, HOUR)).toEqual([]);
    expect(timeAxisSplits(100, 200, 0)).toEqual([]);
  });

  it('all splits are within range', () => {
    const min = 1700000000;
    const max = min + 24 * HOUR;
    const splits = timeAxisSplits(min, max, HOUR);
    for (const s of splits) {
      expect(s).toBeGreaterThanOrEqual(min);
      expect(s).toBeLessThanOrEqual(max);
    }
  });
});
