# Component Reference

Complete props reference for all uPlot+ React components,
organized by hierarchy.

## Component Hierarchy

```text
<ThemeProvider>                   Sets CSS custom properties for descendant charts
└── <Chart>                      Root container (canvas + store)
    ├── <Scale>                  Scale registration (renderless)
    ├── <Series>                 Data series registration (renderless)
    ├── <Axis>                   Axis rendering (renderless)
    ├── <Band>                   Fill between two series (renderless)
    ├── <Legend>                  Interactive legend (HTML overlay)
    ├── <FloatingLegend>         Draggable/cursor-following legend panel (HTML overlay)
    ├── <HoverLabel>             Nearest series info on hover delay (HTML overlay)
    ├── <Tooltip>                Cursor tooltip (HTML overlay)
    ├── <Timeline>               Event lanes (canvas draw hook)
    ├── <BoxWhisker>             Box-and-whisker plot (canvas draw hook)
    ├── <Candlestick>            OHLC candlestick (canvas draw hook, auto-registers series)
    ├── <Heatmap>                2D colored grid (canvas draw hook)
    ├── <Vector>                 Directional arrows overlay (canvas draw hook)
    ├── <HLine>                  Horizontal line annotation (canvas draw hook)
    ├── <VLine>                  Vertical line annotation (canvas draw hook)
    ├── <Region>                 Shaded region annotation (canvas draw hook)
    └── <AnnotationLabel>        Text label annotation (canvas draw hook)

<ZoomRanger>                     Overview mini-chart (standalone, wraps Chart internally)
<Sparkline>                      Compact inline chart (standalone, wraps Chart internally)
```

**Renderless components** return `null` — they register
configuration with the chart store via `useEffect` and do not
produce DOM elements. Canvas operations are imperative, not
driven by React re-renders.

**Draw hook components** (Timeline, annotations) use
`useDrawHook()` to register a canvas draw callback that runs
on every redraw.

**Standalone components** wrap `<Chart>` internally and can
be used independently.

---

## Theming

### `<ThemeProvider>`

Sets CSS custom properties on a wrapper `<div>` so descendant
`<Chart>` components inherit themed styles. Provides a revision
counter via React context so Charts detect ancestor theme
changes and repaint the canvas.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `theme` | `ChartTheme` | — | Theme overrides **(required)** |
| `children` | `ReactNode` | — | Child elements |

```tsx
import { Chart, Series, ThemeProvider, DARK_THEME } from 'uplot-plus';

// Pre-built dark theme
<ThemeProvider theme={DARK_THEME}>
  <Chart data={data} width={800} height={400} />
</ThemeProvider>

// Custom partial overrides
<ThemeProvider theme={{ axisStroke: '#ccc', seriesColors: ['#e74c3c', '#3498db'] }}>
  <Chart data={data} width={800} height={400} />
</ThemeProvider>
```

**Per-chart theming** (no provider): pass `theme` prop directly on `<Chart>`.

**CSS custom properties** (no provider or prop): set
`--uplot-*` variables on any ancestor element.

**Themeable properties:** `axisStroke`, `gridStroke`,
`titleFill`, `tickFont`, `labelFont`, `titleFont`,
`bandFill`,
`cursor.{stroke,width,dash,pointRadius,pointFill}`,
`select.{fill,stroke,width}`, `seriesColors[]`,
`candlestick.{upColor,downColor}`,
`boxWhisker.{fill,stroke,medianColor,whiskerColor}`,
`vector.color`, `sparkline.stroke`,
`timeline.{labelColor,segmentColor,segmentTextColor}`,
`annotation.{stroke,fill,font,labelFill}`,
`overlay.{fontFamily,fontSize,panelBg,panelBorder,
panelShadow,hiddenOpacity,zIndex,tooltipZIndex}`,
`ranger.{accent,dim}`.

**Demos:** `theme-presets`, `applying-themes`,
`nested-providers`, `component-themes`,
`themed-dashboard`, `system-color-scheme`,
`theme-explorer`.

---

## Core Components

### `<Chart>`

Root container. Creates the canvas, initializes the chart
store, and provides context to all children.

