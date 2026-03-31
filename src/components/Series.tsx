import type { SeriesConfig } from '../types';
import { useRegisterConfig } from '../hooks/useRegisterConfig';
import { withAlpha } from '../colors';

/** Series component props — yScale defaults to 'y' if omitted. */
export type SeriesProps = Omit<SeriesConfig, 'yScale'> & { yScale?: string };

/** Curated default colors for auto-assignment to series without explicit stroke. */
const DEFAULT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
  '#2980b9', '#27ae60', '#f1c40f', '#8e44ad', '#d35400',
];

/** Apply defaults for yScale, show, stroke, and auto-fill. */
function resolveDefaults(p: SeriesProps, colorIndex: number): SeriesConfig {
  const pathDefaults = p.paths?.defaults;
  const stroke = p.stroke ?? DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length] ?? '#000';

  const rawFill = p.fill ?? pathDefaults?.fill;
  const fill = rawFill === 'auto' && typeof stroke === 'string'
    ? withAlpha(stroke, 0.5)
    : rawFill === 'auto' ? undefined : rawFill;

  return {
    ...pathDefaults,
    ...p,
    yScale: p.yScale ?? 'y',
    show: p.show ?? true,
    stroke,
    fill,
  };
}

/**
 * Renderless component that registers a series config with the chart store.
 * Must be a child of <Chart>.
 */
export function Series(props: SeriesProps): null {
  useRegisterConfig(
    props,
    [props.group, props.index],
    (store, p) => store.registerSeries(resolveDefaults(p, store.seriesConfigs.length)),
    (store, p) => store.unregisterSeries(p.group, p.index),
    (store, p) => {
      const idx = store.seriesConfigs.findIndex(s => s.group === p.group && s.index === p.index);
      store.updateSeries(resolveDefaults(p, idx >= 0 ? idx : store.seriesConfigs.length));
    },
  );
  return null;
}
