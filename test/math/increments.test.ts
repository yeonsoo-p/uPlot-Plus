import { describe, it, expect } from 'vitest';
import { decIncrs, oneIncrs, wholeIncrs, numIncrs } from '@/math/increments';

describe('decIncrs', () => {
  it('contains only values < 1', () => {
    for (const v of decIncrs) {
      expect(v).toBeLessThan(1);
      expect(v).toBeGreaterThan(0);
    }
  });

  it('is sorted ascending', () => {
    for (let i = 1; i < decIncrs.length; i++) {
      expect(decIncrs[i]!).toBeGreaterThan(decIncrs[i - 1]!);
    }
  });
});

describe('oneIncrs', () => {
  it('starts at 1', () => {
    expect(oneIncrs[0]).toBe(1);
  });

  it('is sorted ascending', () => {
    for (let i = 1; i < oneIncrs.length; i++) {
      expect(oneIncrs[i]!).toBeGreaterThan(oneIncrs[i - 1]!);
    }
  });

  it('contains expected values', () => {
    expect(oneIncrs).toContain(1);
    expect(oneIncrs).toContain(2);
    expect(oneIncrs).toContain(5);
    expect(oneIncrs).toContain(10);
    expect(oneIncrs).toContain(100);
  });
});

describe('wholeIncrs', () => {
  it('contains only integers', () => {
    for (const v of wholeIncrs) {
      expect(v % 1).toBe(0);
    }
  });

  it('does not contain 2.5', () => {
    expect(wholeIncrs).not.toContain(2.5);
  });
});

describe('numIncrs', () => {
  it('is combination of dec and one', () => {
    expect(numIncrs.length).toBe(decIncrs.length + oneIncrs.length);
  });

  it('transitions from <1 to >=1', () => {
    expect(numIncrs[decIncrs.length - 1]!).toBeLessThan(1);
    expect(numIncrs[decIncrs.length]!).toBeGreaterThanOrEqual(1);
  });
});
