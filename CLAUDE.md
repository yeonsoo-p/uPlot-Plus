# uPlot+

High-performance React charting library rewriting uPlot from scratch in TypeScript. Canvas 2D rendering, native React components, multi-x-axis support.

## Project Layout

Library code lives at the project root. The `uPlot/` and `uplot-wrappers/` directories are reference-only copies of the original library and its framework wrappers — do not modify them.

```
./
├── src/
│   ├── components/    Chart, Series, Scale, Axis (React components)
│   ├── core/          DataStore, ScaleManager, CursorManager, RenderScheduler, Scale
│   ├── rendering/     CanvasRenderer, drawSeries, drawAxes, drawCursor, drawSelect
│   ├── hooks/         useChart, useInteraction, useChartStore
│   ├── math/          utils, increments
│   ├── axes/          ticks, layout
│   ├── paths/         path builders (linear, etc.)
│   ├── types/         all type definitions
│   └── index.ts       public API exports
├── demo/              demo app (vite dev server)
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

## Architecture

- **Data model**: `ChartData = XGroup[]` — each group has its own x-values and y-series arrays. Series are referenced by `(group, index)` tuple.
- **Mutable ChartStore**: canvas operations are imperative, not driven by React re-renders. `useSyncExternalStore` powers Legend/Tooltip subscriptions.
- **Cursor**: snaps to nearest point by pixel distance across all series/groups.
- **Zoom**: linked by default — pixel fraction applied to all x-scales.
- **Rendering**: Canvas 2D via `CanvasRenderer`. Axis layout uses a convergence loop (max 3 cycles).

## Reference Code

When porting features, consult the original uPlot source in `uPlot/src/`:
- `uPlot.js` — main implementation (axes calc at ~line 1864, convergeSize at ~line 791)
- `opts.js` — defaults and tick generation (~line 550 for axis opts, ~line 591 for splits/values)
- `utils.js`, `fmtDate.js` — utilities
