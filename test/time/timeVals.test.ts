import { describe, it, expect } from 'vitest';
import { timeAxisVals, findTimeIncr } from '@/time/timeVals';
import { timeIncrs, HOUR, DAY, YEAR, MIN } from '@/time/timeIncrs';

describe('timeAxisVals', () => {
  it('formats hourly splits as HH:MM', () => {
    // 1700006400 = 2023-11-15 00:00:00 UTC
    // 1700010000 = 2023-11-15 01:00:00 UTC
    // 1700013600 = 2023-11-15 02:00:00 UTC
    const splits = [1700006400, 1700010000, 1700013600];
    const vals = timeAxisVals(splits, HOUR, 'UTC');
    expect(vals.length).toBe(3);
    expect(vals[0]).toContain('00');
    expect(vals[1]).toContain('01');
    expect(vals[2]).toContain('02');
  });

  it('formats daily splits as month + day', () => {
    const splits = [1700006400, 1700092800]; // ~1 day apart
    const vals = timeAxisVals(splits, DAY, 'UTC');
    expect(vals.length).toBe(2);
    // Should contain day numbers
    expect(vals[0]).toMatch(/\d+/);
    expect(vals[0]).not.toEqual(vals[1]);
  });

  it('formats yearly splits as 4-digit year', () => {
    const vals = timeAxisVals([1700006400], YEAR, 'UTC');
    expect(vals.length).toBe(1);
    expect(vals[0]).toContain('2023');
  });

  it('formats sub-minute splits with seconds', () => {
    // Use increment < MIN to trigger fmtTimeOnly
    const ts = 1700006400;
    const vals = timeAxisVals([ts, ts + 10, ts + 20], 10, 'UTC');
    expect(vals.length).toBe(3);
    // fmtTimeOnly includes seconds
    expect(vals[0]).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('selects different format based on increment', () => {
    const ts = 1700006400;
    const hourVals = timeAxisVals([ts], HOUR, 'UTC');
    const yearVals = timeAxisVals([ts], YEAR, 'UTC');
    // Hourly format is shorter and different from yearly
    expect(hourVals[0]).not.toEqual(yearVals[0]);
  });
});

describe('findTimeIncr', () => {
  it('finds appropriate time increment', () => {
    const min = 1700000000;
    const max = min + 24 * HOUR;
    const [incr, space] = findTimeIncr(min, max, timeIncrs, 800, 80);
    expect(incr).toBeGreaterThan(0);
    expect(space).toBeGreaterThanOrEqual(80);
  });

  it('handles very short range', () => {
    const [incr, space] = findTimeIncr(100, 160, timeIncrs, 800, 80);
    expect(incr).toBeGreaterThan(0);
    expect(space).toBeGreaterThanOrEqual(0);
  });

  it('returns [0, 0] for invalid input', () => {
    expect(findTimeIncr(100, 50, timeIncrs, 800, 80)).toEqual([0, 0]);
    expect(findTimeIncr(100, 200, timeIncrs, 0, 80)).toEqual([0, 0]);
  });
});
