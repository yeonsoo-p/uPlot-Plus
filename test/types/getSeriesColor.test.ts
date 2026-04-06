import { describe, it, expect } from 'vitest';
import { getSeriesColor } from '@/types/series';
import type { SeriesConfig, GradientConfig } from '@/types/series';

const gradient: GradientConfig = {
  type: 'linear',
  stops: [[0, '#ff0000'], [1, '#0000ff']],
};

describe('getSeriesColor', () => {
  it('returns string stroke for a plain-color series', () => {
    const cfg: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: '#abc' };
    expect(getSeriesColor(cfg)).toBe('#abc');
  });

  it('extracts first stop color from gradient stroke', () => {
    const cfg: SeriesConfig = { group: 0, index: 0, yScale: 'y', stroke: gradient };
    expect(getSeriesColor(cfg)).toBe('#ff0000');
  });

  it('extracts first stop color from gradient fill when stroke is absent', () => {
    const cfg: SeriesConfig = { group: 0, index: 0, yScale: 'y', fill: gradient };
    expect(getSeriesColor(cfg)).toBe('#ff0000');
  });

  it('falls back to #000 when no color is available', () => {
    const cfg: SeriesConfig = { group: 0, index: 0, yScale: 'y' };
    expect(getSeriesColor(cfg)).toBe('#000');
  });
});
