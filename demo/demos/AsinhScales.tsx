import React from 'react';
import { Chart, Scale, Series, Axis, Distribution } from '../../src';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => {
    const t = (i - 100) / 20;
    // Data spanning large negative to large positive values with cluster near zero
    return Math.sinh(t) * 10 + (Math.random() - 0.5) * 5;
  });

  return [{ x, series: [y] }];
}

const fmtVal = (splits: number[]) => splits.map(v => {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v.toFixed(0);
});

export default function AsinhScales() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="Sample">
      <Scale id="y"  distr={Distribution.Asinh} asinh={1} />
      <Axis scale="y" label="Value (asinh)" values={fmtVal} />
      <Series group={0} index={0} stroke="#8e44ad" fill="rgba(142,68,173,0.1)" label="Symmetric Data" />
    </Chart>
  );
}
