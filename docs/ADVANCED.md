# Advanced API

## Event Callbacks

All callbacks receive resolved chart data — nearest point, data values, pixel coordinates.

```tsx
<Chart
  data={data} width={800} height={400}
  onClick={(info) => {
    if (info.point) {
      console.log(`Clicked series ${info.point.seriesIdx} at y=${info.point.yVal}`);
    }
  }}
  onContextMenu={(info) => {
    showContextMenu(info.srcEvent, info.point);
  }}
  onDblClick={(info) => {
    return false; // prevent default action (e.g. zoom reset)
  }}
  onSelect={(sel) => {
    // ranges is keyed by scale id — each entry has data-space min/max plus
    // fracStart/fracEnd along the scale's own axis (0..1). left/right are
    // legacy horizontal-width fractions retained for back-compat.
    fetchData(sel.ranges['x'].min, sel.ranges['x'].max);
    return false; // prevent zoom
  }}
  onScaleChange={(scaleId, min, max) => {
    console.log(`Scale ${scaleId}: [${min}, ${max}]`);
  }}
  onCursorMove={(info) => { /* fires on every mouse move */ }}
  onCursorLeave={() => { /* cursor left the plot */ }}
>
```

Callbacks are separate from the action map — they fire
alongside actions, not instead of them. Use `return false`
in `onDblClick` or `onSelect` to prevent the associated
action.

## Controlled Scales

Control zoom and pan declaratively through React state:

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
        <Scale id="x" auto={xRange == null} min={xRange?.[0]} max={xRange?.[1]} />
        <Scale id="y" />
        <Axis scale="x" />
        <Axis scale="y" />
        <Series group={0} index={0} yScale="y" stroke="#e74c3c" />
      </Chart>
    </>
  );
}
```

## Hooks

### `useChart()`

Access the chart store from a child component of `<Chart>`.
For building custom sub-components that need direct store
access.

```tsx
import { useChart } from 'uplot-plus';

function CustomControl() {
  const store = useChart();
  return <button onClick={() => store.toggleSeries(0, 0)}>Toggle</button>;
}
```

### `useDrawHook()` / `useCursorDrawHook()`

Register custom Canvas 2D draw callbacks from child
components. `useDrawHook` draws on the persistent layer
(after series). `useCursorDrawHook` draws on the cursor
overlay (redrawn every frame).

```tsx
import { useDrawHook } from 'uplot-plus';

function ThresholdZone() {
  useDrawHook(({ ctx, plotBox, valToY }) => {
    const y = valToY(65, 'y');
    if (y == null) return;
    ctx.fillStyle = 'rgba(255,0,0,0.1)';
    ctx.fillRect(plotBox.left, y, plotBox.width, plotBox.top + plotBox.height - y);
  });
  return null;
}
```

#### Orientation-aware projection

`valToX` / `valToY` return positions along each scale's own axis, which only
matches screen X/Y when the scale keeps its default orientation (x=Horizontal,
y=Vertical). On transposed charts (anything using `horizontalBars()` or a scale
with an explicit `ori` flip), use `dc.project(xVal, yVal, xScaleId?, yScaleId?)`
instead — it returns screen `{px, py}` with the axis swap already applied:

```tsx
useDrawHook((dc) => {
  const pos = dc.project(xVal, yVal);          // defaults to 'x' / 'y'
  if (pos == null) return;                      // scales not ready
  dc.ctx.fillRect(pos.px - 2, pos.py - 2, 4, 4);
});
```

The same helpers are exported as free functions (`valToPx`, `projectPoint`,
`scaleAxis`) for draw code outside the hook system.
