import React from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

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

function generateData() {
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
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="Sample" ylabel="Value">
      <Series
        group={0}
        index={0}
        label="Noisy"
      />
      <Series
        group={0}
        index={1}
        width={2.5}
        label="Smoothed (MA-15)"
      />
      <Legend />
    </Chart>
  );
}
