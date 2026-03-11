import { describe, it, expect } from 'vitest';
import {
  numAxisSplits,
  numAxisVals,
  logAxisSplits,
  getIncrSpace,
  computeAxisSize,
  createAxisState,
} from '@/axes/ticks';
import type { AxisConfig } from '@/types/axes';
import { Side } from '@/types';

// ---- numAxisSplits ----
describe('numAxisSplits', () => {
  it('generates ticks for basic range', () => {
    const splits = numAxisSplits(0, 10, 2, 50, false);
    expect(splits).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('handles zero crossing', () => {
    const splits = numAxisSplits(-5, 5, 2.5, 50, false);
    expect(splits).toContain(0);
    expect(splits[0]!).toBeGreaterThanOrEqual(-5);
    expect(splits[splits.length - 1]!).toBeLessThanOrEqual(5);
  });

  it('forceMin starts at scaleMin', () => {
    const splits = numAxisSplits(1.3, 10, 2, 50, true);
    expect(splits[0]).toBe(1.3);
  });

  it('returns empty for zero increment', () => {
    const splits = numAxisSplits(0, 10, 0, 50, false);
    expect(splits.length).toBe(0);
  });

  it('eliminates negative zero', () => {
    const splits = numAxisSplits(-1, 1, 0.5, 50, false);
    for (const s of splits) {
      expect(Object.is(s, -0)).toBe(false);
    }
  });
});

// ---- numAxisVals ----
describe('numAxisVals', () => {
  it('formats splits as strings containing the numeric values', () => {
    const vals = numAxisVals([0, 5, 10]);
    expect(vals).toHaveLength(3);
    expect(vals[0]).toContain('0');
    expect(vals[1]).toContain('5');
    expect(vals[2]).toContain('10');
  });

  it('formats large numbers with locale formatting', () => {
    const vals = numAxisVals([1000, 50000]);
    expect(vals).toEqual(['1,000', '50,000']);
  });

  it('formats decimals', () => {
    const vals = numAxisVals([0.1, 0.5, 1.0]);
    expect(vals).toHaveLength(3);
    expect(vals[0]).toContain('0');
    expect(vals[1]).toContain('5');
  });
});

// ---- logAxisSplits ----
describe('logAxisSplits', () => {
  it('generates splits for base 10', () => {
    const splits = logAxisSplits(1, 1000, 10);
    expect(splits).toContain(1);
    expect(splits).toContain(10);
    expect(splits).toContain(100);
    expect(splits).toContain(1000);
    expect(splits.length).toBeGreaterThan(4); // includes intermediate values
  });

  it('generates splits for base 2', () => {
    const splits = logAxisSplits(1, 16, 2);
    expect(splits).toContain(1);
    expect(splits).toContain(2);
    expect(splits).toContain(4);
    expect(splits).toContain(8);
    expect(splits).toContain(16);
  });

  it('returns empty for invalid range', () => {
    expect(logAxisSplits(0, 100, 10)).toEqual([]);
    expect(logAxisSplits(-1, 100, 10)).toEqual([]);
    expect(logAxisSplits(100, 10, 10)).toEqual([]);
    expect(logAxisSplits(10, 10, 10)).toEqual([]);
  });

  it('all splits are within range', () => {
    const splits = logAxisSplits(5, 500, 10);
    for (const s of splits) {
      expect(s).toBeGreaterThanOrEqual(5);
      expect(s).toBeLessThanOrEqual(500);
    }
  });
});

// ---- getIncrSpace ----
describe('getIncrSpace', () => {
  it('returns [0, 0] for zero dimension', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Left };
    expect(getIncrSpace(cfg, 0, 100, 0)).toEqual([0, 0]);
  });

  it('vertical axis uses 30px spacing', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right };
    const [incr, space] = getIncrSpace(cfg, 0, 100, 300);
    expect(incr).toBeGreaterThan(0);
    expect(space).toBeGreaterThanOrEqual(30);
  });

  it('horizontal axis estimates space from labels', () => {
    const cfg: AxisConfig = { scale: 'x', side: Side.Bottom };
    const [incr, space] = getIncrSpace(cfg, 0, 100, 500);
    expect(incr).toBeGreaterThan(0);
    expect(space).toBeGreaterThanOrEqual(50);
  });

  it('respects custom space', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right, space: 60 };
    const [_incr, space] = getIncrSpace(cfg, 0, 100, 300);
    expect(space).toBeGreaterThanOrEqual(60);
  });
});

// ---- computeAxisSize ----
describe('computeAxisSize', () => {
  it('returns fixed size when specified', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right, size: 80 };
    expect(computeAxisSize(cfg, ['1', '2'], 1)).toBe(80);
  });

  it('vertical axis adapts to label width', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right };
    const narrow = computeAxisSize(cfg, ['1', '2', '3'], 1);
    const wide = computeAxisSize(cfg, ['1,000,000', '2,000,000'], 1);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('minimum size is 50', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right };
    expect(computeAxisSize(cfg, ['1'], 1)).toBeGreaterThanOrEqual(50);
  });

  it('horizontal axis returns consistent height', () => {
    const cfg: AxisConfig = { scale: 'x', side: Side.Bottom };
    const size = computeAxisSize(cfg, ['any', 'labels'], 1);
    expect(size).toBeGreaterThanOrEqual(50);
  });

  it('accounts for hidden ticks', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right, ticks: { show: false } };
    const withTicks: AxisConfig = { scale: 'y', side: Side.Right, ticks: { show: true, size: 10 } };
    const sizeNoTicks = computeAxisSize(cfg, ['100'], 1);
    const sizeWithTicks = computeAxisSize(withTicks, ['100'], 1);
    expect(sizeWithTicks).toBeGreaterThanOrEqual(sizeNoTicks);
  });
});

// ---- createAxisState ----
describe('createAxisState', () => {
  it('creates state with defaults', () => {
    const cfg: AxisConfig = { scale: 'y', side: Side.Right };
    const state = createAxisState(cfg);
    expect(state.config).toBe(cfg);
    expect(state._show).toBe(true);
    expect(state._size).toBe(50);
    expect(state._splits).toBeNull();
    expect(state._values).toBeNull();
  });

  it('hidden axis', () => {
    const state = createAxisState({ scale: 'y', side: Side.Right, show: false });
    expect(state._show).toBe(false);
  });
});
