import { describe, it, expect } from 'vitest';
import { shouldShowPoints } from '@/rendering/drawPoints';

describe('shouldShowPoints', () => {
  it('returns true when show is true', () => {
    expect(shouldShowPoints(true, 0, 0, 0, 10, 500, 10)).toBe(true);
  });

  it('returns false when show is false', () => {
    expect(shouldShowPoints(false, 0, 0, 0, 10, 500, 10)).toBe(false);
  });

  it('calls function when show is function', () => {
    const fn = (_g: number, _i: number, i0: number, i1: number, _dim: number) => i1 - i0 < 5;
    expect(shouldShowPoints(fn, 0, 0, 0, 3, 500, 10)).toBe(true);
    expect(shouldShowPoints(fn, 0, 0, 0, 10, 500, 10)).toBe(false);
  });

  describe('auto mode (show=undefined)', () => {
    it('shows points when data is sparse (few points relative to plot width)', () => {
      // 5 points across 500px → 100px per point, well above any reasonable threshold
      expect(shouldShowPoints(undefined, 0, 0, 0, 5, 500, 10)).toBe(true);
    });

    it('hides points when data is dense (many points relative to plot width)', () => {
      // 200 points across 500px → 2.5px per point, too dense for individual points
      expect(shouldShowPoints(undefined, 0, 0, 0, 200, 500, 10)).toBe(false);
    });

    it('hides when nVisible is 0', () => {
      expect(shouldShowPoints(undefined, 0, 0, 5, 5, 500, 10)).toBe(false);
    });

    it('transition: shows when just below density threshold, hides just above', () => {
      // The threshold is plotDim / ptSpace. With dim=500, ptSpace=10, threshold=50.
      // nVisible=49 (below threshold) → show; nVisible=51 (above) → hide
      expect(shouldShowPoints(undefined, 0, 0, 0, 49, 500, 10)).toBe(true);
      expect(shouldShowPoints(undefined, 0, 0, 0, 51, 500, 10)).toBe(false);
    });

    it('respects ptSpace parameter for threshold', () => {
      // With ptSpace=20, threshold=500/20=25
      // 24 points → show; 26 points → hide
      expect(shouldShowPoints(undefined, 0, 0, 0, 24, 500, 20)).toBe(true);
      expect(shouldShowPoints(undefined, 0, 0, 0, 26, 500, 20)).toBe(false);
    });
  });
});
