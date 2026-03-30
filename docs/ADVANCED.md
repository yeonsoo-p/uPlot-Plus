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

Callbacks are separate from the action map — they fire alongside actions, not instead of them. Use `return false` in `onDblClick` or `onSelect` to prevent the associated action.

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

Access the chart store from a child component of `<Chart>`. For building custom sub-components that need direct store access.

```tsx
import { useChart } from 'uplot-plus';

function CustomControl() {
  const store = useChart();
  return <button onClick={() => store.toggleSeries(0, 0)}>Toggle</button>;
}
```

### `useDrawHook()` / `useCursorDrawHook()`

Register custom Canvas 2D draw callbacks from child components. `useDrawHook` draws on the persistent layer (after series). `useCursorDrawHook` draws on the cursor overlay (redrawn every frame).

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

### `useStreamingData()`

Sliding-window data management for real-time charts:

```tsx
import { useStreamingData } from 'uplot-plus';

const { data, push, pushGroup, start, stop, fps } = useStreamingData(initialData, {
  window: 1000,
  batchSize: 10,
});

push([newX], [newY1], [newY2]);
pushGroup(1, [newX], [newY1]); // push to specific group
```
