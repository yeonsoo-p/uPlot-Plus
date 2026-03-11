import React from 'react';
import { Chart, Scale, Series, Axis, Tooltip } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  const y3: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.1;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.sin(t + 2) * 30 + 50);
    y3.push(Math.sin(t + 4) * 20 + 50);
  }

  return [{ x, series: [y1, y2, y3] }];
}

export default function Tooltips() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Hover over the chart to see the tooltip with all series values.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Time" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Alpha" />
        <Series group={0} index={1} yScale="y" stroke="#2ecc71" width={2} label="Beta" />
        <Series group={0} index={2} yScale="y" stroke="#3498db" width={2} label="Gamma" />
        <Tooltip />
      </Chart>
    </div>
  );
}
