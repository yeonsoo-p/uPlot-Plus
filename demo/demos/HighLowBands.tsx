import React from 'react';
import { Chart, Series, Band } from 'uplot-plus';

function generateData() {
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
    <Chart width={800} height={400} data={data} xlabel="Sample" ylabel="Value">
      <Series group={0} index={0} label="Mean" />
      <Series group={0} index={1} label="Upper" dash={[4, 4]} />
      <Series group={0} index={2} label="Lower" dash={[4, 4]} />
      <Band series={[1, 2]} group={0} fill="rgba(52,152,219,0.15)" />
    </Chart>
  );
}
