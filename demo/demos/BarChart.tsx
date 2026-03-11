import React from 'react';
import { Chart, Scale, Series, Axis, bars } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const months = 12;
  const x = Array.from({ length: months }, (_, i) => i + 1);
  const revenue = x.map(() => Math.round(Math.random() * 80 + 20));
  const costs = x.map(() => Math.round(Math.random() * 50 + 10));

  return [{ x, series: [revenue, costs] }];
}

const fmtMonth = (splits: number[]) => splits.map(v => {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[v] ?? String(v);
});

const fmtK = (splits: number[]) => splits.map(v => '$' + v + 'K');

export default function BarChart() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Month" values={fmtMonth} />
      <Axis scale="y" label="Amount" values={fmtK} />
      <Series group={0} index={0} yScale="y" stroke="#2980b9" fill="rgba(41,128,185,0.7)" width={0} label="Revenue" paths={bars()} fillTo={0} />
      <Series group={0} index={1} yScale="y" stroke="#e74c3c" fill="rgba(231,76,60,0.7)" width={0} label="Costs" paths={bars()} fillTo={0} />
    </Chart>
  );
}
