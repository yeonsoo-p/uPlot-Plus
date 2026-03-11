import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

function movingAverage(arr: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(arr.length - 1, i + Math.floor(window / 2));
    for (let j = start; j <= end; j++) {
      sum += arr[j] as number;
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

function generateData(): ChartData {
  const n = 300;
  const x: number[] = [];
  const noisy: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    // Underlying signal + noise
    const signal = Math.sin(i * 0.03) * 30 + Math.cos(i * 0.007) * 20 + 50;
    noisy.push(signal + (Math.random() - 0.5) * 20);
  }

  const smoothed = movingAverage(noisy, 15);

  return [{ x, series: [noisy, smoothed] }];
}

export default function DataSmoothing() {
  const data = useMemo(() => generateData(), []);

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Sample" />
      <Axis scale="y" label="Value" />
      <Series
        group={0}
        index={0}
        yScale="y"
        stroke="rgba(52, 152, 219, 0.3)"
        width={1}
        label="Noisy"
      />
      <Series
        group={0}
        index={1}
        yScale="y"
        stroke="#e74c3c"
        width={2.5}
        label="Smoothed (MA-15)"
      />
      <Legend />
    </Chart>
  );
}
