import React from 'react';
import { Chart, Scale, Series, Axis, Legend, fmtHourMin, fmtCompact, withAlpha, Side } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 288; // 24 hours at 5-min intervals
  const startTs = 1700000000; // Unix timestamp
  const x: number[] = [];
  const requests: number[] = [];
  const errors: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(startTs + i * 300);
    const hour = (i * 5) / 60;
    // Simulated daily traffic pattern
    const base = 500 + 300 * Math.sin((hour - 6) * Math.PI / 12);
    requests.push(Math.max(0, Math.round(base + (Math.random() - 0.5) * 100)));
    errors.push(Math.max(0, Math.round(base * 0.02 + (Math.random() - 0.5) * 5)));
  }

  return [{ x, series: [requests, errors] }];
}

export default function TimeSeries() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="req"  />
      <Scale id="err"  />
      <Axis scale="x" label="Time (UTC)" values={fmtHourMin({ utc: true })} space={80} />
      <Axis scale="req" label="Requests" values={fmtCompact({ decimals: 1 })} stroke="#2980b9" />
      <Axis scale="err" side={Side.Right} label="Errors" stroke="#e74c3c" grid={{ show: false }} />
      <Series group={0} index={0} yScale="req" stroke="#2980b9" fill={withAlpha('#2980b9', 0.1)} width={2} label="Requests" />
      <Series group={0} index={1} yScale="err" stroke="#e74c3c" width={2} label="Errors" />
      <Legend />
    </Chart>
  );
}
