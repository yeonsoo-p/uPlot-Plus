import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
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

const fmtLog = (splits: number[]) => splits.map(v => {
  if (v === 0) return '0';
  if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toFixed(0);
});

export default function LogScales() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} time={false} />
      <Scale id="y" auto ori={1} dir={1} distr={3} log={10} />
      <Axis scale="x" side={2} label="Index" />
      <Axis scale="y" side={3} label="Value (log)" values={fmtLog} />
      <Series group={0} index={0} yScale="y" stroke="#e67e22" width={2} label="Exponential" />
    </Chart>
  );
}
