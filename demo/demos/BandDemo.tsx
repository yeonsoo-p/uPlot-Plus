import React from 'react';
import { Chart, Series, Band, Legend } from '../../src';

function generateConfidenceData() {
  const n = 120;
  const x = Array.from({ length: n }, (_, i) => i);
  const mean: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < n; i++) {
    const m = Math.sin(i * 0.05) * 25 + 50;
    const spread = 5 + Math.sin(i * 0.02) * 3;
    mean.push(m);
    upper.push(m + spread);
    lower.push(m - spread);
  }
  return [{ x, series: [mean, upper, lower] }];
}

function generateMultiBandData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const s1 = x.map(i => 60 + Math.sin(i * 0.06) * 15);
  const s2 = x.map(i => 40 + Math.cos(i * 0.06) * 15);
  const s3 = x.map(i => 20 + Math.sin(i * 0.08 + 1) * 10);
  return [{ x, series: [s1, s2, s3] }];
}

export default function BandDemo() {
  const confData = generateConfidenceData();
  const multiData = generateMultiBandData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        The <code>Band</code> component fills the area between two series. Useful for confidence intervals,
        ranges, and between-series highlighting.
      </p>

      <h4 style={{ margin: '12px 0 4px' }}>Confidence Interval</h4>
      <Chart width={800} height={280} data={confData} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} label="Mean" stroke="#2980b9" width={2} />
        <Series group={0} index={1} label="Upper" stroke="#85c1e9" width={1} dash={[4, 4]} />
        <Series group={0} index={2} label="Lower" stroke="#85c1e9" width={1} dash={[4, 4]} />
        <Band series={[1, 2]} group={0} fill="rgba(41, 128, 185, 0.15)" />
        <Legend />
      </Chart>

      <h4 style={{ margin: '12px 0 4px' }}>Multiple Bands Between Series</h4>
      <Chart width={800} height={280} data={multiData} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} label="Series A" stroke="#e74c3c" />
        <Series group={0} index={1} label="Series B" stroke="#27ae60" />
        <Series group={0} index={2} label="Series C" stroke="#8e44ad" />
        <Band series={[0, 1]} group={0} fill="rgba(231, 76, 60, 0.1)" />
        <Band series={[1, 2]} group={0} fill="rgba(39, 174, 96, 0.1)" />
        <Legend />
      </Chart>
    </div>
  );
}
