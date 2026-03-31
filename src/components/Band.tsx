import { useEffect, useRef } from 'react';
import type { BandConfig } from '../types/bands';
import { useStore } from '../hooks/useChart';

/**
 * Renderless component that registers a band config with the chart store.
 * A band fills the area between two series.
 *
 * Uses a mount/update split: registers once on mount, replaces config immutably on prop changes.
 * Destructures series tuple to primitives for stable dependency comparison.
 */
export function Band({ series, group, fill, dir }: BandConfig): null {
  const store = useStore();
  const cfgRef = useRef<BandConfig | null>(null);

  // Destructure tuple to primitives for stable deps
  const s0 = series[0];
  const s1 = series[1];

  // Single effect: register/update on any prop change, unregister on unmount.
  useEffect(() => {
    const cfg: BandConfig = { series: [s0, s1], group, fill, dir };

    // Remove previous config if re-running due to prop change
    if (cfgRef.current != null) {
      store.unregisterBand(cfgRef.current);
    }

    cfgRef.current = cfg;
    store.registerBand(cfg);
    store.scheduleRedraw();

    return () => {
      if (cfgRef.current != null) {
        store.unregisterBand(cfgRef.current);
      }
      cfgRef.current = null;
      store.scheduleRedraw();
    };
  }, [store, s0, s1, group, fill, dir]);

  return null;
}
