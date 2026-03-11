# Component Reference

Complete props reference for all uPlot+ React components, organized by hierarchy.

## Component Hierarchy

```
<Chart>                          Root container (canvas + store)
├── <Scale>                      Scale registration (renderless)
├── <Series>                     Data series registration (renderless)
├── <Axis>                       Axis rendering (renderless)
├── <Band>                       Fill between two series (renderless)
├── <Legend>                      Interactive legend (HTML overlay)
├── <Tooltip>                    Cursor tooltip (HTML overlay)
├── <Timeline>                   Event lanes (canvas draw hook)
├── <HLine>                      Horizontal line annotation (canvas draw hook)
├── <VLine>                      Vertical line annotation (canvas draw hook)
├── <Region>                     Shaded region annotation (canvas draw hook)
└── <AnnotationLabel>            Text label annotation (canvas draw hook)

<ZoomRanger>                     Overview mini-chart (standalone, wraps Chart internally)
<Sparkline>                      Compact inline chart (standalone, wraps Chart internally)
<ResponsiveChart>                Auto-sizing wrapper (standalone, wraps Chart internally)
```

**Renderless components** return `null` — they register configuration with the chart store via `useEffect` and do not produce DOM elements. Canvas operations are imperative, not driven by React re-renders.

**Draw hook components** (Timeline, annotations) use `useDrawHook()` to register a canvas draw callback that runs on every redraw.

**Standalone components** wrap `<Chart>` internally and can be used independently.

---

## Core Components

### `<Chart>`

Root container. Creates two canvas layers (persistent data + cursor overlay), initializes the chart store, and provides context to all children.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | — | Chart width in CSS pixels **(required)** |
| `height` | `number` | — | Chart height in CSS pixels **(required)** |
| `data` | `ChartData` | — | Chart data **(required)** |
| `children` | `ReactNode` | — | Scale, Series, Axis, Legend, etc. |
| `className` | `string` | — | CSS class name |
| `pxRatio` | `number` | `devicePixelRatio` | Device pixel ratio override |
| `syncKey` | `string` | — | Sync cursor across charts with the same key |
| `cursor` | `CursorConfig` | — | Cursor/interaction config |
| `onDraw` | `DrawCallback` | — | Custom draw on persistent layer |
| `onCursorDraw` | `CursorDrawCallback` | — | Custom draw on cursor overlay |
| `onClick` | `(info: ChartEventInfo) => void` | — | Click within plot area |
| `onContextMenu` | `(info: ChartEventInfo) => void` | — | Right-click within plot area |
| `onDblClick` | `(info: ChartEventInfo) => boolean \| void` | — | Double-click (return `false` to prevent zoom reset) |
| `onCursorMove` | `(info: ChartEventInfo) => void` | — | Cursor moves over plot |
| `onCursorLeave` | `() => void` | — | Cursor leaves plot area |
| `onScaleChange` | `ScaleChangeCallback` | — | Scale range changes (zoom, pan) |
| `onSelect` | `(sel: SelectEventInfo) => boolean \| void` | — | Drag selection completes (return `false` to prevent zoom) |
| `onReady` | `(ref: ChartRef) => void` | — | Fires after initial render |
| `chartRef` | `React.Ref<ChartRef>` | — | Imperative chart access |

**`CursorConfig`:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `wheelZoom` | `boolean` | `false` | Enable mouse wheel zoom on x-axis |
| `focus` | `FocusConfig` | — | Focus mode: dims non-closest series |

**`FocusConfig`:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `alpha` | `number` | `0.15` | Opacity for non-focused series |

**`ChartRef`** (imperative handle via `chartRef`):

| Method | Signature | Description |
|--------|-----------|-------------|
| `setScale` | `(id, min, max) => void` | Set scale range programmatically |
| `resetScales` | `() => void` | Reset all scales to declarative state |
| `getScale` | `(id) => { min, max } \| null` | Get current scale range |
| `getPlotBox` | `() => BBox` | Get plot bounding box |
| `redraw` | `() => void` | Force a full redraw |
| `getCursor` | `() => CursorState` | Get cursor state |

```tsx
import { Chart, Scale, Series, Axis } from 'uplot-plus';

<Chart width={800} height={400} data={data}>
  <Scale id="x" auto ori={0} dir={1} />
  <Scale id="y" auto ori={1} dir={1} />
  <Axis scale="x" side={2} label="X-Axis" />
  <Axis scale="y" side={3} label="Y-Axis" />
  <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Series A" />
</Chart>
```

