import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, bars } from '../../src';
import type { ChartData, DrawCallback } from '../../src';

export default function BarsValuesAutosize() {
  const values = useMemo(() => Array.from({ length: 10 }, () => Math.round(Math.random() * 80 + 10)), []);

  const data: ChartData = useMemo(() => {
    const x = Array.from({ length: values.length }, (_, i) => i + 1);
    return [{ x, series: [values] }];
  }, [values]);

  // Draw value labels above each bar
  const onDraw: DrawCallback = ({ ctx, valToX, valToY }) => {
    ctx.fillStyle = '#333';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v == null) continue;
      const xVal = i + 1; // x data values are 1-indexed
      const cx = valToX(xVal);
      const cy = valToY(v, 'y');
      if (cx == null || cy == null) continue;
      ctx.fillText(String(v), cx, cy - 4);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Bar chart with value labels drawn above each bar using the <code>onDraw</code> hook.
      </p>
      <Chart width={800} height={400} data={data} onDraw={onDraw}>
        <Scale id="x" />
        <Scale id="y" min={0} max={100} />
        <Axis scale="x" label="Category" />
        <Axis scale="y" label="Value" />
        <Series
          group={0}
          index={0}
          yScale="y"
          stroke="#2980b9"
          fill="rgba(41, 128, 185, 0.6)"
          width={0}
          label="Sales"
          paths={bars()}
          fillTo={0}
        />
      </Chart>
    </div>
  );
}
