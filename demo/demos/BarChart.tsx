import React from 'react';
import { Chart, Series, Axis, groupedBars, fmtLabels, fmtWrap } from '../../src';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateData() {
  const months = 12;
  const x = Array.from({ length: months }, (_, i) => i + 1);
  const revenue = x.map(() => Math.round(Math.random() * 80 + 20));
  const costs = x.map(() => Math.round(Math.random() * 50 + 10));

  return [{ x, series: [revenue, costs] }];
}

export default function BarChart() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Axis scale="x" label="Month" values={fmtLabels(MONTHS)} />
      <Axis scale="y" label="Amount" values={fmtWrap('$', 'K')} />
      <Series group={0} index={0} stroke="#2980b9" fill="rgba(41,128,185,0.7)" width={0} label="Revenue" paths={groupedBars(0, 2)} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
      <Series group={0} index={1} stroke="#e74c3c" fill="rgba(231,76,60,0.7)" width={0} label="Costs" paths={groupedBars(1, 2)} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
    </Chart>
  );
}