**Demos:** All demos use Chart. Key examples: `basic-line`, `zoom-wheel`, `sync-cursor`, `draw-hooks`.

---

### `<Scale>`

Registers a scale with the chart store. Scales define how data values map to pixel positions. Renderless — returns `null`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique scale identifier **(required)** |
| `auto` | `boolean` | — | Auto-range from data |
| `ori` | `0 \| 1` | — | 0 = horizontal (x), 1 = vertical (y) |
| `dir` | `1 \| -1` | `1` | 1 = normal, -1 = reversed |
| `distr` | `1 \| 2 \| 3 \| 4` | `1` | 1=linear, 2=ordinal, 3=log, 4=asinh |
| `log` | `number` | `10` | Log base when `distr=3` |
| `asinh` | `number` | `1` | Asinh linear threshold when `distr=4` |
| `min` | `number \| null` | — | Fixed min (overrides auto) |
| `max` | `number \| null` | — | Fixed max (overrides auto) |
| `time` | `boolean` | — | Time-based scale (unix timestamps) |
| `range` | `RangeConfig` | — | Auto-range padding/bounds |

**`RangeConfig`:**

```ts
interface RangeConfig {
  min?: RangePart;
  max?: RangePart;
}
interface RangePart {
  pad?: number;    // Padding as fraction of data range
  hard?: number;   // Hard limit (never exceed)
  soft?: number;   // Soft limit (preferred boundary)
  mode?: 0|1|2|3;  // Soft mode: 0=off, 1=always, 2=inside, 3=outside
}
```

**Distribution types:**

| `distr` | Type | Use case |
|---------|------|----------|
| `1` | Linear | Default. Equal spacing. |
| `2` | Ordinal | Categorical data (equal spacing by index). |
| `3` | Log | Exponential data. Set `log` for base (default 10). |
| `4` | Asinh | Data spanning negative-to-positive with linear region near zero. |

```tsx
// Linear y-scale with auto-ranging
<Scale id="y" auto ori={1} dir={1} />

// Log scale (base 10)
<Scale id="y" auto ori={1} dir={1} distr={3} log={10} />

// Fixed range with soft limits
<Scale id="y" auto ori={1} dir={1} range={{ min: { soft: 0, mode: 1 } }} />
```

**Demos:** `log-scales`, `log-scales-2`, `asinh-scales`, `multiple-scales`, `dependent-scales`, `scale-direction`, `custom-scales`, `scale-padding`, `soft-minmax`, `nice-scale`, `sync-y-zero`.

---

### `<Series>`

Registers a data series with the chart store. Each series references a `(group, index)` tuple in the data and maps to a y-scale. Renderless — returns `null`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `group` | `number` | — | Data group index **(required)** |
| `index` | `number` | — | Series index within group **(required)** |
| `yScale` | `string` | — | Y-axis scale key **(required)** |
| `show` | `boolean` | `true` | Visibility |
| `label` | `string` | — | Legend/tooltip label |
| `stroke` | `ColorValue` | — | Line color (string or gradient) |
| `fill` | `ColorValue` | — | Fill color (string or gradient) |
| `width` | `number` | — | Stroke width in CSS pixels |
| `alpha` | `number` | `1` | Opacity 0–1 |
| `paths` | `PathBuilder` | `linear()` | Path builder function |
| `points` | `PointsConfig` | — | Point marker config |
| `dash` | `number[]` | — | Dash pattern |
| `cap` | `CanvasLineCap` | — | Line cap style |
| `join` | `CanvasLineJoin` | — | Line join style |
| `pxAlign` | `number` | `1` | Pixel alignment (0=none, 1=round) |
| `spanGaps` | `boolean` | `false` | Connect across null gaps |
| `sorted` | `1 \| -1 \| 0` | — | 1=asc, -1=desc, 0=unsorted |
| `fillTo` | `number \| (min, max) => number` | — | Fill target value |

**`PointsConfig`:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean \| function` | — | Show points (function receives viewport info) |
| `size` | `number` | — | Point diameter in CSS pixels |
| `space` | `number` | — | Min space between points |
| `width` | `number` | — | Point stroke width |
| `stroke` | `string` | — | Point stroke color |
| `fill` | `string` | — | Point fill color |
| `dash` | `number[]` | — | Point stroke dash |

**`ColorValue`** can be a CSS color string or a gradient:

```ts
type ColorValue = string | GradientConfig;

