import React from 'react';
import { Chart, Scale, Series, Axis, Direction, Side } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 50;
  const x = Array.from({ length: n }, (_, i) => i);
  // Depth measurements — values increase with depth
  const density = x.map(i => 1.0 + i * 0.02 + (Math.random() - 0.5) * 0.01);
  const temp = x.map(i => 25 - i * 0.3 + (Math.random() - 0.5) * 0.5);

  return [{ x, series: [density, temp] }];
}

const fmtDepth = (splits: number[]) => splits.map(v => v.toFixed(0) + 'm');

export default function ScaleDirection() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="depth"  dir={Direction.Backward} />
      <Scale id="temp"  />
      <Axis scale="x" label="Sample" />
      <Axis scale="depth" label="Depth (inverted)" values={fmtDepth} stroke="#2980b9" />
      <Axis scale="temp" side={Side.Right} label="Temperature (°C)" stroke="#e67e22" grid={{ show: false }} />
      <Series group={0} index={0} yScale="depth" stroke="#2980b9" width={2} label="Density" />
      <Series group={0} index={1} yScale="temp" stroke="#e67e22" width={2} label="Temperature" />
    </Chart>
  );
}
