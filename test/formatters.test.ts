import { describe, it, expect } from 'vitest';
import {
  fmtCompact,
  fmtSuffix,
  fmtHourMin,
  fmtMonthName,
  fmtDateStr,
  fmtLabels,
} from '@/formatters';

describe('fmtCompact', () => {
  it('formats thousands with K suffix', () => {
    const fmt = fmtCompact();
    expect(fmt([1200, 5000, 999], 0, 0)).toEqual(['1.2K', '5.0K', '999']);
  });

  it('formats millions with M suffix', () => {
    const fmt = fmtCompact();
    expect(fmt([1500000, 2000000], 0, 0)).toEqual(['1.5M', '2.0M']);
  });

  it('formats billions with B suffix', () => {
    const fmt = fmtCompact();
    expect(fmt([1e9, 2.5e9], 0, 0)).toEqual(['1.0B', '2.5B']);
  });

  it('handles zero and small values', () => {
    const fmt = fmtCompact();
    expect(fmt([0, 42, 0.5], 0, 0)).toEqual(['0.0', '42', '0.5']);
  });

  it('handles negative values', () => {
    const fmt = fmtCompact();
    expect(fmt([-1500, -2e6], 0, 0)).toEqual(['-1.5K', '-2.0M']);
  });

  it('respects custom decimals', () => {
    const fmt = fmtCompact({ decimals: 2 });
    expect(fmt([1234], 0, 0)).toEqual(['1.23K']);
  });
});

describe('fmtSuffix', () => {
  it('appends suffix to values', () => {
    const fmt = fmtSuffix('%');
    expect(fmt([10, 50, 100], 0, 0)).toEqual(['10%', '50%', '100%']);
  });

  it('uses specified decimals', () => {
    const fmt = fmtSuffix('°C', 1);
    expect(fmt([23.456, 0], 0, 0)).toEqual(['23.5°C', '0.0°C']);
  });
});

describe('fmtHourMin', () => {
  it('formats UTC timestamps as HH:MM', () => {
    const fmt = fmtHourMin({ utc: true, locale: 'en-US' });
    // 2024-01-01 14:30 UTC
    const ts = Date.UTC(2024, 0, 1, 14, 30) / 1000;
    const result = fmt([ts], 0, 0);
    expect(result[0]).toBe('14:30');
  });
});

describe('fmtMonthName', () => {
  it('formats timestamps as short month names', () => {
    const fmt = fmtMonthName({ utc: true, locale: 'en-US' });
    const jan = Date.UTC(2024, 0, 15) / 1000;
    const jul = Date.UTC(2024, 6, 15) / 1000;
    const result = fmt([jan, jul], 0, 0);
    expect(result[0]).toBe('Jan');
    expect(result[1]).toBe('Jul');
  });

  it('supports long format', () => {
    const fmt = fmtMonthName({ utc: true, format: 'long', locale: 'en-US' });
    const jan = Date.UTC(2024, 0, 15) / 1000;
    const result = fmt([jan], 0, 0);
    expect(result[0]).toBe('January');
  });
});

describe('fmtDateStr', () => {
  it('formats with custom Intl options', () => {
    const fmt = fmtDateStr({ year: 'numeric', month: '2-digit', day: '2-digit', tz: 'UTC', locale: 'en-US' });
    const ts = Date.UTC(2024, 5, 15) / 1000;
    const result = fmt([ts], 0, 0);
    expect(result[0]).toBe('06/15/2024');
  });
});

describe('fmtLabels', () => {
  it('maps indices to labels', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    const fmt = fmtLabels(months);
    expect(fmt([0, 1, 2, 3], 0, 0)).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
  });

  it('applies offset', () => {
    const months = ['Jan', 'Feb', 'Mar'];
    const fmt = fmtLabels(months, 1);
    expect(fmt([1, 2, 3], 0, 0)).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('falls back to string for out-of-range indices', () => {
    const labels = ['A', 'B'];
    const fmt = fmtLabels(labels);
    expect(fmt([0, 1, 5], 0, 0)).toEqual(['A', 'B', '5']);
  });
});
