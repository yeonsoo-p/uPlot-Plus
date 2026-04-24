import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ChartStore, ChartSnapshot } from './useChartStore';
import type { SeriesConfig, BBox } from '../types';
import type { ScaleState } from '../types/scales';

export const ChartContext = createContext<ChartStore | null>(null);

/**
 * Host element for plot-area overlays (Tooltip, FloatingLegend, HoverLabel,
 * DraggableLabel). Lives inside the canvas container, so overlays positioned
 * with `plotBox`-relative coordinates land in the correct spot regardless of
 * what siblings (e.g. a top-aligned Legend with `order: -1`) shift the canvas.
 *
 * `null` until Chart mounts the host. Overlays should fall back to inline
 * render in that window.
 */
export const OverlayHostContext = createContext<HTMLElement | null>(null);

/** Internal: access raw mutable store. Not part of the public API. */
export function useStore(): ChartStore {
  const store = useContext(ChartContext);
  if (!store) {
    throw new Error('useChart must be used within a <Chart> component');
  }
  return store;
}

/**
 * Read-only chart API returned by useChart().
 * Provides reactive snapshot fields, read-only accessors, and controlled mutations.
 */
export interface ChartAPI extends ChartSnapshot {
  /** Get a scale's current state by id */
  getScale(id: string): ScaleState | undefined;
  /** Get the plot area bounding box */
  getPlotBox(): Readonly<BBox>;
  /** Get all series configurations (read-only) */
  getSeriesConfigs(): ReadonlyArray<Readonly<SeriesConfig>>;
  /** Get x-values for a data group */
  getDataX(group: number): ArrayLike<number>;
  /** Get y-values for a specific series */
  getDataY(group: number, index: number): ArrayLike<number | null>;
  /** Toggle a series' visibility */
  toggleSeries(group: number, index: number): void;
  /** Set the focused series by (group, index), or pass null to clear. */
  setFocus(group: number | null, index?: number): void;
}

/**
 * Unified hook for accessing chart internals.
 * Returns a read-only facade with reactive snapshot fields.
 *
 * @param channel  `'cursor'` (default) re-renders on cursor moves and full redraws.
 *                 `'full'` re-renders only on full redraws.
 */
export function useChart(channel: 'cursor' | 'full' = 'cursor'): ChartAPI {
  const store = useStore();
  const subscribe = channel === 'full' ? store.subscribe : store.subscribeCursor;
  const snap = useSyncExternalStore(subscribe, store.getSnapshot);

  return {
    // Reactive snapshot fields
    left: snap.left,
    top: snap.top,
    activeGroup: snap.activeGroup,
    activeSeriesIdx: snap.activeSeriesIdx,
    activeDataIdx: snap.activeDataIdx,
    plotLeft: snap.plotLeft,
    plotTop: snap.plotTop,
    plotWidth: snap.plotWidth,
    plotHeight: snap.plotHeight,
    seriesCount: snap.seriesCount,
    revision: snap.revision,

    // Read-only accessors
    getScale: (id) => store.scaleManager.getScale(id),
    getPlotBox: () => store.plotBox,
    getSeriesConfigs: () => store.seriesConfigs,
    getDataX: (group) => store.dataStore.getXValues(group),
    getDataY: (group, index) => store.dataStore.getYValues(group, index),

    // Controlled mutations
    toggleSeries: (g, i) => store.toggleSeries(g, i),
    setFocus: (group, index) => store.setFocus(group, index),
  };
}
