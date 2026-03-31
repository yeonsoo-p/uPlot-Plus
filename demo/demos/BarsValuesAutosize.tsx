import React, { useMemo } from 'react';
import { Chart, Scale, Series, bars } from 'uplot-plus';
import type { DrawCallback } from 'uplot-plus';

export default function BarsValuesAutosize() {
  const values = useMemo(() => Array.from({ length: 10 }, () => Math.round(Math.random() * 80 + 10)), []);

  const data = useMemo(() => {
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
      <Chart width={800} height={400} data={data} onDraw={onDraw} xlabel="Category" ylabel="Value">
        <Scale id="y" min={0} max={100} />
        <Series
          group={0}
          index={0}
          stroke="#2980b9"
          label="Sales"
          paths={bars()}
        />
      </Chart>
    </div>
  );
}
