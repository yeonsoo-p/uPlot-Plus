# uPlot+

High-performance React charting library ripped off from [uPlot](https://github.com/leeoniya/uplot). Might perform occasionally better than original uPlot in React context (or worse). Definitely easier to use in React context.

**[Live Demo (99 examples)](https://yeonsoo-p.github.io/uPlot-Plus/)**

## Features

- **Canvas 2D rendering** — no SVG or DOM elements for data visualization
- **Native React components** — declarative `<Chart>`, `<Series>`, `<Scale>`, `<Axis>` API
- **Multi-x-axis support** — multiple data groups with independent x-ranges on one chart
- **TypeScript-first** — strict types, full type exports, no `any`
- **7 path builders** — linear, stepped, bars, monotone cubic, Catmull-Rom, points, candlestick
- **Interactive** — wheel/touch zoom, drag-to-zoom, cursor snapping, series focus
- **Cursor sync** — linked crosshairs and tooltips across multiple charts
- **Compact bundle** — ~128KB (~36KB gzip), React 18+ peer dependency
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

Scales, axes, and colors are auto-injected when omitted — the simplest chart is just data + series:

```tsx
import { Chart, Series } from 'uplot-plus';

const data = { x: [1, 2, 3, 4, 5], y: [10, 25, 13, 30, 18] };

function App() {
  return (
    <Chart width={800} height={400} data={data}>
      <Series group={0} index={0} label="Revenue" />
    </Chart>
  );
}
```

For full control, declare scales, axes, and series explicitly:

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
| `<FloatingLegend>` | Draggable or cursor-following legend panel with idle opacity fade |
| `<HoverLabel>` | Shows nearest series info after a hover delay |
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

Three input forms — use whichever fits your data:

```ts
// Simplest: single series
const data = { x: [1, 2, 3, 4, 5], y: [10, 20, 30, 40, 50] };

// Multiple series sharing one x-axis
const data = [
  {
    x: [1, 2, 3, 4, 5],
    series: [
      [10, 20, 30, 40, 50],   // series 0
      [5, 15, 25, 35, 45],    // series 1
    ],
  },
];

// Multi x-axis — two groups with independent x-ranges
const multiData = [
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
| `bars()` | `bars` | Bar/column charts with configurable width and gaps |
| `groupedBars()` | `groupedBars` | Side-by-side grouped bar charts |
| `stackedBars()` | `stackedBars` | Stacked bar charts |
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

const { data, push, pushGroup, start, stop, fps } = useStreamingData(initialData, {
  window: 1000,   // keep last 1000 points
  batchSize: 10,  // push 10 points per tick
});

// Push into group 0 (default):
push([newX], [newY1], [newY2]);

// Push into a specific group (for multi-x-axis charts):
pushGroup(1, [newX], [newY1]);
```

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

## Utilities

| Category | Functions |
| ---------- | ----------- |
| Axis formatters | `fmtCompact`, `fmtSuffix`, `fmtPrefix`, `fmtWrap`, `fmtHourMin`, `fmtMonthName`, `fmtDateStr`, `fmtLabels` |
| Color helpers | `fadeGradient`, `withAlpha`, `palette` |
| Data transforms | `stackGroup`, `alignData` |
| Scale math | `valToPos`, `posToVal` |

> Full API, signatures, and examples: [docs/UTILITIES.md](docs/UTILITIES.md)

## Development

```sh
npm run dev         # Start demo dev server (99 examples)
npm run build       # Build library (ES + CJS to dist/)
npm run typecheck   # TypeScript strict check
npm run lint        # ESLint
npm run test        # Vitest test suite
```

## License

MIT
