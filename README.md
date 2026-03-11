# uPlot+

High-performance React charting library built from scratch in TypeScript. Canvas 2D rendering, native React components, multi-x-axis support.

## Features

- **Canvas 2D rendering** — no SVG or DOM elements for data visualization
- **Native React components** — declarative `<Chart>`, `<Series>`, `<Scale>`, `<Axis>` API
- **Multi-x-axis support** — multiple data groups with independent x-ranges on one chart
- **TypeScript-first** — strict types, full type exports, no `any`
- **7 path builders** — linear, stepped, bars, monotone cubic, Catmull-Rom, points, candlestick
- **Interactive** — wheel/touch zoom, drag-to-zoom, cursor snapping, series focus
- **Cursor sync** — linked crosshairs and tooltips across multiple charts
- **Small bundle** — ~18KB (5.7KB gzip), React 18+ peer dependency
- **Dual output** — ES module + CommonJS

## Installation

```sh
npm install uplot-plus
```

Peer dependencies:

```sh
npm install react react-dom
```

## Quick Start

```tsx
import { Chart, Scale, Series, Axis } from 'uplot-plus';

const data = [
  {
    x: [1, 2, 3, 4, 5],
    series: [
      [10, 25, 13, 30, 18],
      [5, 15, 20, 12, 28],
    ],
  },
];

function App() {
  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y" />
      <Axis scale="x" label="X-Axis" />
      <Axis scale="y" label="Y-Axis" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Series A" />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Series B" />
    </Chart>
  );
}
```

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
| `<ZoomRanger>` | Overview mini-chart with draggable selection for zoom control |
| `<Timeline>` | Horizontal lanes of colored event spans |
| `<Sparkline>` | Compact inline chart for tables and dashboards (no axes, no interaction) |
| `<ResponsiveChart>` | Auto-sizes to container via ResizeObserver |
| `<HLine>` | Declarative horizontal line annotation |
| `<VLine>` | Declarative vertical line annotation |
| `<Region>` | Declarative shaded region annotation |
| `<AnnotationLabel>` | Declarative text label at data coordinates |

> Full props reference, usage examples, and demo links: [docs/COMPONENTS.md](docs/COMPONENTS.md)

## Data Model

Data is organized as groups, each with its own x-values:

```ts
import type { ChartData, XGroup } from 'uplot-plus';

// Single x-axis (most common)
const data: ChartData = [
  {
    x: [1, 2, 3, 4, 5],
    series: [
      [10, 20, 30, 40, 50],   // series 0
      [5, 15, 25, 35, 45],    // series 1
    ],
  },
];

// Multi x-axis — two groups with independent x-ranges
const multiData: ChartData = [
  { x: [0, 1, 2, 3], series: [[10, 20, 15, 25]] },
  { x: [0, 0.5, 1.5, 2.5, 3], series: [[8, 18, 22, 12, 30]] },
];
```

Each series is referenced by a `(group, index)` tuple — `group` is the index into the `ChartData` array, `index` is the index into that group's `series` array.

Null values in series arrays create gaps in the chart. Use `spanGaps` on `<Series>` to bridge them.

## Path Builders

| Builder | Import | Use case |
|---------|--------|----------|
| `linear()` | `linear` | Line/area charts (default). Pixel-level decimation for large datasets |
| `stepped()` | `stepped` | Step charts — step-after, step-before, or mid-step |
| `bars()` | `bars` | Bar/column charts with configurable width, gaps, grouped bars |
| `monotoneCubic()` | `monotoneCubic` | Smooth curves that preserve monotonicity (no overshoot) |
| `catmullRom()` | `catmullRom` | Centripetal Catmull-Rom splines |
| `points()` | `points` | Scatter plots — points only, no connecting lines |
| `drawCandlesticks()` | `drawCandlesticks` | OHLC financial candlestick charts |

```tsx
import { Series, bars } from 'uplot-plus';

<Series group={0} index={0} yScale="y" paths={bars()} stroke="#3498db" fill="#3498db80" />
```

## Event Callbacks

React-idiomatic event handling — all callbacks receive resolved chart data (nearest point, data values, coordinates).

```tsx
import { Chart, Scale, Series, Axis } from 'uplot-plus';

<Chart
  data={data} width={800} height={400}
  onClick={(info) => {
    if (info.point) {
      console.log(`Clicked series ${info.point.seriesIdx} at y=${info.point.yVal}`);
    }
  }}
  onContextMenu={(info) => {
    // Right-click with resolved nearest point
    showContextMenu(info.srcEvent, info.point);
  }}
  onDblClick={(info) => {
    // Return false to prevent default zoom reset
    return false;
  }}
  onSelect={(sel) => {
    // Intercept drag selection — fetch detail data instead of zooming
    fetchData(sel.ranges['x'].min, sel.ranges['x'].max);
    return false; // prevent zoom
  }}
  onScaleChange={(scaleId, min, max) => {
    console.log(`Scale ${scaleId} changed: [${min}, ${max}]`);
  }}
  onCursorMove={(info) => { /* fires on every mouse move */ }}
  onCursorLeave={() => { /* cursor left the plot */ }}
>
  <Scale id="x" />
  <Scale id="y" />
  <Axis scale="x" />
  <Axis scale="y" />
  <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Series A" />
</Chart>
```