interface GradientConfig {
  type: 'linear';
  stops: [number, string][]; // [offset 0-1, css color]
}
```

Use the `fadeGradient()` and `withAlpha()` helpers from `uplot-plus` to create these easily.

**Path builders** (pass to `paths` prop):

| Builder | Import | Use case |
|---------|--------|----------|
| `linear()` | `linear` | Line/area charts (default). Pixel-level decimation. |
| `stepped()` | `stepped` | Step-after, step-before, or mid-step. |
| `bars()` | `bars` | Bar/column charts. |
| `monotoneCubic()` | `monotoneCubic` | Smooth curves preserving monotonicity. |
| `catmullRom()` | `catmullRom` | Centripetal Catmull-Rom splines. |
| `points()` | `points` | Scatter plots (points only, no lines). |
| `drawCandlesticks()` | `drawCandlesticks` | OHLC financial candlesticks. |

```tsx
import { Series, bars, withAlpha, fadeGradient } from 'uplot-plus';

// Line series
<Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Revenue" />

// Bar series
<Series group={0} index={0} yScale="y" paths={bars()} stroke="#3498db" fill="#3498db80" />

// Area fill with gradient
<Series group={0} index={0} yScale="y" stroke="#4285f4" fill={fadeGradient('#4285f4')} />

// Dashed line with points
<Series group={0} index={0} yScale="y" stroke="#888" dash={[6, 4]} points={{ show: true, size: 6 }} />
```

**Demos:** `basic-line`, `area-fill`, `point-styles`, `dash-patterns`, `bar-chart`, `stepped-lines`, `smooth-lines`, `fill-to`, `span-gaps`, `sparklines`, `gradients`.

---

### `<Axis>`

Registers an axis with the chart store. Axes render tick marks, labels, and grid lines for a scale. Renderless — returns `null`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scale` | `string` | — | Scale key **(required)** |
| `side` | `0 \| 1 \| 2 \| 3` | — | 0=top, 1=right, 2=bottom, 3=left **(required)** |
| `show` | `boolean` | `true` | Visibility |
| `label` | `string` | — | Axis label text |
| `labelFont` | `string` | — | Label font |
| `labelSize` | `number` | — | Label size (CSS px) |
| `labelGap` | `number` | — | Gap between label and axis edge |
| `font` | `string` | — | Tick label font |
| `stroke` | `string` | — | Tick label color |
| `space` | `number` | — | Min space between ticks (CSS px) |
| `gap` | `number` | — | Gap between ticks and labels |
| `size` | `number` | — | Axis size (height for horizontal, width for vertical) |
| `rotate` | `number` | `0` | Tick label rotation in degrees |
| `incrs` | `number[]` | — | Custom tick increment array |
| `values` | `(splits, space, incr) => string[]` | — | Custom tick label formatter |
| `splits` | `(min, max, incr, space) => number[]` | — | Custom tick position generator |
| `grid` | `GridConfig` | — | Grid line config |
| `ticks` | `TickConfig` | — | Tick mark config |
| `border` | `BorderConfig` | — | Axis border config |

**`GridConfig` / `TickConfig` / `BorderConfig`:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `true` (grid/ticks), `false` (border) | Visibility |
| `stroke` | `string` | — | Color |
| `width` | `number` | — | Line width |
| `dash` | `number[]` | — | Dash pattern |
| `size` | `number` | — | Tick mark size (TickConfig only) |

Use the built-in **axis value formatters** for common patterns:

```tsx
import { Axis, fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtLabels } from 'uplot-plus';

<Axis scale="y" side={3} values={fmtCompact()} />            // 1.2K, 3.5M
<Axis scale="y" side={3} values={fmtSuffix('%')} />          // 42%
<Axis scale="y" side={3} values={fmtSuffix('°C', 1)} />     // 23.5°C
<Axis scale="x" side={2} values={fmtHourMin({ utc: true })} /> // 14:30
<Axis scale="x" side={2} values={fmtMonthName()} />          // Jan, Feb, ...
<Axis scale="x" side={2} values={fmtLabels(['Q1','Q2','Q3','Q4'])} />
```

```tsx
// Right axis with no grid, custom stroke color
<Axis scale="humid" side={1} label="Humidity" values={fmtSuffix('%')} stroke="#3498db" grid={{ show: false }} />
```

