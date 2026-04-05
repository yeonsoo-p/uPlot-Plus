import { describe, it, expect } from 'vitest';
import {
  rangeToFrac,
  fracToRange,
  detectDragMode,
  applyDrag,
  DEFAULT_SELECTION,
  MIN_SELECTION_FRAC,
} from '@/components/ZoomRanger';

describe('rangeToFrac', () => {
  it('converts absolute data range to fractions', () => {
    const [left, right] = rangeToFrac([25, 75], 0, 100);
    expect(left).toBe(0.25);
    expect(right).toBe(0.75);
  });

  it('returns DEFAULT_SELECTION when initialRange is undefined', () => {
    expect(rangeToFrac(undefined, 0, 100)).toEqual(DEFAULT_SELECTION);
  });

  it('returns DEFAULT_SELECTION when data range is zero', () => {
    expect(rangeToFrac([10, 20], 50, 50)).toEqual(DEFAULT_SELECTION);
  });

  it('returns DEFAULT_SELECTION when data range is negative', () => {
    expect(rangeToFrac([10, 20], 100, 0)).toEqual(DEFAULT_SELECTION);
  });

  it('clamps fractions to [0, 1]', () => {
    const [left, right] = rangeToFrac([-50, 150], 0, 100);
    expect(left).toBe(0);
    expect(right).toBe(1);
  });

  it('handles non-zero base correctly', () => {
    const [left, right] = rangeToFrac([150, 250], 100, 300);
    expect(left).toBeCloseTo(0.25);
    expect(right).toBeCloseTo(0.75);
  });

  it('handles timestamp-scale data', () => {
    const base = 1700000000;
    const end = base + 86400; // 1 day
    const [left, right] = rangeToFrac([base + 21600, base + 64800], base, end);
    expect(left).toBeCloseTo(0.25);
    expect(right).toBeCloseTo(0.75);
  });
});

describe('fracToRange', () => {
  it('converts fractions back to absolute data values', () => {
    const [min, max] = fracToRange([0.25, 0.75], 0, 100);
    expect(min).toBe(25);
    expect(max).toBe(75);
  });

  it('round-trips with rangeToFrac', () => {
    const original: [number, number] = [30, 80];
    const frac = rangeToFrac(original, 0, 100);
    const [min, max] = fracToRange(frac, 0, 100);
    expect(min).toBeCloseTo(30);
    expect(max).toBeCloseTo(80);
  });

  it('handles full range', () => {
    const [min, max] = fracToRange([0, 1], 0, 100);
    expect(min).toBe(0);
    expect(max).toBe(100);
  });

  it('handles non-zero base', () => {
    const [min, max] = fracToRange([0.5, 1], 100, 300);
    expect(min).toBe(200);
    expect(max).toBe(300);
  });
});

describe('detectDragMode', () => {
  const selFrac: [number, number] = [0.25, 0.75];
  const threshold = 0.02;

  it('returns "left" when click is near left edge', () => {
    expect(detectDragMode(0.26, selFrac, threshold)).toBe('left');
  });

  it('returns "right" when click is near right edge', () => {
    expect(detectDragMode(0.74, selFrac, threshold)).toBe('right');
  });

  it('returns "move" when click is inside selection', () => {
    expect(detectDragMode(0.5, selFrac, threshold)).toBe('move');
  });

  it('returns "outside" when click is before selection', () => {
    expect(detectDragMode(0.1, selFrac, threshold)).toBe('outside');
  });

  it('returns "outside" when click is after selection', () => {
    expect(detectDragMode(0.9, selFrac, threshold)).toBe('outside');
  });

  it('prefers left edge over move when at exact boundary', () => {
    expect(detectDragMode(0.25, selFrac, threshold)).toBe('left');
  });

  it('prefers right edge over move when at exact boundary', () => {
    expect(detectDragMode(0.75, selFrac, threshold)).toBe('right');
  });
});

describe('applyDrag', () => {
  const startFrac: [number, number] = [0.25, 0.75];

  describe('move mode', () => {
    it('shifts selection by delta', () => {
      const [left, right] = applyDrag('move', startFrac, 0.1);
      expect(left).toBeCloseTo(0.35);
      expect(right).toBeCloseTo(0.85);
    });

    it('preserves selection width', () => {
      const [left, right] = applyDrag('move', startFrac, 0.1);
      expect(right - left).toBeCloseTo(0.5);
    });

    it('clamps to left boundary', () => {
      const [left, right] = applyDrag('move', startFrac, -0.5);
      expect(left).toBe(0);
      expect(right).toBeCloseTo(0.5);
    });

    it('clamps to right boundary', () => {
      const [left, right] = applyDrag('move', startFrac, 0.5);
      expect(left).toBeCloseTo(0.5);
      expect(right).toBe(1);
    });
  });

  describe('left edge mode', () => {
    it('moves left edge by delta', () => {
      const [left, right] = applyDrag('left', startFrac, -0.1);
      expect(left).toBeCloseTo(0.15);
      expect(right).toBe(0.75);
    });

    it('clamps left edge to zero', () => {
      const [left, right] = applyDrag('left', startFrac, -0.5);
      expect(left).toBe(0);
      expect(right).toBe(0.75);
    });

    it('enforces minimum selection width', () => {
      const [left, right] = applyDrag('left', startFrac, 0.6);
      expect(left).toBeCloseTo(0.75 - MIN_SELECTION_FRAC);
      expect(right).toBe(0.75);
    });
  });

  describe('right edge mode', () => {
    it('moves right edge by delta', () => {
      const [left, right] = applyDrag('right', startFrac, 0.1);
      expect(left).toBe(0.25);
      expect(right).toBeCloseTo(0.85);
    });

    it('clamps right edge to one', () => {
      const [left, right] = applyDrag('right', startFrac, 0.5);
      expect(left).toBe(0.25);
      expect(right).toBe(1);
    });

    it('enforces minimum selection width', () => {
      const [left, right] = applyDrag('right', startFrac, -0.6);
      expect(left).toBe(0.25);
      expect(right).toBeCloseTo(0.25 + MIN_SELECTION_FRAC);
    });
  });
});
