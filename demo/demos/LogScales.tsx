import React from 'react';
import { Chart, Scale, Series, Axis, fmtCompact, Distribution } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    y.push(Math.pow(10, i / 20) + (Math.random() - 0.5) * Math.pow(10, i / 25));
  }

  return [{ x, series: [y] }];
}

export default function LogScales() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  distr={Distribution.Log} log={10} />
      <Axis scale="x" label="Index" />
      <Axis scale="y" label="Value (log)" values={fmtCompact({ decimals: 0 })} />
      <Series group={0} index={0} yScale="y" stroke="#e67e22" width={2} label="Exponential" />
    </Chart>
  );
}
