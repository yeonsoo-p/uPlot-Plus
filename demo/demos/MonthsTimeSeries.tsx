import React from 'react';
import { Chart, Series, Axis, Legend, fmtMonthName } from 'uplot-plus';

function generateData() {
  // Generate monthly timestamps for 2 years
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let year = 2024; year <= 2025; year++) {
    for (let month = 0; month < 12; month++) {
      const ts = new Date(year, month, 1).getTime() / 1000;
      x.push(ts);
      y1.push(Math.sin(month * 0.5) * 20 + 50 + (Math.random() - 0.5) * 5);
      y2.push(Math.cos(month * 0.4) * 15 + 40 + (Math.random() - 0.5) * 8);
    }
  }

  return [{ x, series: [y1, y2] }];
}

export default function MonthsTimeSeries() {
  const data = generateData();

  return (
    <div>
      <Chart width={800} height={400} data={data} ylabel="Value">
        <Axis scale="x" label="Month" values={fmtMonthName()} />
        <Series group={0} index={0} label="Metric A" />
        <Series group={0} index={1} label="Metric B" />
        <Legend />
      </Chart>
    </div>
  );
}
