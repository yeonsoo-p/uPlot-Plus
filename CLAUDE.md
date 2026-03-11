# uPlot+

High-performance React charting library rewriting uPlot from scratch in TypeScript. Canvas 2D rendering, native React components, multi-x-axis support.

## Project Layout

Library code lives at the project root. The `uPlot/` and `uplot-wrappers/` directories are reference-only copies of the original library and its framework wrappers — do not modify them.

```
./
├── src/
│   ├── components/    Chart, Series, Scale, Axis, Band, Legend, Tooltip, ZoomRanger, Timeline,
│   │                  Sparkline, ResponsiveChart, annotations/{HLine,VLine,Region,AnnotationLabel}
│   ├── core/          DataStore, ScaleManager, CursorManager, RenderScheduler, Scale
│   ├── rendering/     CanvasRenderer, drawSeries, drawAxes, drawCursor, drawSelect
│   ├── hooks/         useChart, useDrawHook, useCursorDrawHook, useStreamingData (public); useInteraction, useChartStore (internal)
│   ├── math/          utils, increments, stack, align
│   ├── axes/          ticks, layout
│   ├── paths/         linear, stepped, bars, monotoneCubic, catmullRom, points, candlestick
│   ├── types/         all type definitions (common, scales, axes, hooks, bands, etc.)
│   ├── time/          timeIncrs, timeSplits, timeVals, fmtDate
│   ├── annotations.ts Annotation drawing helpers (drawHLine, drawVLine, drawLabel, drawRegion)
│   ├── formatters.ts  Axis value formatters (fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, etc.)
│   ├── colors.ts      Color utilities (fadeGradient, withAlpha, palette)
│   └── index.ts       public API exports
├── test/              Vitest test suite
├── demo/              demo app (vite dev server, 85+ examples)
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

- **15 components**: Chart, Scale, Series, Axis, Band, Legend, Tooltip, ZoomRanger, Timeline, Sparkline, ResponsiveChart, HLine, VLine, Region, AnnotationLabel
- **7 path builders**: linear (with pixel-level decimation), stepped, bars, monotoneCubic, catmullRom, points, candlestick
- **Annotations**: declarative `<HLine>`, `<VLine>`, `<Region>`, `<AnnotationLabel>` components; also imperative drawHLine/drawVLine/drawLabel/drawRegion
- **Axis formatters**: fmtCompact (K/M/B), fmtSuffix (°C, %), fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels
- **Color utilities**: fadeGradient, withAlpha, palette
- **Time formatting**: Intl.DateTimeFormat-based formatters, 26 standard time increments, round-boundary tick alignment
- **Cursor sync**: multiple charts share cursor state via `syncKey`
- **Interactions**: wheel/touch zoom, drag-to-zoom, Y-scale dragging, focus mode
- **Data utilities**: stackGroup (stacked areas/bars), alignData (multi-x-axis alignment)
- **Hooks**: useChart, useDrawHook, useCursorDrawHook, useStreamingData
- **Scale types**: linear, ordinal, log (any base), asinh

## Architecture

- **Data model**: `ChartData = XGroup[]` — each group has its own x-values and y-series arrays. Series are referenced by `(group, index)` tuple.
- **Mutable ChartStore**: canvas operations are imperative, not driven by React re-renders. `useSyncExternalStore` powers Legend/Tooltip subscriptions.
- **RenderScheduler**: dirty-flag batching for efficient canvas redraws. PathCache per series with invalidation on data/config changes.
- **Cursor**: snaps to nearest point by pixel distance across all series/groups. Sync across charts via shared cursor state keyed by `syncKey`.
- **Zoom**: linked by default — pixel fraction applied to all x-scales.
- **Rendering**: Canvas 2D via `CanvasRenderer`. Axis layout uses a convergence loop (max 3 cycles). Two canvas layers: persistent (data/axes) and cursor overlay.

## Testing

- **Framework**: Vitest with jsdom environment
- **Run**: `npm run test`
- **Mocks**: `test/setup.ts` provides Path2D, Canvas context, and requestAnimationFrame stubs
- **Pattern**: `describe`/`it` blocks with `@/` path aliases; helper factories for scales/data
- **Coverage**: math (utils, increments, stack, align), core (Scale, ScaleManager, DataStore), axes (ticks, layout, log filter), paths (linear, stepped, bars, spline, candlestick), annotations, time formatting, integration tests (convergence, auto-ranging, cursor snapping, resize, mount, focus)
- **Demos**: 85+ interactive examples covering all chart types, interactions, and edge cases

## Reference Code

When porting features, consult the original uPlot source in `uPlot/src/`:
- `uPlot.js` — main implementation (axes calc at ~line 1864, convergeSize at ~line 791)
- `opts.js` — defaults and tick generation (~line 550 for axis opts, ~line 591 for splits/values)
- `utils.js`, `fmtDate.js` — utilities
