# uPlot+

High-performance React charting library ripped off from [uPlot](https://github.com/leeoniya/uplot). Might perform occasionally better than original uPlot in React context (or worse). Definitely easier to use in React context.

**[Live Demo (107 examples)](https://yeonsoo-p.github.io/uPlot-Plus/)**

## Quick Start

```sh
npm install uplot-plus react react-dom
```

Scales, axes, and colors are auto-injected when omitted — the simplest chart is just data + series:

```tsx
import { Chart, Series } from 'uplot-plus';

const data = { x: [1, 2, 3, 4, 5], y: [10, 25, 13, 30, 18] };

<Chart width={800} height={400} data={data}>
  <Series group={0} index={0} label="Revenue" />
</Chart>
```

For full control, declare scales, axes, and series explicitly:

```tsx
import { Chart, Scale, Series, Axis } from 'uplot-plus';

const data = [{ x: [1, 2, 3, 4, 5], series: [[10, 25, 13, 30, 18], [5, 15, 20, 12, 28]] }];

<Chart width={800} height={400} data={data}>
  <Scale id="x" />
  <Scale id="y" />
  <Axis scale="x" label="X-Axis" />
  <Axis scale="y" label="Y-Axis" />
  <Series group={0} index={0} yScale="y" stroke="#e74c3c" label="Series A" />
  <Series group={0} index={1} yScale="y" stroke="#3498db" label="Series B" />
</Chart>
```

## Chart Types

All chart types are configured via the `paths` prop on `<Series>`, or via specialized components:

```tsx
import { Series, bars, horizontalBars, stepped, monotoneCubic, points } from 'uplot-plus';

<Series paths={bars()} />           // Bar / column charts
<Series paths={horizontalBars()} /> // Horizontal bars (data-axis-swapped)
<Series paths={stepped()} />        // Step charts
<Series paths={monotoneCubic()} />  // Smooth curves
<Series paths={points()} />         // Scatter plots
```

`horizontalBars()` sets the series' `transposed` flag, which flips the associated
x-scale to `Orientation.Vertical` and the y-scale to `Orientation.Horizontal`.
Axes, cursor, annotations, and band fills all adapt automatically. Use separate
scales for horizontal and vertical bar series if they share a chart.

| Type | How to use |
| ---- | ---------- |
| Line / area | Default — just `<Series />` with optional `fill` |
| Bar / column | `<Series paths={bars()} />` — also `groupedBars()`, `stackedBars()`, `horizontalBars()` |
| Step | `<Series paths={stepped()} />` — step-after, step-before, mid-step |
| Smooth curve | `<Series paths={monotoneCubic()} />` or `catmullRom()` |
| Scatter | `<Series paths={points()} />` |
| Candlestick | `<Candlestick />` — OHLC financial charts |
| Box & whisker | `<BoxWhisker boxes={[...]} />` — quartile distributions |
| Heatmap | `<Heatmap grid={[...]} />` — 2D colored grid |
| Vector field | `<Vector directions={[...]} />` — directional arrows on data |
| Timeline | `<Timeline lanes={[...]} />` — horizontal event lanes |
| Sparkline | `<Sparkline data={data} />` — compact inline chart |

## Interactions

Every user gesture maps to a chart reaction via the **action map**. Default behavior works out of the box — drag to zoom, double-click to reset, y-axis gutter drag to pan:

```tsx
// Defaults: leftDrag→zoomX, leftDblclick→reset, wheel→zoomX, yGutterDrag→panY, xGutterDrag→panX
<Chart data={data} width={800} height={400}>
  <Series group={0} index={0} />
</Chart>
```

Override any gesture by passing `[action, reaction]` tuples — merged with defaults internally:

```tsx
// Wheel zooms both axes, shift+wheel zooms Y only
<Chart actions={[['wheel', 'zoomXY'], ['shiftWheel', 'zoomY']]} />

// Middle-drag pans, disable double-click reset
<Chart actions={[['middleDrag', 'panXY'], ['leftDblclick', 'none']]} />

// Focus mode: hover dims non-nearest series
import { focus } from 'uplot-plus';
<Chart actions={[['hover', focus(0.15)]]} />
```

Custom function matchers for actions the built-in classifiers don't cover:

```tsx
<Chart actions={[
  // String → function: built-in classifier handles shift+click
  ['shiftLeftClick', (store) => { /* toggle series */ }],

  // String → function: keyboard shortcut
  ['shiftKeyX', (store) => { /* reset widths */ }],

  // Function → function: truly custom (e.g. Q key held + click)
  [(e, ctx) => isQHeld && ctx.action === 'leftClick', (store) => { /* custom */ }],
]} />
```

**Built-in actions:** `{mod?}{Button}{Type}` — `leftDrag`, `shiftMiddleClick`, `ctrlRightDrag`, `wheel`, `shiftWheel`, `xGutterDrag`, `yGutterDrag`, `hover`, `touchDrag`, `pinch`, `key{Key}`, `shiftKey{Key}`

**Built-in reactions:** `zoomX`, `zoomY`, `zoomXY`, `panX`, `panY`, `panXY`, `reset`, `none`

## Components

| Component | Description |
|-----------|-------------|
| `<Chart>` | Root container — creates the canvas, manages the chart store |
| `<Scale>` | Registers a scale (linear, log, asinh, ordinal) |
| `<Series>` | Registers a data series with stroke, fill, path builder |
| `<Axis>` | Renders an axis with ticks, labels, grid lines |
| `<Band>` | Fills a region between two series |
| `<Legend>` | Interactive legend with live cursor values, click-to-toggle |
| `<Tooltip>` | Floating tooltip at cursor position, auto-flips at edges |
| `<FloatingLegend>` | Draggable or cursor-following legend panel |
| `<HoverLabel>` | Shows nearest series info after a hover delay |
| `<ZoomRanger>` | Overview mini-chart with draggable selection for zoom control |
| `<Timeline>` | Horizontal lanes of colored event spans |
| `<Sparkline>` | Compact inline chart for tables and dashboards |
| `<BoxWhisker>` | Box-and-whisker plot with quartiles, whiskers, and median |
| `<Candlestick>` | OHLC financial candlestick chart |
| `<ThemeProvider>` | Sets CSS custom properties for descendant charts |
| `<Heatmap>` | 2D grid of colored cells with configurable color map |
| `<Vector>` | Directional arrows overlaid on data points |
| `<HLine>` | Horizontal line annotation |
| `<VLine>` | Vertical line annotation |
| `<Region>` | Shaded region annotation |
| `<AnnotationLabel>` | Text label at data coordinates |

> Full props reference: [docs/COMPONENTS.md](docs/COMPONENTS.md)

## Data Model

Three input forms — use whichever fits your data:

```ts
// Simplest: single series
const data = { x: [1, 2, 3, 4, 5], y: [10, 20, 30, 40, 50] };

// Multiple series sharing one x-axis
const data = [{ x: [1, 2, 3, 4, 5], series: [[10, 20, 30], [5, 15, 25]] }];

// Multi x-axis — two groups with independent x-ranges
const data = [
  { x: [0, 1, 2, 3], series: [[10, 20, 15, 25]] },
  { x: [0, 0.5, 1.5, 2.5, 3], series: [[8, 18, 22, 12, 30]] },
];
```

Null values in series arrays create gaps. Use `spanGaps` on `<Series>` to bridge them.

## Annotations

```tsx
import { HLine, VLine, Region, AnnotationLabel } from 'uplot-plus';

<Chart data={data}>
  <HLine value={65} yScale="y" stroke="#e74c3c" dash={[6, 4]} label="Threshold" />
  <VLine value={100} xScale="x" stroke="#8e44ad" dash={[4, 4]} />
  <Region yMin={40} yMax={60} yScale="y" fill="rgba(46,204,113,0.12)" />
  <AnnotationLabel x={50} y={65} text="Alert zone" fill="#e74c3c" />
</Chart>
```

## Theming

Switch between light/dark themes, customize colors, or style via CSS custom properties:

```tsx
import { Chart, Series, ThemeProvider, DARK_THEME } from 'uplot-plus';

// Dark mode via ThemeProvider
<ThemeProvider theme={DARK_THEME}>
  <Chart data={data} width={800} height={400}>
    <Series group={0} index={0} />
  </Chart>
</ThemeProvider>

// Per-chart theme override
<Chart data={data} width={800} height={400} theme={{ seriesColors: ['#e74c3c', '#3498db'] }}>
  <Series group={0} index={0} />
</Chart>

// CSS custom properties (no ThemeProvider needed)
<div style={{ '--uplot-axis-stroke': '#8ab4f8', '--uplot-grid-stroke': 'rgba(138,180,248,0.1)' }}>
  <Chart data={data} width={800} height={400}>
    <Series group={0} index={0} />
  </Chart>
</div>
```

40+ themeable properties: axes, grid, cursor, selection, series palette, candlestick, box-whisker, annotations, overlay panels, zoom ranger. Nested `<ThemeProvider>` components cascade — inner providers override outer ones.

> Full theme API: [docs/COMPONENTS.md](docs/COMPONENTS.md#themeprovider)

## Utilities

| Category | Functions |
| -------- | --------- |
| Axis formatters | `fmtCompact`, `fmtSuffix`, `fmtPrefix`, `fmtWrap`, `fmtHourMin`, `fmtMonthName`, `fmtDateStr`, `fmtLabels` |
| Color helpers | `fadeGradient`, `withAlpha`, `palette` |
| Data transforms | `stackGroup`, `alignData`, `lttb`, `lttbGroup` |
| Scale projection | `valToPos`, `posToVal`, `valToPx`, `projectPoint`, `scaleAxis` |
| Theme presets | `THEME_DEFAULTS`, `DARK_THEME` |

> Full API and examples: [docs/UTILITIES.md](docs/UTILITIES.md)

> Advanced: [Event callbacks, hooks, controlled scales](docs/ADVANCED.md)

## Development

```sh
npm run dev         # Start demo dev server (107 examples)
npm run build       # Build library (ES + CJS to dist/)
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint
npm run test        # Vitest unit/integration tests (756 tests)
npm run test:e2e    # Playwright e2e tests (chromium + firefox)
```

## License

MIT
