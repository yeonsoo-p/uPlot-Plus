import { describe, it, expect } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { renderChart, flushEffects, twoSeriesData } from '../helpers/rtl';
import { Series } from '@/components/Series';
import { FloatingLegend } from '@/components/FloatingLegend';
import { rebuildSnapshot } from '@/hooks/useChartStore';
import type { ChartStore } from '@/hooks/useChartStore';

function simulateCursor(store: ChartStore, dataIdx: number) {
  store.cursorManager.state.left = 100;
  store.cursorManager.state.top = 100;
  store.cursorManager.state.activeGroup = 0;
  store.cursorManager.state.activeSeriesIdx = 0;
  store.cursorManager.state.activeDataIdx = dataIdx;
  rebuildSnapshot(store);
  for (const fn of store.cursorListeners) fn();
}

describe('FloatingLegend component', () => {
  describe('cursor mode', () => {
    it('renders nothing when cursor is inactive', async () => {
      const { container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <FloatingLegend mode="cursor" />
        </>,
      );
      await flushEffects();

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend).toBeNull();
    });

    it('renders panel with series rows when cursor is active', async () => {
      const { store, container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <Series group={0} index={1} label="Humidity" stroke="blue" />
          <FloatingLegend mode="cursor" />
        </>,
      );
      await flushEffects();

      act(() => { simulateCursor(store, 2); });

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend).toBeInTheDocument();
      expect(legend?.textContent).toContain('Temp');
      expect(legend?.textContent).toContain('Humidity');
    });

    it('hides when show=false even with active cursor', async () => {
      const { store, container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <FloatingLegend mode="cursor" show={false} />
        </>,
      );
      await flushEffects();

      act(() => { simulateCursor(store, 2); });

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend).toBeNull();
    });
  });

  describe('draggable mode', () => {
    it('renders panel at initial position without cursor activity', async () => {
      const { container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <FloatingLegend mode="draggable" />
        </>,
      );
      await flushEffects();

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend).toBeInTheDocument();
    });

    it('shows all series labels', async () => {
      const { container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <Series group={0} index={1} label="Humidity" stroke="blue" />
          <FloatingLegend mode="draggable" />
        </>,
      );
      await flushEffects();

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend?.textContent).toContain('Temp');
      expect(legend?.textContent).toContain('Humidity');
    });

    it('click toggles series visibility', async () => {
      const { store, getByText } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <FloatingLegend mode="draggable" />
        </>,
      );
      await flushEffects();

      expect(store.seriesConfigs[0]?.show).not.toBe(false);

      fireEvent.click(getByText('Temp'));
      await flushEffects();

      expect(store.seriesConfigs[0]?.show).toBe(false);
    });
  });

  describe('shared', () => {
    it('applies custom className', async () => {
      const { container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Temp" stroke="red" />
          <FloatingLegend mode="draggable" className="my-legend" />
        </>,
      );
      await flushEffects();

      expect(container.querySelector('.my-legend')).toBeInTheDocument();
    });

    it('excludes series with legend=false', async () => {
      const { container } = renderChart(
        { data: twoSeriesData },
        <>
          <Series group={0} index={0} label="Visible" stroke="red" />
          <Series group={0} index={1} label="Hidden" stroke="blue" legend={false} />
          <FloatingLegend mode="draggable" />
        </>,
      );
      await flushEffects();

      const legend = container.querySelector('[data-testid="floating-legend"]');
      expect(legend?.textContent).toContain('Visible');
      expect(legend?.textContent).not.toContain('Hidden');
    });
  });
});
