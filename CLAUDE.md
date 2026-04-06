# uPlot+

High-performance React charting library rewriting uPlot from scratch in TypeScript. Canvas 2D rendering, native React components, multi-x-axis support.

## Project Layout

Library code lives at the project root. The `uPlot/` and `uplot-wrappers/` directories are reference-only copies of the original library and its framework wrappers — do not modify them.

```
./
├── src/
│   ├── components/    Chart, Series, Scale, Axis, Band, Legend, Tooltip, FloatingLegend, HoverLabel,
│   │                  ZoomRanger, Timeline, Sparkline, BoxWhisker, Candlestick, Heatmap, Vector,
│   │                  ThemeProvider, annotations/{HLine,VLine,Region,VRegion,DiagonalLine,AnnotationLabel},
│   │                  overlay/SeriesPanel
│   ├── core/          DataStore, ScaleManager, CursorManager, RenderScheduler, Scale, BlockMinMax, normalizeData
│   ├── rendering/     CanvasRenderer, drawSeries, drawAxes, drawCursor, drawSelect, drawBands, drawPoints, drawRangeBox, theme
│   ├── hooks/         useChart, useDrawHook, useCursorDrawHook (public); useInteraction, useChartStore, useDraggableOverlay, useRegisterConfig (internal)
│   ├── math/          utils, increments, stack, align, lttb
│   ├── axes/          ticks, layout
│   ├── paths/         lttbLinear (default), linear, stepped, bars, monotoneCubic, catmullRom, points, spline, types, utils
│   ├── sync/          SyncGroup, useSyncGroup
│   ├── utils/         shallowEqual, estimatePanelSize, textMeasure, at
│   ├── types/         all type definitions (common, scales, axes, hooks, bands, theme, etc.)
│   ├── time/          timeIncrs, timeSplits, timeVals, fmtDate
│   ├── annotations.ts Annotation drawing helpers (drawHLine, drawVLine, drawLabel, drawRegion)
│   ├── formatters.ts  Axis value formatters (fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, etc.)
│   ├── colors.ts      Color utilities (fadeGradient, withAlpha, palette)
│   └── index.ts       public API exports
├── test/              Vitest unit/integration tests (68 files, 756 tests)
├── e2e/               Playwright e2e tests (11 spec files, chromium + firefox)
├── demo/              demo app (vite dev server, 107 examples)
└── dist/              build output (gitignored)
```

## Commands

All commands run from the project root:

```sh
npm run dev         # Start demo dev server
npm run build       # Build library (ES + CJS to dist/)
npm run typecheck   # TypeScript strict check (tsc --noEmit)
npm run lint        # ESLint with strict TS rules
npm run test        # Vitest unit/integration tests
npm run test:e2e    # Playwright e2e tests (requires dev server running)
```

## Code Conventions

- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess: true`
- **No `any`**: ESLint enforces `@typescript-eslint/no-explicit-any`
- **Type-only imports**: use `import type { ... }` for types
- **Path alias**: `@/*` maps to `src/*`
- **No non-null assertions** (src): use proper narrowing instead. Tests allow `!` for array access with `noUncheckedIndexedAccess`.
- **No type assertions** (src): ESLint enforces `assertionStyle: 'never'`. The sole exception is the centralized `at()` helper in `src/utils/at.ts`.
- **Typed mocks**: prefer `vi.fn<(arg: T) => R>()` over untyped `vi.fn()` when the mock's `.mock.calls` are accessed in assertions — avoids `no-unsafe-assignment` eslint-disable.
- **eslint-disable policy**: only for genuine false positives (stable refs in exhaustive-deps, intentional no-deps effects, unavoidable mock casts in tests). Always add a `--` comment explaining why.

## Features

- **23 components**: Chart, Scale, Series, Axis, Band, Legend, Tooltip, FloatingLegend, HoverLabel, ZoomRanger, Timeline, Sparkline, BoxWhisker, Candlestick, Heatmap, Vector, ThemeProvider, HLine, VLine, Region, VRegion, DiagonalLine, AnnotationLabel
- **8 exported path builders**: linear (pixel decimation), stepped, bars, groupedBars, stackedBars, monotoneCubic, catmullRom, points. Internal default is lttbLinear (LTTB downsampling + pixel decimation), applied by CanvasRenderer when no `paths` prop is set.
- **Theming**: `ThemeProvider` sets CSS custom properties on a wrapper div; `Chart.theme` prop for per-chart overrides. Pre-built `DARK_THEME` preset. 40+ themeable properties (axes, grid, cursor, selection, series palette, candlestick, box-whisker, overlay panels, zoom ranger, annotations). CSS custom properties (`--uplot-*`) also work without ThemeProvider. `resolveTheme()` reads from `getComputedStyle(canvas)` on each full redraw.
- **Default injection**: Chart auto-creates missing x/y scales, axes, and series colors — minimal config: just `<Chart data={data}><Series group={0} index={0} /></Chart>`
- **Candlestick**: `<Candlestick />` auto-registers hidden OHLC series — no manual `<Series show={false}>` declarations needed.
- **Annotations**: declarative `<HLine>`, `<VLine>`, `<Region>`, `<VRegion>`, `<DiagonalLine>`, `<AnnotationLabel>` components; also imperative drawHLine/drawVLine/drawLabel/drawRegion/drawVRegion/drawDiagonalLine
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
- **Rendering**: Canvas 2D via `CanvasRenderer`. Axis layout uses a convergence loop (max 3 cycles). Single canvas with snapshot-based cursor overlay (offscreen canvas caches persistent layer; cursor redraws restore snapshot + draw cursor without full redraw).
- **Theme system**: Two-layer — React props (`Chart.theme` or `ThemeProvider`) set CSS custom properties on wrapper divs; `resolveTheme(canvas)` reads `getComputedStyle(canvas)` once per full redraw to produce a `ResolvedTheme`. ThemeProvider uses a revision counter (`ThemeRevisionContext`) so descendant Charts detect ancestor theme changes and trigger canvas repaint.
- **Auto-ranging**: y-scales auto-range from visible series data. When a y-scale has NO visible series (e.g. Candlestick with all `show={false}`), hidden series are included as fallback so the scale still gets a range.

## Testing

- **Unit/integration**: Vitest with jsdom environment — 68 test files, 756 tests
- **E2E**: Playwright with chromium + firefox — 11 spec files, 60 tests
- **Run**: `npm run test` (unit) / `npm run test:e2e` (e2e)
- **Mocks**: `test/setup.ts` provides Path2D, Canvas context, and requestAnimationFrame stubs
- **Pattern**: `describe`/`it` blocks with `@/` path aliases; helper factories for scales/data
- **Coverage**: math (utils, increments, stack, align, lttb), core (Scale, ScaleManager, DataStore, BlockMinMax, normalizeData, RenderScheduler, CursorManager), axes (ticks, layout, log filter, asinh splits), paths (linear, lttbLinear, stepped, bars, spline, candlestick, points, path utils), annotations, time formatting, formatters, colors, sync, hooks (useChart, useDraggableOverlay, useDrawHook), components (Chart, Legend, Tooltip, ZoomRanger, FloatingLegend, ThemeProvider), utils (shallowEqual), integration tests (convergence, auto-ranging, cursor snapping, cursor snapping extended, interactions, resize, mount, focus, defaults, axis drag, touch pinch)
- **Interaction tests**: `setupInteraction()` extracted from `useInteraction` hook for direct DOM event testing without React Testing Library
- **Demos**: 108 interactive examples across 14 categories (Getting Started, Line Styles, Bars & Stacking, Scales, Axes & Formatting, Time & Dates, Cursor & Interaction, Zoom & Pan, Data Handling, Tooltips & Legends, Layout & Streaming, Annotations & Drawing, Theming, Specialized Charts)

## Reference Code

When porting features, consult the original uPlot source in `uPlot/src/`:
- `uPlot.js` — main implementation (axes calc at ~line 1864, convergeSize at ~line 791)
- `opts.js` — defaults and tick generation (~line 550 for axis opts, ~line 591 for splits/values)
- `utils.js`, `fmtDate.js` — utilities
