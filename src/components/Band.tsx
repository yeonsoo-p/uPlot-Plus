import { useEffect } from 'react';
import type { BandConfig } from '../types/bands';
import { useChart } from '../hooks/useChart';

/**
 * Renderless component that registers a band config with the chart store.
 * A band fills the area between two series.
 */
export function Band({ series, group, fill, dir }: BandConfig): null {
  const store = useChart();

  useEffect(() => {
    const cfg: BandConfig = { series, group, fill, dir };
    store.bandConfigs.push(cfg);
    store.scheduleRedraw();

    return () => {
      store.bandConfigs = store.bandConfigs.filter(b => b !== cfg);
      store.scheduleRedraw();
    };
  }, [store, series, group, fill, dir]);

  return null;
}