**Smart defaults:** `<Scale>`, `<Axis>`, and `<Series>`
children are all optional. If omitted, Chart auto-creates
x/y scales, bottom/left axes, and one default series per
data slot — `<Chart data={data} />` renders meaningful output
on its own. Auto-filled series get palette colors in
registration order. Pass `autoFillSeries={false}` to opt
out of automatic series; only explicit `<Series>` children
will render. Data accepts three forms: `{ x, y }` (single
series), `[{ x, y }, ...]` (multiple groups), or
`[{ x, series: [...] }, ...]` (full form).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `SizeValue` | — | Width in CSS pixels or `'auto'` to fill container **(required)** |
| `height` | `SizeValue` | — | Height in CSS pixels or `'auto'` to fill container **(required)** |
| `data` | `DataInput` | — | Chart data **(required)** — `{ x, y }`, `[{ x, y }]`, or `[{ x, series }]` |
| `children` | `ReactNode` | — | Scale, Series, Axis, Legend, etc. |
| `className` | `string` | — | CSS class name |
| `minWidth` | `number` | — | Min width in CSS pixels (when `width='auto'`) |
| `minHeight` | `number` | — | Min height in CSS pixels (when `height='auto'`) |
| `title` | `string` | — | Title drawn on canvas above the plot area |
| `xlabel` | `string` | `'X Axis'` | Label for auto-generated x-axis |
| `ylabel` | `string` | `'Y Axis'` | Label for auto-generated y-axis |
| `ariaLabel` | `string` | — | Accessible label (overrides title for screen readers) |
| `autoFillSeries` | `boolean` | `true` | Auto-render every data slot lacking an explicit `<Series>`. Set `false` for explicit-only mode. |
| `pxRatio` | `number` | `devicePixelRatio` | Device pixel ratio override |
| `syncCursorKey` | `string` | — | Cursor sync — charts with the same key share cursor position |
| `syncScaleKey` | `string` | — | Scale-range sync — charts and ZoomRangers with the same key share zoom state |
| `theme` | `ChartTheme` | — | Per-chart theme overrides (sets CSS custom properties on the wrapper) |
| `locale` | `string` | browser locale | BCP 47 locale for number/date formatting |
| `timezone` | `string` | browser TZ | IANA timezone for time-axis labels |
| `actions` | `ActionList` | `DEFAULT_ACTIONS` | Gesture→reaction overrides (merged with defaults) |
| `onDraw` | `DrawCallback` | — | Custom draw on persistent layer |
| `onCursorDraw` | `CursorDrawCallback` | — | Custom draw on cursor overlay |
| `onClick` | `(info: ChartEventInfo) => void` | — | Click within plot area |
| `onContextMenu` | `(info: ChartEventInfo) => void` | — | Right-click within plot area |
| `onDblClick` | `(info: ChartEventInfo) => boolean \| void` | — | Double-click (return `false` to prevent zoom reset) |
| `onCursorMove` | `(info: ChartEventInfo) => void` | — | Cursor moves over plot |
| `onCursorLeave` | `() => void` | — | Cursor leaves plot area |
| `onScaleChange` | `ScaleChangeCallback` | — | Scale range changes (zoom, pan) |
| `onSelect` | `(sel: SelectEventInfo) => boolean \| void` | — | Drag selection completes (return `false` to prevent zoom) |

**`actions`** — array of `[ActionKey, ReactionValue]` tuples,
merged with `DEFAULT_ACTIONS` internally. Override specific
gestures without repeating defaults:

```tsx
// Wheel zoom on both axes + disable dblclick reset
<Chart actions={[['wheel', 'zoomXY'], ['leftDblclick', 'none']]} />

// Shift+wheel zooms Y, alt+wheel zooms X, plain wheel disabled
<Chart actions={[['shiftWheel', 'zoomY'], ['altWheel', 'zoomX'], ['wheel', 'none']]} />

// Focus mode via hover action
import { focus } from 'uplot-plus';
<Chart actions={[['hover', focus(0.15)]]} />

// Custom function matcher → function reaction
<Chart actions={[
  [(e, ctx) => e instanceof MouseEvent && e.shiftKey, (store, e, ctx) => { /* custom */ }],
]} />
```

Built-in action strings: `{mod?}{Button}{Type}` — e.g.
`leftDrag`, `shiftMiddleClick`, `ctrlRightDrag`, `wheel`,
`shiftWheel`, `xGutterDrag`, `yGutterDrag`, `hover`,
`touchDrag`, `pinch`.

