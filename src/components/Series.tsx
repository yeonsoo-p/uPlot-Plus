import type { SeriesConfig, ResolvedSeriesConfig } from '../types';
import { useRegisterConfig } from '../hooks/useRegisterConfig';
import { withAlpha } from '../colors';
import { THEME_DEFAULTS } from '../rendering/theme';

/** Series component props — yScale defaults to 'y' if omitted. */
export type SeriesProps = Omit<SeriesConfig, 'yScale'> & { yScale?: string };

/** Apply defaults for yScale, show, stroke, and auto-fill. */
function resolveDefaults(p: SeriesProps, colorIndex: number, palette?: string[]): ResolvedSeriesConfig {
  const pathDefaults = p.paths?.defaults;
  const colors = palette ?? THEME_DEFAULTS.seriesColors;
  const autoStroke = p.stroke == null;
  const stroke = p.stroke ?? colors[colorIndex % colors.length] ?? '#000';

  const rawFill = p.fill ?? pathDefaults?.fill;
  const autoFill = rawFill === 'auto' && typeof stroke === 'string';
  const fill = autoFill
    ? withAlpha(stroke, 0.5)
    : rawFill === 'auto' ? undefined : rawFill;

  return {
    ...pathDefaults,
    ...p,
    yScale: p.yScale ?? 'y',
    show: p.show ?? true,
    stroke,
    fill,
    _autoStroke: autoStroke,
    _autoFill: autoFill,
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
    (store, p) => store.registerSeries(resolveDefaults(p, store.seriesConfigs.length, store.theme.seriesColors)),
    (store, p) => store.unregisterSeries(p.group, p.index),
    (store, p) => {
      const idx = store.seriesConfigs.findIndex(s => s.group === p.group && s.index === p.index);
      store.updateSeries(resolveDefaults(p, idx >= 0 ? idx : store.seriesConfigs.length, store.theme.seriesColors));
    },
  );
  return null;
}
