import { useRef } from 'react';
import type { SeriesConfig, ResolvedSeriesConfig } from '../types';
import { useRegisterConfig } from '../hooks/useRegisterConfig';
import type { ChartStore } from '../hooks/useChartStore';
import { withAlpha } from '../colors';
import { THEME_DEFAULTS } from '../rendering/theme';

/**
 * Series component props.
 *
 * `group` and `index` are optional — bare `<Series />` (both omitted) auto-bumps
 * to the next unclaimed (group, index) slot in data order. Specify either to
 * pin a slot. `_internal` is a renderer-internal escape hatch used by
 * specialized components (Candlestick, BoxWhisker) to mark helper series.
 */
export type SeriesProps = Omit<SeriesConfig, 'yScale' | 'group' | 'index'> & {
  group?: number;
  index?: number;
  yScale?: string;
  _internal?: boolean;
};

/** Resolved (group, index) slot — kept stable across renders via a ref. */
interface SeriesSlot { group: number; index: number; }

/**
 * Pick the (group, index) this Series should occupy:
 *  - both explicit → use as-is.
 *  - both omitted → next unclaimed data slot in (group, index) order.
 *  - one provided → default the missing dimension to 0.
 *
 * "Unclaimed" means no non-fill config currently sits at the slot. Fill configs
 * are clearable defaults, so an explicit Series can always displace one.
 */
function resolveSlot(store: ChartStore, p: SeriesProps): SeriesSlot {
  if (p.group != null && p.index != null) return { group: p.group, index: p.index };
  if (p.group == null && p.index == null) return findNextUnclaimedSlot(store);
  return { group: p.group ?? 0, index: p.index ?? 0 };
}

function findNextUnclaimedSlot(store: ChartStore): SeriesSlot {
  const data = store.dataStore.data;
  // Walk the data shape first so bare <Series /> after data is set lands on
  // a real data slot.
  for (let g = 0; g < data.length; g++) {
    const grp = data[g];
    if (grp == null) continue;
    for (let i = 0; i < grp.series.length; i++) {
      const claimed = store.seriesConfigs.some(
        s => s.group === g && s.index === i && s._source !== 'fill',
      );
      if (!claimed) return { group: g, index: i };
    }
  }
  // Either data isn't loaded yet (children's layout effects fire before the
  // parent's data effect on first mount) or every data slot is already
  // claimed. Keep counting up indices in group 0 so siblings still get
  // distinct slots; the next setData() reshape will let fillSeries sort out
  // any over-counted slots.
  let i = 0;
  while (store.seriesConfigs.some(s => s.group === 0 && s.index === i && s._source !== 'fill')) i++;
  return { group: 0, index: i };
}

/** Apply defaults for yScale, show, stroke, and auto-fill colors. */
function resolveDefaults(
  p: SeriesProps,
  slot: SeriesSlot,
  colorIndex: number,
  palette?: string[],
): ResolvedSeriesConfig {
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
    group: slot.group,
    index: slot.index,
    yScale: p.yScale ?? 'y',
    show: p.show ?? true,
    stroke,
    fill,
    _autoStroke: autoStroke,
    _autoFill: autoFill,
    _source: p._internal === true ? 'internal' : undefined,
  };
}

/**
 * Renderless component that registers a series config with the chart store.
 * Must be a child of <Chart>.
 */
export function Series(props: SeriesProps): null {
  // Stable across renders. Holds the slot picked at register time so that
  // unregister/sync target the same (group, index) — important for bare
  // <Series /> where the slot was auto-resolved.
  const slotRef = useRef<SeriesSlot | null>(null);

  useRegisterConfig(
    props,
    [props.group, props.index],
    (store, p) => {
      const slot = resolveSlot(store, p);
      slotRef.current = slot;
      store.registerSeries(resolveDefaults(p, slot, store.seriesConfigs.length, store.theme.seriesColors));
    },
    (store) => {
      const slot = slotRef.current;
      if (slot == null) return;
      store.unregisterSeries(slot.group, slot.index);
      slotRef.current = null;
    },
    (store, p) => {
      const slot = slotRef.current;
      if (slot == null) return;
      const idx = store.seriesConfigs.findIndex(s => s.group === slot.group && s.index === slot.index);
      store.updateSeries(resolveDefaults(p, slot, idx >= 0 ? idx : store.seriesConfigs.length, store.theme.seriesColors));
    },
  );
  return null;
}
