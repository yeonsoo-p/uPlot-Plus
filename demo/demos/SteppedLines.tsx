import React from 'react';
import { Chart, Scale, Series, Axis, stepped } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 40;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.2) * 30 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y, y, y] }];
}

export default function SteppedLines() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Index" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Step After (default)" paths={stepped(1)} />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Step Before" paths={stepped(-1)} />
      <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="Mid Step" paths={stepped(0)} />
    </Chart>
  );
}