**Demos:** `axis-control`, `custom-axis-values`, `axis-autosize`, `axis-indicators`, `time-series`, `multiple-scales`, `log-scales`, `months-time-series`.

---

### `<Band>`

Fills the region between two series within the same group. Renderless — returns `null`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `[number, number]` | — | Series indices `[upper, lower]` **(required)** |
| `group` | `number` | — | Group index containing both series **(required)** |
| `fill` | `string` | — | Fill color for the band |
| `dir` | `-1 \| 0 \| 1` | `0` | -1=below only, 0=between (both sides), 1=above only |

```tsx
import { Band } from 'uplot-plus';

<Chart data={data}>
  <Scale id="x" auto ori={0} dir={1} />
  <Scale id="y" auto ori={1} dir={1} />
  <Axis scale="x" side={2} />
  <Axis scale="y" side={3} />
  <Series group={0} index={0} yScale="y" stroke="blue" label="Upper" />
  <Series group={0} index={1} yScale="y" stroke="blue" label="Lower" />
  <Band series={[0, 1]} group={0} fill="rgba(100,150,255,0.2)" />
</Chart>
```

**Demos:** `high-low-bands`, `bars-grouped-stacked`.

---

## UI Components

### `<Legend>`

Interactive legend with live cursor values and click-to-toggle series visibility. Uses `useSyncExternalStore` for reactive updates. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `true` | Visibility |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Position relative to chart |
| `className` | `string` | — | CSS class name |

- Shows a colored swatch + label for each series
- Displays the y-value at the cursor position in real-time
- Click a series item to toggle its visibility

```tsx
import { Legend } from 'uplot-plus';

<Chart width={800} height={400} data={data}>
  {/* ... scales, axes, series with labels ... */}
  <Legend position="bottom" />
</Chart>
```

**Demos:** `legend`.

---

### `<Tooltip>`

Floating tooltip at cursor position showing series values. Auto-flips when near chart edges. Uses `useSyncExternalStore` for reactive updates. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `true` | Visibility |
| `className` | `string` | — | CSS class name |
| `children` | `(data: TooltipData) => ReactNode` | — | Custom render function |
| `offset` | `{ x?: number; y?: number }` | `{ x: 12, y: -12 }` | Offset from cursor (CSS px) |

**`TooltipData`** (passed to custom render):

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number \| null` | X value at cursor |
| `xLabel` | `string` | Formatted x value |
| `items` | `TooltipItem[]` | Series values at cursor |
| `left` | `number` | Cursor CSS X position |
| `top` | `number` | Cursor CSS Y position |

**`TooltipItem`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Series label |
| `value` | `number \| null` | Y value |
| `color` | `string` | Series stroke color |
| `group` | `number` | Group index |
| `index` | `number` | Series index |

```tsx
import { Tooltip } from 'uplot-plus';

// Default tooltip
<Tooltip />

// Custom render
<Tooltip>
  {(data) => (
    <div style={{ background: '#fff', padding: 8, borderRadius: 4 }}>
      <strong>{data.xLabel}</strong>
      {data.items.map(item => (
        <div key={item.label} style={{ color: item.color }}>
          {item.label}: {item.value?.toFixed(2)}
        </div>
      ))}
    </div>
  )}
