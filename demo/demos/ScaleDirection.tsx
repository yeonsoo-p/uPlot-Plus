import React from 'react';
import { Chart, Scale, Series, Axis, Direction, Side, fmtSuffix } from 'uplot-plus';

function generateData() {
  const n = 50;
  const x = Array.from({ length: n }, (_, i) => i);
  // Depth measurements — values increase with depth
  const density = x.map(i => 1.0 + i * 0.02 + (Math.random() - 0.5) * 0.01);
  const temp = x.map(i => 25 - i * 0.3 + (Math.random() - 0.5) * 0.5);

  return [{ x, series: [density, temp] }];
}

export default function ScaleDirection() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="Sample">
      <Scale id="depth"  dir={Direction.Backward} />
      <Scale id="temp"  />
      <Axis scale="depth" label="Depth (inverted)" values={fmtSuffix('m')} stroke="#2980b9" />
      <Axis scale="temp" side={Side.Right} label="Temperature (°C)" stroke="#e67e22" grid={{ show: false }} />
      <Series group={0} index={0} yScale="depth" stroke="#2980b9" label="Density" />
      <Series group={0} index={1} yScale="temp" stroke="#e67e22" label="Temperature" />
    </Chart>
  );
}
