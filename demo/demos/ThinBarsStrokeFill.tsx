import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend, bars } from '../../src';
import type { ChartData } from '../../src';

export default function ThinBarsStrokeFill() {
  const data: ChartData = useMemo(() => {
    const n = 15;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y1 = x.map(() => Math.round(Math.random() * 60 + 20));
    const y2 = x.map(() => Math.round(Math.random() * 60 + 20));
    const y3 = x.map(() => Math.round(Math.random() * 60 + 20));
    return [{ x, series: [y1, y2, y3] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Bar chart variations: stroke-only, fill-only, and stroke+fill with different widths.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Item" />
        <Axis scale="y" label="Value" />
        {/* Stroke only */}
        <Series
          group={0}
          index={0}
          yScale="y"
          stroke="#e74c3c"
          width={2}
          label="Stroke Only"
          paths={bars()}
          fillTo={0}
        />
        {/* Fill only */}
        <Series
          group={0}
          index={1}
          yScale="y"
          stroke="transparent"
          fill="rgba(52, 152, 219, 0.6)"
          width={0}
          label="Fill Only"
          paths={bars()}
          fillTo={0}
        />
        {/* Stroke + Fill */}
        <Series
          group={0}
          index={2}
          yScale="y"
          stroke="#27ae60"
          fill="rgba(39, 174, 96, 0.3)"
          width={3}
          label="Stroke + Fill"
          paths={bars()}
          fillTo={0}
        />
        <Legend />
      </Chart>
    </div>
  );
}
