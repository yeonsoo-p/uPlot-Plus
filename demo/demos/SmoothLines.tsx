import React from 'react';
import { Chart, Scale, Series, Axis, linear, monotoneCubic, catmullRom } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 30;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.3) * 25 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y, y, y] }];
}

export default function SmoothLines() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Index" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Linear" paths={linear()} />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Monotone Cubic" paths={monotoneCubic()} />
      <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="Catmull-Rom" paths={catmullRom()} />
    </Chart>
  );
}
