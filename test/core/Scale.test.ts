import { describe, it, expect } from 'vitest';
import {
  createScaleState,
  invalidateScaleCache,
  valToPct,
  pctToVal,
  valToPos,
  posToVal,
} from '@/core/Scale';
import type { ScaleState } from '@/types';

function makeLinearScale(min: number, max: number, opts?: Partial<ScaleState>): ScaleState {
  return { ...createScaleState({ id: 'test' }), min, max, ...opts };
}

// ---- createScaleState ----
describe('createScaleState', () => {
  it('applies defaults', () => {
    const s = createScaleState({ id: 'x' });
    expect(s.id).toBe('x');
    expect(s.distr).toBe(1);
    expect(s.log).toBe(10);
    expect(s.ori).toBe(0);
    expect(s.dir).toBe(1);
    expect(s.auto).toBe(true);
    expect(s.time).toBe(false);
    expect(s.min).toBeNull();
    expect(s.max).toBeNull();
    expect(s._min).toBeNull();
    expect(s._max).toBeNull();
  });

  it('respects provided values', () => {
    const s = createScaleState({ id: 'y', distr: 3, log: 2, min: 1, max: 100 });
    expect(s.distr).toBe(3);
    expect(s.log).toBe(2);
    expect(s.min).toBe(1);
    expect(s.max).toBe(100);
  });
});

// ---- invalidateScaleCache ----
describe('invalidateScaleCache', () => {
  it('clears _min and _max', () => {
    const s = makeLinearScale(0, 10);
    valToPct(5, s); // populate cache
    invalidateScaleCache(s);
    expect(s._min).toBeNull();
    expect(s._max).toBeNull();
  });
});

// ---- valToPct / pctToVal round-trips ----
describe('valToPct / pctToVal', () => {
  describe('linear (distr=1)', () => {
    const scale = makeLinearScale(0, 100);

    it('0 maps to 0, 100 maps to 1', () => {
      expect(valToPct(0, scale)).toBeCloseTo(0);
      expect(valToPct(100, scale)).toBeCloseTo(1);
      expect(valToPct(50, scale)).toBeCloseTo(0.5);
    });

    it('round-trips', () => {
      for (const v of [0, 25, 50, 75, 100]) {
        expect(pctToVal(valToPct(v, scale), scale)).toBeCloseTo(v);
      }
    });
  });

  describe('log base 10 (distr=3)', () => {
    const scale = makeLinearScale(1, 1000, { distr: 3, log: 10 });

    it('round-trips', () => {
      for (const v of [1, 10, 100, 1000]) {
        const pct = valToPct(v, scale);
        expect(pctToVal(pct, scale)).toBeCloseTo(v, 0);
      }
    });

    it('1 maps to 0, 1000 maps to 1', () => {
      expect(valToPct(1, scale)).toBeCloseTo(0);
      expect(valToPct(1000, scale)).toBeCloseTo(1);
    });
  });

  describe('log base 2 (distr=3)', () => {
    const scale = makeLinearScale(1, 16, { distr: 3, log: 2 });

    it('round-trips', () => {
      for (const v of [1, 2, 4, 8, 16]) {
        expect(pctToVal(valToPct(v, scale), scale)).toBeCloseTo(v, 0);
      }
    });
  });

  describe('asinh (distr=4)', () => {
    const scale = makeLinearScale(-100, 100, { distr: 4, asinh: 1 });

    it('round-trips', () => {
      for (const v of [-100, -10, 0, 10, 100]) {
        expect(pctToVal(valToPct(v, scale), scale)).toBeCloseTo(v, 0);
      }
    });
  });

  it('returns 0 when min/max are null', () => {
    const scale = createScaleState({ id: 'x' });
    expect(valToPct(5, scale)).toBe(0);
    expect(pctToVal(0.5, scale)).toBe(0);
  });

  it('returns 0 when range is zero', () => {
    const scale = makeLinearScale(5, 5);
    expect(valToPct(5, scale)).toBe(0);
  });
});

// ---- valToPos / posToVal ----
describe('valToPos / posToVal', () => {
  describe('horizontal, dir=1', () => {
    const scale = makeLinearScale(0, 100, { ori: 0, dir: 1 });

    it('maps min to offset, max to offset+dim', () => {
      expect(valToPos(0, scale, 500, 10)).toBeCloseTo(10);
      expect(valToPos(100, scale, 500, 10)).toBeCloseTo(510);
    });

    it('round-trips', () => {
      const pos = valToPos(50, scale, 500, 10);
      expect(posToVal(pos, scale, 500, 10)).toBeCloseTo(50);
    });
  });

  describe('horizontal, dir=-1 (reversed)', () => {
    const scale = makeLinearScale(0, 100, { ori: 0, dir: -1 });

    it('min maps to right, max maps to left', () => {
      expect(valToPos(0, scale, 500, 10)).toBeCloseTo(510);
      expect(valToPos(100, scale, 500, 10)).toBeCloseTo(10);
    });

    it('round-trips', () => {
      const pos = valToPos(30, scale, 500, 10);
      expect(posToVal(pos, scale, 500, 10)).toBeCloseTo(30);
    });
  });

  describe('vertical, dir=1 (bottom-to-top)', () => {
    const scale = makeLinearScale(0, 100, { ori: 1, dir: 1 });

    it('min maps to bottom (offset+dim), max maps to top (offset)', () => {
      expect(valToPos(0, scale, 400, 20)).toBeCloseTo(420);
      expect(valToPos(100, scale, 400, 20)).toBeCloseTo(20);
    });

    it('round-trips', () => {
      const pos = valToPos(75, scale, 400, 20);
      expect(posToVal(pos, scale, 400, 20)).toBeCloseTo(75);
    });
  });

  describe('vertical, dir=-1 (top-to-bottom)', () => {
    const scale = makeLinearScale(0, 100, { ori: 1, dir: -1 });

    it('round-trips', () => {
      const pos = valToPos(60, scale, 400, 20);
      expect(posToVal(pos, scale, 400, 20)).toBeCloseTo(60);
    });
  });
});
