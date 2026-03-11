import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y: (number | null)[] = x.map(i => Math.sin(i * 0.1) * 30 + 50);

  // Inject null gaps
  for (let i = 20; i <= 30; i++) y[i] = null;
  for (let i = 55; i <= 60; i++) y[i] = null;
  for (let i = 80; i <= 85; i++) y[i] = null;

  return [{ x, series: [y, y] }];
}

export default function SpanGaps() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Index" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="With Gaps (default)" />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="spanGaps = true" spanGaps />
    </Chart>
  );
}