</Tooltip>
```

**Demos:** `tooltips`, `tooltips-closest`, `cursor-tooltip`.

---

## Annotation Components

Declarative annotation components — place inside `<Chart>`. Each uses `useDrawHook()` internally to draw on the persistent canvas layer. All are renderless (return `null`).

### `<HLine>`

Horizontal line at a y-data-value.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | Y data value **(required)** |
| `yScale` | `string` | `'y'` | Y-axis scale id |
| `stroke` | `string` | `'red'` | Line color |
| `width` | `number` | `1` | Line width (CSS px) |
| `dash` | `number[]` | — | Dash pattern |
| `label` | `string` | — | Text label at left edge |
| `labelFont` | `string` | `'11px sans-serif'` | Label font |

```tsx
<HLine value={65} yScale="y" stroke="#e74c3c" dash={[6, 4]} label="Threshold: 65" />
```

### `<VLine>`

Vertical line at an x-data-value.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | X data value **(required)** |
| `xScale` | `string` | `'x'` | X-axis scale id |
| `stroke` | `string` | `'red'` | Line color |
| `width` | `number` | `1` | Line width (CSS px) |
| `dash` | `number[]` | — | Dash pattern |
| `label` | `string` | — | Text label at top |
| `labelFont` | `string` | `'11px sans-serif'` | Label font |

```tsx
<VLine value={100} xScale="x" stroke="#8e44ad" dash={[4, 4]} label="Event" />
```

### `<Region>`

Shaded region between two y-data-values.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `yMin` | `number` | — | Lower y value **(required)** |
| `yMax` | `number` | — | Upper y value **(required)** |
| `yScale` | `string` | `'y'` | Y-axis scale id |
| `fill` | `string` | `'rgba(255,0,0,0.1)'` | Fill color |
| `stroke` | `string` | — | Border stroke color |
| `strokeWidth` | `number` | — | Border stroke width |
| `dash` | `number[]` | — | Border dash pattern |

```tsx
<Region yMin={40} yMax={60} yScale="y" fill="rgba(46,204,113,0.12)" />
```

### `<AnnotationLabel>`

Text label at data coordinates.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `x` | `number` | — | X data value **(required)** |
| `y` | `number` | — | Y data value **(required)** |
| `text` | `string` | — | Label text **(required)** |
| `xScale` | `string` | `'x'` | X-axis scale id |
| `yScale` | `string` | `'y'` | Y-axis scale id |
| `fill` | `string` | `'#000'` | Text color |
| `font` | `string` | `'12px sans-serif'` | Font |
| `align` | `CanvasTextAlign` | `'left'` | Text alignment |
| `baseline` | `CanvasTextBaseline` | `'bottom'` | Text baseline |

```tsx
<AnnotationLabel x={50} y={65} text="Alert zone" fill="#e74c3c" />
```

**Combined example:**

```tsx
import { HLine, VLine, Region, AnnotationLabel } from 'uplot-plus';

<Chart width={800} height={400} data={data}>
  <Scale id="x" auto ori={0} dir={1} />
  <Scale id="y" ori={1} dir={1} auto={false} min={10} max={90} />
  <Axis scale="x" side={2} />
  <Axis scale="y" side={3} />
  <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2} />
  <Region yMin={65} yMax={90} yScale="y" fill="rgba(231, 76, 60, 0.08)" />
  <HLine value={65} yScale="y" stroke="#e74c3c" width={2} dash={[6, 4]} label="Threshold: 65" />
  <VLine value={100} xScale="x" stroke="#8e44ad" dash={[4, 4]} />
  <AnnotationLabel x={50} y={65} text="Alert zone" fill="#e74c3c" />
</Chart>
```

Imperative helpers are also available for custom draw hooks: `drawHLine`, `drawVLine`, `drawLabel`, `drawRegion`. See the `annotations` demo for this approach.

**Demos:** `draw-hooks` (declarative `<HLine>` + `<Region>`), `annotations` (imperative helpers).

---

### `<Timeline>`

Horizontal lanes of colored event spans. Each lane is a category, each segment is a time range. Uses `useDrawHook` to draw on the persistent canvas layer. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lanes` | `TimelineLane[]` | — | Lane definitions **(required)** |
| `laneHeight` | `number` | `24` | Height of each lane (CSS px) |
| `gap` | `number` | `2` | Gap between lanes (CSS px) |
| `scaleId` | `string` | `'x'` | Which x-scale to use |

**`TimelineLane`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Lane label (drawn on the left) |
| `segments` | `TimelineSegment[]` | Segments in this lane |

**`TimelineSegment`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `start` | `number` | — | Start value in x-scale units **(required)** |
| `end` | `number` | — | End value in x-scale units **(required)** |
| `color` | `string` | `'#4dabf7'` | Fill color |
| `label` | `string` | — | Label drawn inside segment (if it fits) |

```tsx
import { Chart, Scale, Axis, Timeline } from 'uplot-plus';

const lanes = [
  { label: 'API', segments: [
    { start: 0, end: 4, color: '#4caf50', label: 'OK' },
    { start: 4, end: 6, color: '#f44336', label: 'Down' },
    { start: 6, end: 24, color: '#4caf50', label: 'OK' },
  ]},
  { label: 'DB', segments: [
    { start: 0, end: 24, color: '#4caf50', label: 'OK' },
  ]},
];

<Chart width={800} height={200} data={[{ x: [0, 24], series: [] }]}>
  <Scale id="x" auto ori={0} dir={1} />
  <Axis scale="x" side={2} label="Hour" />
  <Timeline lanes={lanes} laneHeight={30} gap={4} />
</Chart>
```

**Demos:** `timeline-discrete`.

