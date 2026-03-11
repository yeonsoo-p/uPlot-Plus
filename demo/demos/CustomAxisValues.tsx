import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 288; // 24h at 5-min intervals
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i * 300); // seconds
    // Simulated network throughput with daily pattern
    const hour = (i * 5) / 60;
    const base = 50 + 30 * Math.sin((hour - 6) * Math.PI / 12);
    y.push(Math.max(0, base + (Math.random() - 0.5) * 20));
  }

  return [{ x, series: [y] }];
}

const fmtTime = (splits: number[]) => splits.map(v => {
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const fmtMBs = (splits: number[]) => splits.map(v => v.toFixed(0) + ' MB/s');

export default function CustomAxisValues() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} time={false} />
      <Scale id="y" auto ori={1} dir={1} />
      <Axis scale="x" side={2} label="Time of Day" values={fmtTime} space={80} />
      <Axis scale="y" side={3} label="Throughput" values={fmtMBs} />
      <Series group={0} index={0} yScale="y" stroke="#2980b9" fill="rgba(41,128,185,0.1)" width={2} label="Throughput" />
    </Chart>
  );
}
