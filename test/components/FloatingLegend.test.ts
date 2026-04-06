import { describe, it, expect } from 'vitest';
import { resolveInitialPos, CORNER_PAD } from '@/components/FloatingLegend';
import { formatSeriesValue } from '@/components/overlay/SeriesPanel';
import { estimatePanelSize } from '@/utils/estimatePanelSize';

const plotBox = { left: 50, top: 20, width: 700, height: 560 };

describe('resolveInitialPos', () => {
  const panelW = 120;
  const panelH = 80;

  it('returns exact coordinates for object position', () => {
    const pos = resolveInitialPos({ x: 100, y: 200 }, plotBox, panelW, panelH);
    expect(pos).toEqual({ x: 100, y: 200 });
  });

  it('places top-left inside the plot with padding', () => {
    const pos = resolveInitialPos('top-left', plotBox, panelW, panelH);
    expect(pos).toEqual({
      x: plotBox.left + CORNER_PAD,
      y: plotBox.top + CORNER_PAD,
    });
  });

  it('places top-right accounting for panel width', () => {
    const pos = resolveInitialPos('top-right', plotBox, panelW, panelH);
    expect(pos).toEqual({
      x: plotBox.left + plotBox.width - panelW - CORNER_PAD,
      y: plotBox.top + CORNER_PAD,
    });
  });

  it('places bottom-left accounting for panel height', () => {
    const pos = resolveInitialPos('bottom-left', plotBox, panelW, panelH);
    expect(pos).toEqual({
      x: plotBox.left + CORNER_PAD,
      y: plotBox.top + plotBox.height - panelH - CORNER_PAD,
    });
  });

  it('places bottom-right accounting for both dimensions', () => {
    const pos = resolveInitialPos('bottom-right', plotBox, panelW, panelH);
    expect(pos).toEqual({
      x: plotBox.left + plotBox.width - panelW - CORNER_PAD,
      y: plotBox.top + plotBox.height - panelH - CORNER_PAD,
    });
  });

  it('defaults to top-right for undefined position', () => {
    const pos = resolveInitialPos(undefined, plotBox, panelW, panelH);
    const topRight = resolveInitialPos('top-right', plotBox, panelW, panelH);
    expect(pos).toEqual(topRight);
  });

  it('handles zero panel dimensions (first render before measurement)', () => {
    const pos = resolveInitialPos('bottom-right', plotBox, 0, 0);
    expect(pos).toEqual({
      x: plotBox.left + plotBox.width - CORNER_PAD,
      y: plotBox.top + plotBox.height - CORNER_PAD,
    });
  });
});

describe('formatSeriesValue', () => {
  const mockStore = {
    dataStore: {
      getYValues: (_g: number, _i: number): ArrayLike<number | null> => [10, 40.123, null, 70, 90],
    },
  };

  it('returns toPrecision(4) for a valid active data point', () => {
    expect(formatSeriesValue(mockStore, 0, 0, 0, 1)).toBe('40.12');
  });

  it('returns empty string for null values', () => {
    expect(formatSeriesValue(mockStore, 0, 0, 0, 2)).toBe('');
  });

  it('returns empty string when activeDataIdx is -1', () => {
    expect(formatSeriesValue(mockStore, 0, 0, 0, -1)).toBe('');
  });

  it('returns empty string when activeGroup is -1', () => {
    expect(formatSeriesValue(mockStore, 0, 0, -1, 0)).toBe('');
  });

  it('returns empty string when series group does not match activeGroup', () => {
    expect(formatSeriesValue(mockStore, 1, 0, 0, 1)).toBe('');
    expect(formatSeriesValue(mockStore, 2, 0, 0, 0)).toBe('');
  });

  it('returns value when series group matches activeGroup', () => {
    expect(formatSeriesValue(mockStore, 0, 0, 0, 0)).toBe('10.00');
    expect(formatSeriesValue(mockStore, 0, 0, 0, 1)).toBe('40.12');
  });
});

describe('estimatePanelSize', () => {
  it('returns positive dimensions for rows with labels and values', () => {
    const size = estimatePanelSize({
      rows: [
        { label: 'Series 0', value: '42.00' },
        { label: 'Series 1', value: '100.0' },
      ],
    });
    expect(size.w).toBeGreaterThan(0);
    expect(size.h).toBeGreaterThan(0);
  });

  it('adds header height when header is provided', () => {
    const withoutHeader = estimatePanelSize({ rows: [{ label: 'A', value: '1' }] });
    const withHeader = estimatePanelSize({ header: 'X Label', rows: [{ label: 'A', value: '1' }] });
    expect(withHeader.h).toBeGreaterThan(withoutHeader.h);
  });

  it('grows height with more rows', () => {
    const oneRow = estimatePanelSize({ rows: [{ label: 'A' }] });
    const twoRows = estimatePanelSize({ rows: [{ label: 'A' }, { label: 'B' }] });
    expect(twoRows.h).toBeGreaterThan(oneRow.h);
  });
});