Built-in reaction strings: `zoomX`, `zoomY`, `zoomXY`,
`panX`, `panY`, `panXY`, `reset`, `none`.

```tsx
import { Chart } from 'uplot-plus';

// Smallest possible chart — auto-fill renders the y-series with palette[0]
<Chart width={800} height={400} data={{ x, y }} />

// Add explicit children only for the slots you want to customize.
import { Scale, Series, Axis } from 'uplot-plus';

<Chart width={800} height={400} data={data}>
  <Scale id="x" />
  <Scale id="y" />
  <Axis scale="x" label="X-Axis" />
  <Axis scale="y" label="Y-Axis" />
  <Series stroke="#e74c3c" width={2} label="Series A" />
</Chart>
```

**Demos:** All demos use Chart. Key examples: `minimal-chart`,
`simple-data`, `basic-line`, `zoom-wheel`, `sync-cursor`,
`draw-hooks`.

---

### `<Scale>`

Registers a scale with the chart store. Scales define how
data values map to pixel positions. Renderless — returns
`null`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Unique scale identifier **(required)** |
| `auto` | `boolean` | `true` | Auto-range from data |
| `ori` | `Orientation` | `Horizontal` for `"x"`, `Vertical` otherwise | Scale orientation. `horizontalBars()` flips this at render time for its series' scales; set explicitly if you need a custom axis orientation. |
| `dir` | `Direction` | `Forward` | `Forward` = normal, `Backward` = reversed |
| `distr` | `Distribution` | `Linear` | Scale distribution (see table below) |
| `log` | `number` | `10` | Log base when `distr={Distribution.Log}` |
| `asinh` | `number` | `1` | Asinh linear threshold when `distr={Distribution.Asinh}` |
| `min` | `number \| null` | — | Fixed min (overrides auto) |
| `max` | `number \| null` | — | Fixed max (overrides auto) |
| `time` | `boolean` | `false` | Time-based scale (unix timestamps) |
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

| Value | Type | Use case |
| --- | --- | --- |
| `Distribution.Linear` | Linear | Default. Equal spacing. |
| `Distribution.Ordinal` | Ordinal | Categorical data (equal spacing by index). |
| `Distribution.Log` | Log | Exponential data. Set `log` for base (default 10). |
| `Distribution.Asinh` | Asinh | Data spanning negative-to-positive with linear region near zero. |

```tsx
// Linear y-scale with auto-ranging (all defaults)
<Scale id="y" />

// Log scale (base 10)
<Scale id="y" distr={Distribution.Log} log={10} />

// Fixed range with soft limits
<Scale id="y" range={{ min: { soft: 0, mode: 1 } }} />
```

**Demos:** `log-scales`, `log-scales-2`, `asinh-scales`,
`multiple-scales`, `dependent-scales`, `scale-direction`,
`custom-scales`, `scale-padding`, `soft-minmax`,
`nice-scale`, `sync-y-zero`.

---

### `<Series>`

Registers a data series with the chart store. Each series
references a `(group, index)` tuple in the data and maps to
a y-scale. Renderless — returns `null`.

**Smart defaults:** `group` and `index` are both optional. A
bare `<Series />` (no slot props) auto-bumps to the next
unclaimed `(group, index)` slot in data order. Provide either
to pin a slot — `<Series index={2} />` is slot `(0, 2)`. When
`<Chart autoFillSeries>` is on (the default), unreferenced
data slots get auto-filled with palette colors; declaring an
explicit `<Series>` simply *replaces* the fill at that slot.

`yScale` defaults to `'y'`, `stroke` is auto-assigned from a
15-color palette based on registration order, and `show`
defaults to `true`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `group` | `number` | auto-bump | Data group index. Omit to auto-pick the next unclaimed slot. |
| `index` | `number` | auto-bump | Series index within group. Omit to auto-pick the next unclaimed slot. |
| `yScale` | `string` | `'y'` | Y-axis scale key |
| `show` | `boolean` | `true` | Visibility |
| `label` | `string` | — | Legend/tooltip label |
| `stroke` | `ColorValue` | — | Line color (string or gradient) |
| `fill` | `ColorValue` | — | Fill color (string or gradient) |
| `width` | `number` | — | Stroke width in CSS pixels |
| `alpha` | `number` | `1` | Opacity 0–1 |
| `paths` | `PathBuilder` | `lttbLinear()` | Path builder function (internal default: LTTB downsampling + pixel decimation) |
| `points` | `PointsConfig` | — | Point marker config |
| `dash` | `number[]` | — | Dash pattern |
| `cap` | `CanvasLineCap` | — | Line cap style |
| `join` | `CanvasLineJoin` | — | Line join style |
| `pxAlign` | `number` | `1` | Pixel alignment (0=none, 1=round) |
| `spanGaps` | `boolean` | `false` | Connect across null gaps |
| `sorted` | `SortOrder` | — | `Ascending`, `Descending`, or `Unsorted` |
| `fillTo` | `number \| (min, max) => number` | — | Fill target value |

