import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 50000;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    x[i] = i;
    y[i] = Math.sin(i * 0.00002) * 40 + Math.sin(i * 0.001) * 5 + Math.sin(i * 0.1) * 2 + (Math.random() - 0.5) * 3;
  }

  return [{ x: Array.from(x), series: [Array.from(y)] }];
}

export default function AxisControl() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y" auto={false} min={-50} max={50} />
      <Axis scale="x" label="Sample Index" />
      <Axis scale="y" label="Amplitude" labelSize={20} space={50} />
      <Series group={0} index={0} yScale="y" stroke="#8e44ad" width={1} label="Signal" />
    </Chart>
  );
}
