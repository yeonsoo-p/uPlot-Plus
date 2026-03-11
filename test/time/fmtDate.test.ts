import { describe, it, expect } from 'vitest';
import { fmtDate, fmtHourMinute, fmtMonthDay, fmtYear } from '@/time/fmtDate';

describe('fmtDate', () => {
  // Jan 15, 2024 11:30:00 UTC
  const ts = 1705318200;

  it('formats with Intl options', () => {
    const result = fmtDate(ts, { year: 'numeric' }, 'UTC');
    expect(result).toBe('2024');
  });

  it('formats hour:minute in UTC', () => {
    const result = fmtHourMinute(ts, 'UTC');
    expect(result).toContain('11');
    expect(result).toContain('30');
  });

  it('formats month day', () => {
    const result = fmtMonthDay(ts, 'UTC');
    expect(result).toContain('15');
  });

  it('formats year', () => {
    const result = fmtYear(ts, 'UTC');
    expect(result).toContain('2024');
  });
});