### Controlled Scales

Control zoom and pan declaratively through React state — no imperative refs needed:

```tsx
import { useState, useCallback } from 'react';
import { Chart, Scale, Series, Axis } from 'uplot-plus';

function ZoomableChart({ data }) {
  const [xRange, setXRange] = useState<[number, number] | null>(null);

  const onScaleChange = useCallback((id: string, min: number, max: number) => {
    if (id === 'x') setXRange([min, max]);
  }, []);

  return (
    <>
      <button onClick={() => setXRange(null)}>Reset Zoom</button>
      <Chart data={data} width={800} height={400} onScaleChange={onScaleChange}>
        <Scale id="x"
          auto={xRange == null} min={xRange?.[0]} max={xRange?.[1]} />
        <Scale id="y" />
        {/* ... axes, series */}
      </Chart>
    </>
  );
}
```

## Hooks

### `useChart()`

Access the chart store from a child component of `<Chart>`. This is an advanced API for building custom chart sub-components that need direct store access — for most use cases, prefer event callbacks and controlled Scale props.

```tsx
import { useChart } from 'uplot-plus';

function CustomControl() {
  const store = useChart();
  return <button onClick={() => store.toggleSeries(0, 0)}>Toggle</button>;
}
```

### `useDrawHook()` / `useCursorDrawHook()`

Register custom Canvas 2D draw callbacks from child components. For most cases, prefer the `onDraw` / `onCursorDraw` props on `<Chart>` — these hooks are useful when building reusable chart sub-components.

```tsx
import { useDrawHook } from 'uplot-plus';
import type { DrawCallback } from 'uplot-plus';

const onDraw: DrawCallback = (dc) => {
  dc.ctx.fillStyle = 'rgba(255,0,0,0.2)';
  dc.ctx.fillRect(dc.plotBox.left, dc.plotBox.top, dc.plotBox.width, dc.plotBox.height);
};
```

### `useStreamingData()`

Sliding-window data management for real-time charts:

```tsx
import { useStreamingData } from 'uplot-plus';

const { data, push, start, stop, fps } = useStreamingData(initialData, {
  window: 1000,   // keep last 1000 points
  batchSize: 10,  // push 10 points per tick
});

// In your tick callback:
push([newX], [newY1], [newY2]);
```

## Axis Value Formatters

Pre-built formatters for common axis label patterns:

```tsx
import { fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtLabels } from 'uplot-plus';

<Axis scale="y" values={fmtCompact()} />           // 1.2K, 3.5M
<Axis scale="y" values={fmtSuffix('%')} />         // 42%
<Axis scale="y" values={fmtSuffix('°C', 1)} />    // 23.5°C
<Axis scale="x" values={fmtHourMin({ utc: true })} /> // 14:30
<Axis scale="x" values={fmtMonthName()} />         // Jan, Feb, ...
<Axis scale="x" values={fmtLabels(['Q1','Q2','Q3','Q4'])} />
```

## Color Utilities

```tsx
import { fadeGradient, withAlpha, palette } from 'uplot-plus';

// Gradient that fades from color to transparent (for area fills)
<Series fill={fadeGradient('#3498db')} />
<Series fill={fadeGradient('#e74c3c', 1.0, 0.2)} />

// Match fill to stroke with lower opacity
<Series stroke="#2980b9" fill={withAlpha('#2980b9', 0.1)} />

// Generate N distinct colors
const colors = palette(5); // 5 visually distinct HSL colors
```

## Data Utilities

### `stackGroup`

Computes stacked series values and generates band configs:

```tsx
import { stackGroup, Band } from 'uplot-plus';

const raw = { x: [1, 2, 3], series: [[10, 20, 30], [5, 10, 15]] };
const { group, bands } = stackGroup(raw);

<Chart data={[group]}>
  {bands.map((b, i) => <Band key={i} {...b} />)}
</Chart>
```

### `alignData`

Aligns data across multiple x-axes for multi-group charts.

## Annotations

Declarative annotation components — place inside `<Chart>`:

```tsx
import { HLine, VLine, Region, AnnotationLabel } from 'uplot-plus';

<Chart data={data}>
  {/* ... scales, axes, series */}
  <HLine value={65} yScale="y" stroke="#e74c3c" dash={[6, 4]} label="Threshold" />
  <VLine value={100} xScale="x" stroke="#8e44ad" dash={[4, 4]} />
  <Region yMin={40} yMax={60} yScale="y" fill="rgba(46,204,113,0.12)" />
  <AnnotationLabel x={50} y={65} text="Alert zone" fill="#e74c3c" />
</Chart>
```

Imperative helpers are available for advanced draw hooks that need programmatic control:

```tsx
import { drawHLine, drawVLine, drawLabel, drawRegion } from 'uplot-plus';
```

## Scale Utilities

For advanced draw hooks that need pixel conversions:

```tsx
import { valToPos, posToVal } from 'uplot-plus';

const px = valToPos(dataValue, scale, dimension, offset);
const val = posToVal(pixelPos, scale, dimension, offset);
```

## Development

```sh
npm run dev         # Start demo dev server (85+ examples)
npm run build       # Build library (ES + CJS to dist/)
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint
npm run test        # Vitest test suite
```

## License

MIT