**`PointsConfig`:**

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
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

Use the `fadeGradient()` and `withAlpha()` helpers from
`uplot-plus` to create these easily.

**Path builders** (pass to `paths` prop):

| Builder | Import | Use case |
| --- | --- | --- |
| `linear()` | `linear` | Line/area charts (default). Pixel-level decimation. |
| `stepped()` | `stepped` | Step-after, step-before, or mid-step. |
| `bars()` | `bars` | Bar/column charts. |
| `groupedBars()` | `groupedBars` | Side-by-side grouped bars. |
| `stackedBars()` | `stackedBars` | Stacked bar charts. |
| `horizontalBars()` | `horizontalBars` | Horizontal bars (data-axis-swapped). Flips the series' x/y scales to produce bars growing along the x-axis. |
| `monotoneCubic()` | `monotoneCubic` | Smooth curves preserving monotonicity. |
| `catmullRom()` | `catmullRom` | Centripetal Catmull-Rom splines. |
| `points()` | `points` | Scatter plots (points only, no lines). |

```tsx
import { Series, bars, withAlpha, fadeGradient } from 'uplot-plus';

// Line series — slot defaults to (0, 0)
<Series stroke="#e74c3c" width={2} label="Revenue" />

// Bar series
<Series paths={bars()} stroke="#3498db" fill="#3498db80" />

// Area fill with gradient
<Series stroke="#4285f4" fill={fadeGradient('#4285f4')} />

// Dashed line with points
<Series stroke="#888" dash={[6, 4]} points={{ show: true, size: 6 }} />
```

**Demos:** `basic-line`, `area-fill`, `point-styles`,
`dash-patterns`, `bar-chart`, `stepped-lines`,
`smooth-lines`, `fill-to`, `span-gaps`, `sparklines`,
`gradients`.

#### Transposed (horizontal) charts

A series gains a `transposed` flag when it uses the `horizontalBars()` path
builder. At render time this flips the scale orientations for that series:

- The associated **x-scale** becomes `Orientation.Vertical` — its values map to
  screen Y.
- The series' **y-scale** becomes `Orientation.Horizontal` — its values map to
  screen X.

Everything downstream adapts automatically: axes re-derive their sides (auto-side
axes flip between `Bottom`/`Left`), the cursor crosshair and point indicator
project correctly, `<Band>`, annotation helpers, draw hooks via `dc.project()`,
and zoom/pan interactions all follow the scale orientation. Do not share a
scale between a horizontal and a vertical bar series — give each a separate
y-scale. A warning is logged if the same scale is requested in both
orientations.

```tsx
import { Chart, Series, Axis, horizontalBars } from 'uplot-plus';

<Chart data={data}>
  <Series paths={horizontalBars()} stroke="#3498db" />
  <Axis scale="x" />  {/* auto-side: rendered on the Left */}
  <Axis scale="y" />  {/* auto-side: rendered on the Bottom */}
</Chart>
```

---

### `<Axis>`

Registers an axis with the chart store. Axes render tick
marks, labels, and grid lines for a scale. Renderless —
returns `null`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `scale` | `string` | — | Scale key **(required)** |
| `side` | `Side` | `Bottom` for `"x"`, `Left` otherwise | `Side.Top`, `Side.Right`, `Side.Bottom`, `Side.Left` |
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
| --- | --- | --- | --- |
| `show` | `boolean` | `true` (grid/ticks), `false` (border) | Visibility |
| `stroke` | `string` | — | Color |
| `width` | `number` | — | Line width |
| `dash` | `number[]` | — | Dash pattern |
| `size` | `number` | — | Tick mark size (TickConfig only) |

