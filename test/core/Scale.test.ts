import { describe, it, expect } from 'vitest';
import {
  createScaleState,
  invalidateScaleCache,
  valToPct,
  pctToVal,
  valToPos,
  posToVal,
  scaleAxis,
  valToPx,
  projectPoint,
} from '@/core/Scale';
import type { ScaleState } from '@/types';
import { Distribution, Orientation, Direction } from '@/types';

function makeLinearScale(min: number, max: number, opts?: Partial<ScaleState>): ScaleState {
  return { ...createScaleState({ id: 'test' }), min, max, ...opts };
}

// ---- createScaleState ----
describe('createScaleState', () => {
  it('applies defaults', () => {
    const s = createScaleState({ id: 'x' });
    expect(s.id).toBe('x');
    expect(s.distr).toBe(Distribution.Linear);
    expect(s.log).toBe(10);
    expect(s.ori).toBe(Orientation.Horizontal);
    expect(s.dir).toBe(Direction.Forward);
    expect(s.auto).toBe(true);
    expect(s.time).toBe(false);
    expect(s.min).toBeNull();
    expect(s.max).toBeNull();
    expect(s._min).toBeNull();
    expect(s._max).toBeNull();
  });

  it('respects provided values', () => {
    const s = createScaleState({ id: 'y', distr: Distribution.Log, log: 2, min: 1, max: 100 });
    expect(s.distr).toBe(Distribution.Log);
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
  describe('linear (distr=Linear)', () => {
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

  describe('log base 10 (distr=Log)', () => {
    const scale = makeLinearScale(1, 1000, { distr: Distribution.Log, log: 10 });

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

  describe('log base 2 (distr=Log)', () => {
    const scale = makeLinearScale(1, 16, { distr: Distribution.Log, log: 2 });

    it('round-trips', () => {
      for (const v of [1, 2, 4, 8, 16]) {
        expect(pctToVal(valToPct(v, scale), scale)).toBeCloseTo(v, 0);
      }
    });
  });

  describe('asinh (distr=Asinh)', () => {
    const scale = makeLinearScale(-100, 100, { distr: Distribution.Asinh, asinh: 1 });

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
  describe('horizontal, dir=Forward', () => {
    const scale = makeLinearScale(0, 100, { ori: Orientation.Horizontal, dir: Direction.Forward });

    it('maps min to offset, max to offset+dim', () => {
      expect(valToPos(0, scale, 500, 10)).toBeCloseTo(10);
      expect(valToPos(100, scale, 500, 10)).toBeCloseTo(510);
    });

    it('round-trips', () => {
      const pos = valToPos(50, scale, 500, 10);
      expect(posToVal(pos, scale, 500, 10)).toBeCloseTo(50);
    });
  });

  describe('horizontal, dir=Backward (reversed)', () => {
    const scale = makeLinearScale(0, 100, { ori: Orientation.Horizontal, dir: Direction.Backward });

    it('min maps to right, max maps to left', () => {
      expect(valToPos(0, scale, 500, 10)).toBeCloseTo(510);
      expect(valToPos(100, scale, 500, 10)).toBeCloseTo(10);
    });

    it('round-trips', () => {
      const pos = valToPos(30, scale, 500, 10);
      expect(posToVal(pos, scale, 500, 10)).toBeCloseTo(30);
    });
  });

  describe('vertical, dir=Forward (bottom-to-top)', () => {
    const scale = makeLinearScale(0, 100, { ori: Orientation.Vertical, dir: Direction.Forward });

    it('min maps to bottom (offset+dim), max maps to top (offset)', () => {
      expect(valToPos(0, scale, 400, 20)).toBeCloseTo(420);
      expect(valToPos(100, scale, 400, 20)).toBeCloseTo(20);
    });

    it('round-trips', () => {
      const pos = valToPos(75, scale, 400, 20);
      expect(posToVal(pos, scale, 400, 20)).toBeCloseTo(75);
    });
  });

  describe('vertical, dir=Backward (top-to-bottom)', () => {
    const scale = makeLinearScale(0, 100, { ori: Orientation.Vertical, dir: Direction.Backward });

    it('round-trips', () => {
      const pos = valToPos(60, scale, 400, 20);
      expect(posToVal(pos, scale, 400, 20)).toBeCloseTo(60);
    });
  });
});

// ---- orientation-aware helpers ----
describe('scaleAxis', () => {
  const box = { left: 10, top: 20, width: 400, height: 300 };

  it('returns plot-box width/left for horizontal scales', () => {
    const s = makeLinearScale(0, 100, { ori: Orientation.Horizontal });
    expect(scaleAxis(s, box)).toEqual({ dim: 400, off: 10 });
  });

  it('returns plot-box height/top for vertical scales', () => {
    const s = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    expect(scaleAxis(s, box)).toEqual({ dim: 300, off: 20 });
  });
});

describe('valToPx', () => {
  const box = { left: 10, top: 20, width: 400, height: 300 };

  it('maps horizontal scale values to X positions', () => {
    const s = makeLinearScale(0, 100, { ori: Orientation.Horizontal });
    expect(valToPx(50, s, box)).toBeCloseTo(10 + 200); // half of width + left
  });

  it('maps vertical scale values to inverted Y positions (canvas Y grows down)', () => {
    const s = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    expect(valToPx(50, s, box)).toBeCloseTo(20 + 150); // half of height + top (value 50/100, inverted)
  });

  it('matches valToPos with the scale-derived dim/off', () => {
    const s = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    const { dim, off } = scaleAxis(s, box);
    expect(valToPx(75, s, box)).toBeCloseTo(valToPos(75, s, dim, off));
  });
});

describe('projectPoint', () => {
  const box = { left: 10, top: 20, width: 400, height: 300 };

  it('default (x=Horizontal, y=Vertical) returns (xPx, yPx) untouched', () => {
    const xs = makeLinearScale(0, 100, { ori: Orientation.Horizontal });
    const ys = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    const p = projectPoint(xs, ys, 50, 50, box);
    expect(p.px).toBeCloseTo(10 + 200);
    expect(p.py).toBeCloseTo(20 + 150);
  });

  it('transposed (x=Vertical, y=Horizontal) swaps axes so xVal lands on screen Y', () => {
    const xs = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    const ys = makeLinearScale(0, 100, { ori: Orientation.Horizontal });
    const p = projectPoint(xs, ys, 50, 50, box);
    // xVal=50 should project onto the vertical axis, yVal=50 onto the horizontal axis
    expect(p.px).toBeCloseTo(10 + 200); // yVal along width
    expect(p.py).toBeCloseTo(20 + 150); // xVal along height (inverted)
  });

  it('transposed extremes stay within the plot box', () => {
    const xs = makeLinearScale(0, 100, { ori: Orientation.Vertical });
    const ys = makeLinearScale(0, 100, { ori: Orientation.Horizontal });
    const pMin = projectPoint(xs, ys, 0, 0, box);
    const pMax = projectPoint(xs, ys, 100, 100, box);
    expect(pMin.px).toBeCloseTo(10);
    expect(pMin.py).toBeCloseTo(20 + 300); // xVal=0 at bottom (vertical inverted)
    expect(pMax.px).toBeCloseTo(10 + 400);
    expect(pMax.py).toBeCloseTo(20);
  });
});
