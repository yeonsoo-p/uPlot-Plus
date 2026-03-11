import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 2_000_000;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  let val = 0;
  let momentum = 0;
  let volatility = 1;
  let drift = 0;

  for (let i = 0; i < n; i++) {
    x[i] = i;

    // regime change: shift volatility and drift at random intervals
    if (Math.random() < 0.0001) {
      volatility = 0.3 + Math.random() * 3;
      drift = (Math.random() - 0.5) * 0.3;
    }

    // random walk with momentum
    momentum = momentum * 0.98 + (Math.random() - 0.5) * volatility;
    val += momentum + drift;

    // mean reversion to prevent unbounded drift
    val *= 0.99999;

    y[i] = val;
  }

  return [{ x: Array.from(x), series: [Array.from(y)] }];
}

export default function LargeDataset() {
  const data = useMemo(generateData, []);

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="Index" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#8e44ad" width={1} label="2M Points" />
    </Chart>
  );
}
