import React from 'react';
import { Chart, Scale, Series, Axis, fadeGradient } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 120;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 35 + 50);
    y2.push(Math.cos(t * 0.7) * 25 + 45);
  }

  return [{ x, series: [y1, y2] }];
}

export default function Gradients() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Area chart with linear gradient fills fading from top to bottom.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Time" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#4285f4" fill={fadeGradient('#4285f4')} width={2} label="Blue Series" />
        <Series group={0} index={1} yScale="y" stroke="#9c27b0" fill={fadeGradient('#9c27b0', 0.7)} width={2} label="Purple Series" />
      </Chart>
    </div>
  );
}
