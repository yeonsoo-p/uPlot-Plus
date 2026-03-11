import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 200;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 50 + 50);
    y2.push(Math.cos(t) * 30 + 50);
  }

  return [{ x, series: [y1, y2] }];
}

export default function BasicLine() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} />
      <Scale id="y" auto ori={1} dir={1} />
      <Axis scale="x" side={2} label="Time (s)" />
      <Axis scale="y" side={3} label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Sine" />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Cosine" />
    </Chart>
  );
}
