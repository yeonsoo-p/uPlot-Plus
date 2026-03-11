import { describe, it, expect } from 'vitest';
import { fadeGradient, withAlpha, palette } from '@/colors';

describe('withAlpha', () => {
  it('converts hex6 to rgba', () => {
    expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
  });

  it('converts hex3 to rgba', () => {
    expect(withAlpha('#f00', 0.1)).toBe('rgba(255,0,0,0.1)');
  });

  it('converts rgb() to rgba', () => {
    expect(withAlpha('rgb(66, 133, 244)', 0.3)).toBe('rgba(66,133,244,0.3)');
  });

  it('converts rgba() to new alpha', () => {
    expect(withAlpha('rgba(100,200,50,0.9)', 0.2)).toBe('rgba(100,200,50,0.2)');
  });

  it('returns color unchanged for unsupported formats', () => {
    expect(withAlpha('red', 0.5)).toBe('red');
  });
});

describe('fadeGradient', () => {
  it('creates a linear gradient with default alphas', () => {
    const g = fadeGradient('#3498db');
    expect(g.type).toBe('linear');
    expect(g.stops).toHaveLength(2);
    expect(g.stops[0]?.[0]).toBe(0);
    expect(g.stops[1]?.[0]).toBe(1);
    expect(g.stops[0]?.[1]).toMatch(/rgba\(52,152,219,0\.8\)/);
    expect(g.stops[1]?.[1]).toMatch(/rgba\(52,152,219,0\)/);
  });

  it('uses custom alpha range', () => {
    const g = fadeGradient('#ff0000', 1.0, 0.2);
    expect(g.stops[0]?.[1]).toMatch(/rgba\(255,0,0,1\)/);
    expect(g.stops[1]?.[1]).toMatch(/rgba\(255,0,0,0\.2\)/);
  });

  it('falls back for unsupported color formats', () => {
    const g = fadeGradient('red');
    expect(g.type).toBe('linear');
    expect(g.stops[0]?.[1]).toBe('red');
  });
});

describe('palette', () => {
  it('generates requested number of colors', () => {
    const colors = palette(5);
    expect(colors).toHaveLength(5);
  });

  it('returns exact HSL strings', () => {
    const colors = palette(3);
    expect(colors).toEqual([
      'hsl(0.0,65%,50%)',
      'hsl(137.5,65%,50%)',
      'hsl(275.0,65%,50%)',
    ]);
  });

  it('generates distinct hues', () => {
    const colors = palette(4);
    expect(colors).toEqual([
      'hsl(0.0,65%,50%)',
      'hsl(137.5,65%,50%)',
      'hsl(275.0,65%,50%)',
      'hsl(52.5,65%,50%)',
    ]);
  });

  it('respects custom saturation and lightness', () => {
    const colors = palette(1, 80, 40);
    expect(colors[0]).toBe('hsl(0.0,80%,40%)');
  });
});