Use the built-in **axis value formatters** for common patterns:

```tsx
import { Axis, fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtLabels } from 'uplot-plus';

<Axis scale="y" values={fmtCompact()} />            // 1.2K, 3.5M
<Axis scale="y" values={fmtSuffix('%')} />          // 42%
<Axis scale="y" values={fmtSuffix('°C', 1)} />     // 23.5°C
<Axis scale="x" values={fmtHourMin({ utc: true })} /> // 14:30
<Axis scale="x" values={fmtMonthName()} />          // Jan, Feb, ...
<Axis scale="x" values={fmtLabels(['Q1','Q2','Q3','Q4'])} />
```

```tsx
// Right axis with no grid, custom stroke color
<Axis scale="humid" side={Side.Right} label="Humidity" values={fmtSuffix('%')} stroke="#3498db" grid={{ show: false }} />
```

**Demos:** `axis-control`, `custom-axis-values`,
`axis-autosize`, `axis-indicators`, `time-series`,
`multiple-scales`, `log-scales`, `months-time-series`.

---

### `<Band>`

Fills the region between two series within the same group.
Renderless — returns `null`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `series` | `[number, number]` | — | Series indices `[upper, lower]` **(required)** |
| `group` | `number` | — | Group index containing both series **(required)** |
| `fill` | `string` | — | Fill color for the band |
| `dir` | `-1 \| 0 \| 1` | `0` | -1=below only, 0=between (both sides), 1=above only |

```tsx
import { Band } from 'uplot-plus';

<Chart data={data}>
  <Scale id="x" />
  <Scale id="y" />
  <Axis scale="x" />
  <Axis scale="y" />
  <Series index={0} stroke="blue" label="Upper" />
  <Series index={1} stroke="blue" label="Lower" />
  <Band series={[0, 1]} group={0} fill="rgba(100,150,255,0.2)" />
</Chart>
```

**Demos:** `high-low-bands`, `bars-grouped`.

---

## UI Components

### `<Legend>`

Interactive legend with live cursor values and click-to-toggle
series visibility. Uses `useSyncExternalStore` for reactive
updates. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
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

### `<FloatingLegend>`

Floating legend panel that can be dragged around the plot area
or follow the cursor. Subscribes only to cursor updates for
performance. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'draggable' \| 'cursor'` | `'draggable'` | Drag to reposition, or follow cursor |
| `position` | `{ x, y } \| 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-right'` | Initial position (draggable) or anchor (cursor) |
| `offset` | `{ x: number; y: number }` | `{ x: 12, y: -12 }` | Offset from cursor (cursor mode only) |
| `idleOpacity` | `number` | `0.3` | Opacity when cursor is outside plot (draggable mode) |
| `show` | `boolean` | `true` | Visibility |
| `className` | `string` | — | CSS class name |

```tsx
import { FloatingLegend } from 'uplot-plus';

// Draggable panel in top-right corner
<FloatingLegend mode="draggable" position="top-right" />

// Follows cursor
<FloatingLegend mode="cursor" offset={{ x: 16, y: -16 }} />
```

**Demos:** `floating-legend`.

---

### `<HoverLabel>`

Shows a small label for the nearest series after a
configurable hover delay. Useful for clean charts that only
show series info on extended hover. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `delay` | `number` | `1000` | Milliseconds before label appears |
| `show` | `boolean` | `true` | Visibility |
| `className` | `string` | — | CSS class name |

```tsx
import { HoverLabel } from 'uplot-plus';

<HoverLabel delay={500} />
```

**Demos:** `hover-label`.

---

### `<Tooltip>`

