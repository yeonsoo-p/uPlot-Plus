import React from 'react';
import { Chart, Scale, Series, Axis, Band } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const mean: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < n; i++) {
    const m = Math.sin(i * 0.06) * 30 + 50;
    const spread = 8 + Math.random() * 6;
    mean.push(m);
    upper.push(m + spread);
    lower.push(m - spread);
  }

  return [{ x, series: [mean, upper, lower] }];
}

export default function HighLowBands() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Sample" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Mean" />
      <Series group={0} index={1} yScale="y" stroke="rgba(52,152,219,0.3)" width={1} label="Upper" dash={[4, 4]} />
      <Series group={0} index={2} yScale="y" stroke="rgba(52,152,219,0.3)" width={1} label="Lower" dash={[4, 4]} />
      <Band series={[1, 2]} group={0} fill="rgba(52,152,219,0.15)" />
    </Chart>
  );
}