---

## Standalone Components

### `<ZoomRanger>`

Overview mini-chart with a draggable selection window. The selection controls the zoom range of a linked detail chart via the `onRangeChange` callback. Used **outside** `<Chart>` — it creates its own internal Chart.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | — | Width in CSS pixels **(required)** |
| `height` | `number` | — | Height in CSS pixels **(required)** |
| `data` | `ChartData` | — | Data to render **(required)** |
| `onRangeChange` | `(min, max) => void` | — | Called when selection changes |
| `initialRange` | `[number, number]` | `[25%, 75%]` | Initial selection as data values |
| `className` | `string` | — | CSS class for wrapper |
| `colors` | `string[]` | auto | Series colors (one per series in group 0) |
| `grips` | `boolean` | `false` | Show grip handles on selection edges |

**Interactions:**

- Drag inside selection to move it
- Drag edges to resize
- Click outside selection to center it there

```tsx
import { Chart, ZoomRanger, Scale, Series, Axis } from 'uplot-plus';

const [range, setRange] = useState<[number, number] | null>(null);

<ZoomRanger
  width={800}
  height={80}
  data={data}
  onRangeChange={(min, max) => setRange([min, max])}
/>

<Chart width={800} height={300} data={data}>
  <Scale id="x" auto ori={0} dir={1} min={range?.[0]} max={range?.[1]} />
  <Scale id="y" auto ori={1} dir={1} />
  <Axis scale="x" side={2} />
  <Axis scale="y" side={3} />
  <Series group={0} index={0} yScale="y" stroke="#3498db" />
</Chart>
```

**Demos:** `zoom-ranger`, `zoom-ranger-grips`, `zoom-ranger-xy`.

---

### `<Sparkline>`

Compact inline chart for tables and dashboards. No axes, no interaction, no legend. Wraps `<Chart>` internally with hidden axes and `pointerEvents: 'none'`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ChartData` | — | Single group, single series **(required)** |
| `width` | `number` | `150` | Width (CSS px) |
| `height` | `number` | `30` | Height (CSS px) |
| `stroke` | `ColorValue` | `'#03a9f4'` | Line/bar color |
| `fill` | `ColorValue` | — | Fill color |
| `lineWidth` | `number` | `1` | Line width (CSS px) |
| `paths` | `PathBuilder` | `linear()` | Path builder (pass `bars()` for bar sparklines) |
| `fillTo` | `number` | — | Fill target value (e.g. `0` for bars) |
| `className` | `string` | — | CSS class for wrapper div |

```tsx
import { Sparkline, bars, withAlpha } from 'uplot-plus';

// Line sparkline
<Sparkline data={priceData} stroke="#03a9f4" fill="#b3e5fc" />

// Bar sparkline
<Sparkline data={volumeData} width={120} height={28} paths={bars()} fillTo={0} stroke="#2980b9" />

// In a table
<table>
  <tr>
    <td>AAPL</td>
    <td><Sparkline data={aaplData} stroke="#4caf50" fill={withAlpha('#4caf50', 0.15)} /></td>
  </tr>
</table>
```

**Demos:** `sparklines`, `sparklines-bars`.

---

### `<ResponsiveChart>`

Auto-sizing chart wrapper. Measures its container via `ResizeObserver` and passes the measured width/height to an internal `<Chart>`. SSR-safe.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minWidth` | `number` | `100` | Minimum width (CSS px) |
| `minHeight` | `number` | `100` | Minimum height (CSS px) |
| `aspectRatio` | `number` | — | If set, `height = width / aspectRatio` |
| `initialHeight` | `number` | `300` | Height when container height is auto |
| *...all other `ChartProps`* | | | Except `width` and `height` |

The container `<div>` takes `width: 100%`. If `aspectRatio` is set, height is computed from width; otherwise height comes from the container or `initialHeight`.

```tsx
import { ResponsiveChart, Scale, Series, Axis } from 'uplot-plus';

// Fills parent, maintains 16:9
<div style={{ width: '100%' }}>
  <ResponsiveChart data={data} aspectRatio={16/9}>
    <Scale id="x" auto ori={0} dir={1} />
    <Scale id="y" auto ori={1} dir={1} />
    <Axis scale="x" side={2} />
    <Axis scale="y" side={3} />
    <Series group={0} index={0} yScale="y" stroke="red" />
  </ResponsiveChart>
</div>
```

**Demos:** `resize-demo`.
