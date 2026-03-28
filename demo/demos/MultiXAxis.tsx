import React from 'react';
import { Chart, Series } from '../../src';

function generateData() {
  // Group 0: 100 points over [0, 10]
  const n0 = 100;
  const x0: number[] = [];
  const y0: number[] = [];
  for (let i = 0; i < n0; i++) {
    const t = i * 0.1;
    x0.push(t);
    y0.push(Math.sin(t) * 30 + 50);
  }

  // Group 1: 50 points over [3, 8] — different x range, different sampling
  const n1 = 50;
  const x1: number[] = [];
  const y1: number[] = [];
  for (let i = 0; i < n1; i++) {
    const t = 3 + i * 0.1;
    x1.push(t);
    y1.push(Math.cos(t * 2) * 20 + 40);
  }

  return [
    { x: x0, series: [y0] },
    { x: x1, series: [y1] },
  ];
}

export default function MultiXAxis() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="X" ylabel="Value">
      <Series group={0} index={0} label="Sine (Group 0)" />
      <Series group={1} index={0} label="Cosine (Group 1)" />
    </Chart>
  );
}
