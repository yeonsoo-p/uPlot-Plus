import React from 'react';
import { Chart, Series } from 'uplot-plus';

function generateData() {
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
    <Chart width={800} height={400} data={data} xlabel="Index" ylabel="Value">
      <Series group={0} index={0} label="With Gaps (default)" />
      <Series group={0} index={1} label="spanGaps = true" spanGaps />
    </Chart>
  );
}
