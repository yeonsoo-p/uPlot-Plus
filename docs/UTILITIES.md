# Utility Reference

Helper functions exported by uPlot+ for axis formatting,
colors, data transforms, and coordinate math.

## Axis Value Formatters

Pre-built formatters for common axis label patterns. Each
returns an `AxisValueFormatter` compatible with the
`<Axis values={...}>` prop.

```tsx
import { fmtCompact, fmtSuffix, fmtPrefix, fmtWrap, fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels } from 'uplot-plus';
```

### `fmtCompact(opts?: { decimals?: number })`

Format numbers with SI suffixes: `1200` → `"1.2K"`,
`2500000` → `"2.5M"`. Handles negative values and zero.

```tsx
<Axis scale="y" values={fmtCompact()} />           // 1.2K, 3.5M
<Axis scale="y" values={fmtCompact({ decimals: 2 })} />  // 1.20K
```

### `fmtSuffix(suffix: string, decimals?: number)`

Append a suffix to each formatted value.

```tsx
<Axis scale="y" values={fmtSuffix('%')} />         // 42%
<Axis scale="y" values={fmtSuffix('°C', 1)} />    // 23.5°C
```

### `fmtPrefix(prefix: string, decimals?: number)`

Prepend a prefix to each formatted value.

```tsx
<Axis scale="y" values={fmtPrefix('$')} />         // $42
<Axis scale="y" values={fmtPrefix('$', 2)} />      // $42.00
```

### `fmtWrap(prefix: string, suffix: string, decimals?: number)`

Wrap each value with a prefix and suffix.

```tsx
<Axis scale="y" values={fmtWrap('$', 'M')} />      // $42M
<Axis scale="y" values={fmtWrap('(', ')')} />       // (42)
```

### `fmtHourMin(opts?: { utc?: boolean })`

Format unix timestamps (seconds) as `HH:MM`.

```tsx
<Axis scale="x" values={fmtHourMin()} />               // 14:30
<Axis scale="x" values={fmtHourMin({ utc: true })} />  // 14:30 (UTC)
```

### `fmtMonthName(opts?: { utc?: boolean; format?: 'short' | 'long' })`

Format unix timestamps (seconds) as month names.

```tsx
<Axis scale="x" values={fmtMonthName()} />                     // Jan, Feb, ...
<Axis scale="x" values={fmtMonthName({ format: 'long' })} />   // January, February, ...
```

### `fmtDateStr(opts?: Intl.DateTimeFormatOptions & { tz?: string })`

Format unix timestamps (seconds) using arbitrary `Intl.DateTimeFormat` options.

```tsx
<Axis scale="x" values={fmtDateStr({ year: 'numeric', month: 'short', day: 'numeric' })} />
```

### `fmtLabels(labels: readonly string[], offset?: number)`

Map numeric indices to labels from an array. Useful for categorical/ordinal axes.

```tsx
<Axis scale="x" values={fmtLabels(['Q1', 'Q2', 'Q3', 'Q4'])} />
<Axis scale="x" values={fmtLabels(['Mon', 'Tue', 'Wed'], 1)} />  // offset by 1
```

## Color Utilities

```tsx
import { fadeGradient, withAlpha, palette } from 'uplot-plus';
```

### `fadeGradient(color: string, fromAlpha?: number, toAlpha?: number)`

Create a vertical linear gradient that fades from one
opacity to another. Returns a `GradientConfig` for the
`<Series fill={...}>` prop. Supports hex (`#rgb`,
`#rrggbb`) and `rgb()`/`rgba()` color strings.

```tsx
<Series fill={fadeGradient('#3498db')} />                  // 0.8 → 0.0
<Series fill={fadeGradient('#e74c3c', 1.0, 0.2)} />       // 1.0 → 0.2
```

### `withAlpha(color: string, alpha: number)`

Return a CSS color string with a new alpha value. Useful for matching fill to stroke.

```tsx
<Series stroke="#2980b9" fill={withAlpha('#2980b9', 0.1)} />
```

### `palette(n: number, saturation?: number, lightness?: number)`

Generate N visually distinct colors using HSL golden-angle rotation.

```tsx
const colors = palette(5);                    // 5 distinct colors
const muted = palette(5, 40, 60);            // lower saturation, higher lightness
```

## Data Utilities

```tsx
import { stackGroup, alignData, lttb, lttbGroup } from 'uplot-plus';
```

### `stackGroup(group: XGroup, seriesIndices?: number[], groupIdx?: number)`

Compute cumulative sums for stacked area/bar charts.
Returns a new `XGroup` with stacked y-values and
auto-generated `BandConfig[]` for fills between layers.