Floating tooltip at cursor position showing series values.
Auto-flips when near chart edges. Uses
`useSyncExternalStore` for reactive updates. Must be inside
`<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `show` | `boolean` | `true` | Visibility |
| `className` | `string` | — | CSS class name |
| `children` | `(data: TooltipData) => ReactNode` | — | Custom render function |
| `offset` | `{ x?: number; y?: number }` | `{ x: 12, y: -12 }` | Offset from cursor (CSS px) |
| `precision` | `number` | `2` | Max decimal places for the default x label (no effect with custom render) |
| `mode` | `'cursor' \| 'draggable'` | `'cursor'` | Follows cursor vs fixed-position draggable |
| `position` | `PositionPreset \| { x: number; y: number }` | `'top-right'` | Initial position for draggable mode |
| `idleOpacity` | `number` | `0.8` | Opacity when not hovered in draggable mode |

**`TooltipData`** (passed to custom render):

| Field | Type | Description |
| --- | --- | --- |
| `x` | `number \| null` | X value at cursor |
| `xLabel` | `string` | Formatted x value |
| `items` | `TooltipItem[]` | Series values at cursor |
| `left` | `number` | Cursor CSS X position |
| `top` | `number` | Cursor CSS Y position |

**`TooltipItem`:**

| Field | Type | Description |
| --- | --- | --- |
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

**Demos:** `tooltips`, `cursor-tooltip`, `custom-tooltip`.

---

## Annotation Components

Declarative annotation components — place inside `<Chart>`.
Each uses `useDrawHook()` internally to draw on the persistent
canvas layer. All are renderless (return `null`).

### `<HLine>`

Horizontal line at a y-data-value.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
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
| --- | --- | --- | --- |
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
| --- | --- | --- | --- |
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
| --- | --- | --- | --- |
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
  <Scale id="x" />
  <Scale id="y" auto={false} min={10} max={90} />
  <Axis scale="x" />
  <Axis scale="y" />
  <Series stroke="#2980b9" width={2} />
  <Region yMin={65} yMax={90} yScale="y" fill="rgba(231, 76, 60, 0.08)" />
  <HLine value={65} yScale="y" stroke="#e74c3c" width={2} dash={[6, 4]} label="Threshold: 65" />
  <VLine value={100} xScale="x" stroke="#8e44ad" dash={[4, 4]} />
  <AnnotationLabel x={50} y={65} text="Alert zone" fill="#e74c3c" />
</Chart>
```

Imperative helpers are also available for custom draw hooks:
`drawHLine`, `drawVLine`, `drawLabel`, `drawRegion`. See the
`annotations` demo for this approach.

**Demos:** `draw-hooks` (declarative `<HLine>` + `<Region>`),
`annotations` (imperative helpers).

---

### `<Timeline>`

Horizontal lanes of colored event spans. Each lane is a
category, each segment is a time range. Uses `useDrawHook`
to draw on the persistent canvas layer. Must be inside
`<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `lanes` | `TimelineLane[]` | — | Lane definitions **(required)** |
| `laneHeight` | `number` | `24` | Height of each lane (CSS px) |
| `gap` | `number` | `2` | Gap between lanes (CSS px) |
| `scaleId` | `string` | `'x'` | Which x-scale to use |

**`TimelineLane`:**

| Field | Type | Description |
| --- | --- | --- |
| `label` | `string` | Lane label (drawn on the left) |
| `segments` | `TimelineSegment[]` | Segments in this lane |

**`TimelineSegment`:**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
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
  <Scale id="x" />
  <Axis scale="x" label="Hour" />
  <Timeline lanes={lanes} laneHeight={30} gap={4} />
</Chart>
```

**Demos:** `timeline-discrete`.

---

### `<BoxWhisker>`

Box-and-whisker plot with quartiles, whiskers, and median
line. Uses `useDrawHook` to draw on the persistent canvas
layer. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `boxes` | `Array<{ min, q1, median, q3, max }>` | — | Box data, one per category **(required)** |
| `yScale` | `string` | `'y'` | Y-axis scale id |
| `boxWidth` | `number` | `0.5` | Box width as fraction of category spacing |
| `fill` | `string` | `'rgba(52, 152, 219, 0.4)'` | Box fill color |
| `stroke` | `string` | `'#2980b9'` | Box stroke color |
| `medianColor` | `string` | `'#e74c3c'` | Median line color |
| `whiskerColor` | `string` | `'#555'` | Whisker and cap color |

```tsx
import { Chart, Scale, Axis, BoxWhisker, fmtLabels } from 'uplot-plus';

<Chart width={800} height={400} data={chartData}>
  <Scale id="x" auto={false} min={0.5} max={10.5} />
  <Scale id="y" auto={false} min={yMin} max={yMax} />
  <Axis scale="x" label="Category" values={fmtLabels(categoryLabels, 1)} />
  <Axis scale="y" />
  <BoxWhisker boxes={boxes} />
</Chart>
```

**Demos:** `box-whisker`.

---

### `<Candlestick>`

