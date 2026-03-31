# uPlot+

High-performance React charting library rewriting uPlot from scratch in TypeScript. Canvas 2D rendering, native React components, multi-x-axis support.

## Project Layout

Library code lives at the project root. The `uPlot/` and `uplot-wrappers/` directories are reference-only copies of the original library and its framework wrappers — do not modify them.

```
./
├── src/
│   ├── components/    Chart, Series, Scale, Axis, Band, Legend, Tooltip, FloatingLegend, HoverLabel,
│   │                  ZoomRanger, Timeline, Sparkline, BoxWhisker, Candlestick, Heatmap, Vector,
│   │                  annotations/{HLine,VLine,Region,AnnotationLabel}
│   ├── core/          DataStore, ScaleManager, CursorManager, RenderScheduler, Scale, BlockMinMax, normalizeData
│   ├── rendering/     CanvasRenderer, drawSeries, drawAxes, drawCursor, drawSelect, drawBands, drawPoints
│   ├── hooks/         useChart, useDrawHook, useCursorDrawHook (public); useInteraction, useChartStore, useRegisterConfig (internal)
│   ├── math/          utils, increments, stack, align, lttb
│   ├── axes/          ticks, layout
│   ├── paths/         lttbLinear (default), linear, stepped, bars, monotoneCubic, catmullRom, points
│   ├── sync/          SyncGroup, useSyncGroup
│   ├── utils/         shallowEqual
│   ├── types/         all type definitions (common, scales, axes, hooks, bands, etc.)
│   ├── time/          timeIncrs, timeSplits, timeVals, fmtDate
│   ├── annotations.ts Annotation drawing helpers (drawHLine, drawVLine, drawLabel, drawRegion)
│   ├── formatters.ts  Axis value formatters (fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, etc.)
│   ├── colors.ts      Color utilities (fadeGradient, withAlpha, palette)
│   └── index.ts       public API exports
├── test/              Vitest test suite
├── demo/              demo app (vite dev server, 101 examples)
└── dist/              build output (gitignored)
```

## Commands

All commands run from the project root:

```sh
npm run dev         # Start demo dev server
npm run build       # Build library (ES + CJS to dist/)
npm run typecheck   # TypeScript strict check (tsc --noEmit)
npm run lint        # ESLint with strict TS rules
npm run test        # Vitest
```

## Code Conventions

- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`
- **No `any`**: ESLint enforces `@typescript-eslint/no-explicit-any`
- **Type-only imports**: use `import type { ... }` for types
- **Path alias**: `@/*` maps to `src/*`
- **No non-null assertions**: use proper narrowing instead

## Features

- **20 components**: Chart, Scale, Series, Axis, Band, Legend, Tooltip, FloatingLegend, HoverLabel, ZoomRanger, Timeline, Sparkline, BoxWhisker, Candlestick, Heatmap, Vector, HLine, VLine, Region, AnnotationLabel
- **8 exported path builders**: linear (pixel decimation), stepped, bars, groupedBars, stackedBars, monotoneCubic, catmullRom, points. Internal default is lttbLinear (LTTB downsampling + pixel decimation), applied by CanvasRenderer when no `paths` prop is set.
- **Default injection**: Chart auto-creates missing x/y scales, axes, and series colors — minimal config: just `<Chart data={data}><Series group={0} index={0} /></Chart>`
- **Annotations**: declarative `<HLine>`, `<VLine>`, `<Region>`, `<AnnotationLabel>` components; also imperative drawHLine/drawVLine/drawLabel/drawRegion
- **Axis formatters**: fmtCompact (K/M/B), fmtSuffix (°C, %), fmtPrefix ($), fmtWrap (prefix+suffix), fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels
- **Color utilities**: fadeGradient, withAlpha, palette
- **Time formatting**: Intl.DateTimeFormat-based formatters, 26 standard time increments, round-boundary tick alignment
- **Cursor sync**: multiple charts share cursor state via `syncKey`
- **Action map**: `Map<ActionKey, ReactionValue>` maps gestures to reactions. Built-in strings for drag/click/dblclick/wheel/gutter/hover/touch + built-in reactions (zoomX/Y/XY, panX/Y/XY, reset, none). Users pass `actions` prop as `[action, reaction]` tuples — merged with defaults internally. Both sides support custom functions. `focus(alpha)` factory for hover-to-focus.
- **Data utilities**: stackGroup (stacked areas/bars), alignData (multi-x-axis alignment), lttb/lttbGroup (LTTB downsampling)
- **Hooks**: useChart (store access + snapshot), useDrawHook (persistent canvas layer), useCursorDrawHook (cursor overlay layer)
- **Scale types**: linear, ordinal, log (any base), asinh

## Architecture

- **Data model**: `ChartData = XGroup[]` — each group has its own x-values and y-series arrays. Series are referenced by `(group, index)` tuple.
- **Mutable ChartStore**: canvas operations are imperative, not driven by React re-renders. Two subscriber sets: `listeners` (full redraws) and `cursorListeners` (cursor-only redraws for Legend/Tooltip/FloatingLegend).
- **RenderScheduler**: dirty-flag batching for efficient canvas redraws. Single `requestAnimationFrame` per frame — multiple `mark()` calls coalesce flags without extra rAF scheduling.
- **Path cache**: Two-level LRU cache (group → index → window → SeriesPaths). Superset window matching + 10% padding "runway" for smooth panning. Auto-invalidated via scale-stamp fingerprinting when zoom changes scale ranges.
- **Series lookup**: `seriesConfigMap` (`Map<"group:index", SeriesConfig>`) for O(1) lookups in drawCursor, useInteraction, and toggleSeries. Rebuilt on register/unregister/prop changes.
- **Cursor**: snaps to nearest point by pixel distance across all series/groups. `CursorManager` caches grouped series configs (rebuilt only on reference change). Sync across charts via shared cursor state keyed by `syncKey`.
- **Zoom**: linked by default — pixel fraction applied to all x-scales.
- **Default injection**: `injectDefaults()` auto-creates missing x/y scales, axes (with `xlabel`/`ylabel` labels), and maps unmapped data groups to the `x` scale. Series get auto-assigned stroke colors from a 15-color palette. Users can provide any subset of children — only missing pieces are generated.
- **Rendering**: Canvas 2D via `CanvasRenderer`. Axis layout uses a convergence loop (max 3 cycles). Two canvas layers: persistent (data/axes) and cursor overlay.

## Testing

- **Framework**: Vitest with jsdom environment
- **Run**: `npm run test`
- **Mocks**: `test/setup.ts` provides Path2D, Canvas context, and requestAnimationFrame stubs
- **Pattern**: `describe`/`it` blocks with `@/` path aliases; helper factories for scales/data
- **Coverage**: math (utils, increments, stack, align, lttb), core (Scale, ScaleManager, DataStore), axes (ticks, layout, log filter), paths (linear, lttbLinear, stepped, bars, spline, candlestick), annotations, time formatting, integration tests (convergence, auto-ranging, cursor snapping, interactions, resize, mount, focus)
- **Interaction tests**: `setupInteraction()` extracted from `useInteraction` hook for direct DOM event testing without React Testing Library
- **Demos**: 101 interactive examples covering all chart types, interactions, and edge cases

## Reference Code

When porting features, consult the original uPlot source in `uPlot/src/`:
- `uPlot.js` — main implementation (axes calc at ~line 1864, convergeSize at ~line 791)
- `opts.js` — defaults and tick generation (~line 550 for axis opts, ~line 591 for splits/values)
- `utils.js`, `fmtDate.js` — utilities