```tsx
import { stackGroup, Band } from 'uplot-plus';

const raw = { x: [1, 2, 3], series: [[10, 20, 30], [5, 10, 15]] };
const { group, bands } = stackGroup(raw);

<Chart data={[group]}>
  {bands.map((b, i) => <Band key={i} {...b} />)}
</Chart>
```

### `alignData(datasets: [ArrayLike<number>, ArrayLike<number | null>][])`

Align multiple datasets with different x-values to a
common x-axis. Merges all unique x-values and fills gaps
with `null`. Returns `ChartData` with one group containing
all aligned series.

```tsx
import { alignData } from 'uplot-plus';

const aligned = alignData([
  [[1, 2, 3], [10, 20, 30]],
  [[2, 3, 4], [15, 25, 35]],
]);
// Result: x=[1,2,3,4], series=[[10,20,30,null], [null,15,25,35]]
```

### `lttb(xData, yData, targetPoints)`

Largest Triangle Three Buckets downsampling. Reduces a dataset to
`targetPoints` while preserving visual shape. Null values create
logical gaps — contiguous non-null runs are downsampled independently
with proportional bucket allocation.

```tsx
import { lttb } from 'uplot-plus';

const { indices, x, y } = lttb(xValues, yValues, 500);
// indices: Uint32Array of selected indices into the original arrays
// x: Float64Array of downsampled x values
// y: (number | null)[] of downsampled y values (null gaps preserved)
```

### `lttbGroup(group, targetPoints)`

Downsample an entire `XGroup`, applying LTTB to each series against
the shared x-axis. Uses the union of selected indices across all
series to preserve x-alignment.

```tsx
import { lttbGroup } from 'uplot-plus';

const downsampled = lttbGroup(group, 500);
// Returns a new XGroup with downsampled x and series arrays
```

## Scale Utilities

Low-level coordinate conversion for custom draw hooks. Prefer the
orientation-aware helpers (`valToPx`, `projectPoint`, `scaleAxis`) — they work
correctly on transposed charts, whereas `valToPos` requires the caller to know
which plot-box dimension the scale maps to.

```tsx
import { valToPos, posToVal, valToPx, projectPoint, scaleAxis } from 'uplot-plus';
```

### `valToPx(val: number, scale: ScaleState, plotBox: BBox)`

Convert a data value to a CSS pixel position along the scale's own axis.
Picks `plotBox.width/left` for horizontal scales and `plotBox.height/top` for
vertical ones automatically.

```tsx
const pos = valToPx(dataValue, scale, plotBox);
```

### `projectPoint(xScale, yScale, xVal, yVal, plotBox)`

Map an `(xVal, yVal)` data pair to screen-space `{px, py}`, handling orientation
swaps. When `xScale.ori` is `Vertical` (a transposed chart), the x data value
lands on screen Y and the y data value lands on screen X.

```tsx
const { px, py } = projectPoint(xScale, yScale, xVal, yVal, plotBox);
```

### `scaleAxis(scale: ScaleState, plotBox: BBox)`

Return `{ dim, off }` for the plot-box dimension and offset the scale maps to
— useful when you still want to call `valToPos` directly but need the axis
lookup done for you.

```tsx
const { dim, off } = scaleAxis(scale, plotBox);
const px = valToPos(val, scale, dim, off);
```

### `valToPos(val: number, scale: ScaleState, dim: number, off: number)`

Convert a data value to a CSS pixel position within a given dimension.
Orientation-blind — use `valToPx` unless you already know `(dim, off)`.

```tsx
const px = valToPos(dataValue, scale, plotBox.width, plotBox.left);
```

### `posToVal(pos: number, scale: ScaleState, dim: number, off: number)`

Convert a CSS pixel position back to a data value.

```tsx
const val = posToVal(mouseX, scale, plotBox.width, plotBox.left);
```

## Theme Presets

```tsx
import { THEME_DEFAULTS, DARK_THEME } from 'uplot-plus';
```

### `THEME_DEFAULTS`

The fully resolved default theme (`ResolvedTheme`) — every draw
function reads from this as the baseline. Contains 40+ properties
covering axes, grid, cursor, selection, series palette, candlestick,
box-whisker, annotations, overlay panels, and zoom ranger.

### `DARK_THEME`

A partial `ChartTheme` preset for dark backgrounds. Pass it to
`<ThemeProvider>` or the `Chart.theme` prop.

```tsx
<ThemeProvider theme={DARK_THEME}>
  <Chart data={data}>…</Chart>
</ThemeProvider>
```