OHLC financial candlestick chart. Reads data from the chart
store (4 series: open, high, low, close). Shares the
`drawRangeBox` rendering primitive with BoxWhisker. Uses
`useDrawHook`. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `group` | `number` | `0` | Data group containing OHLC series |
| `series` | `[number, number, number, number]` | `[0,1,2,3]` | Series indices: [open, high, low, close] |
| `yScale` | `string` | `'y'` | Y-axis scale id |
| `upColor` | `string` | `'#26a69a'` | Color for up candles (close >= open) |
| `downColor` | `string` | `'#ef5350'` | Color for down candles (close < open) |
| `bodyWidth` | `number` | `0.6` | Body width as fraction of available space |
| `wickWidth` | `number` | `1` | Wick width in CSS pixels |

```tsx
import { Chart, Candlestick } from 'uplot-plus';

// Minimal — Candlestick auto-registers hidden OHLC series
<Chart width={800} height={400} data={data} xlabel="Day" ylabel="Price">
  <Candlestick />
</Chart>

// Custom colors via theme
<Chart width={800} height={400} data={data} theme={{ candlestick: { upColor: '#00e676', downColor: '#ff1744' } }}>
  <Candlestick />
</Chart>
```

**Demos:** `candlestick-ohlc`, `component-themes`.

---

### `<Heatmap>`

2D grid of colored cells with configurable color mapping.
Uses `useDrawHook` to draw on the persistent canvas layer.
Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `grid` | `number[][]` | — | 2D array: `grid[row][col]` = intensity **(required)** |
| `xRange` | `[number, number]` | `[0, rows]` | X-axis value range |
| `yRange` | `[number, number]` | `[0, cols]` | Y-axis value range |
| `colorMap` | `(t: number) => string` | blue-cyan-green-yellow-orange-red | Color function (0..1 normalized) |
| `yScale` | `string` | `'y'` | Y-axis scale id |

```tsx
import { Chart, Scale, Axis, Heatmap, fmtSuffix } from 'uplot-plus';

<Chart width={800} height={400} data={chartData}>
  <Scale id="x" auto={false} min={0} max={24} />
  <Scale id="y" auto={false} min={0} max={300} />
  <Axis scale="x" label="Hour" />
  <Axis scale="y" label="Latency" values={fmtSuffix('ms')} />
  <Heatmap grid={grid} xRange={[0, 24]} yRange={[0, 300]} />
</Chart>
```

**Demos:** `heatmap`.

---

### `<Vector>`

Directional arrows overlaid on data points. Arrow size scales
with y-value. Uses `useDrawHook` to draw on the persistent
canvas layer. Must be inside `<Chart>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `directions` | `ArrayLike<number>` | — | Angle per data point in degrees (0=N, 90=E) **(required)** |
| `group` | `number` | `0` | Data group to overlay on |
| `index` | `number` | `0` | Series index for y-positions |
| `color` | `string` | `'#c0392b'` | Arrow color |
| `minSize` | `number` | `4` | Min arrow size (CSS px) |
| `maxSize` | `number` | `10` | Max arrow size (CSS px) |

```tsx
import { Chart, Series, Axis, Vector, fmtSuffix } from 'uplot-plus';

<Chart width={800} height={400} data={chartData} ylabel="Wind Speed (km/h)">
  <Axis scale="x" label="Time (hours)" values={fmtSuffix('h')} />
  <Series label="Speed" dash={[4, 3]} />
  <Vector directions={directions} />
</Chart>
```

**Demos:** `wind-direction`.

---

## Standalone Components

### `<ZoomRanger>`

Overview mini-chart with a draggable selection window. The
selection controls the zoom range of a linked detail chart
via the `onRangeChange` callback. Used **outside**
`<Chart>` — it creates its own internal Chart.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
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
  <Scale id="x" min={range?.[0]} max={range?.[1]} />
  <Scale id="y" />
  <Axis scale="x" />
  <Axis scale="y" />
  <Series stroke="#3498db" />
</Chart>
```

**Demos:** `zoom-ranger`, `zoom-ranger-grips`, `zoom-ranger-xy`.

---

### `<Sparkline>`

Compact inline chart for tables and dashboards. No axes, no
interaction, no legend. Wraps `<Chart>` internally with
hidden axes and `pointerEvents: 'none'`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
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
