import React from 'react';
import { Chart, Scale, Series, Axis, Legend, Side } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.08) * 30 + 40);
  const y2 = x.map(i => Math.cos(i * 0.06) * 200 + 300);
  return [{ x, series: [y1, y2] }];
}

export default function SyncYZero() {
  const data = generateData();

  return (
    <div>
      <p className="text-demo text-muted mb-2">
        Two y-scales both pinned to zero with <code>min=0</code>. Different magnitudes but both start at zero.
      </p>
      <Chart width={800} height={400} data={data} xlabel="Index">
        <Scale id="y1"  min={0} />
        <Scale id="y2"  min={0} />
        <Axis scale="y1" label="Small (0-80)" stroke="#e74c3c" />
        <Axis scale="y2" side={Side.Right} label="Large (0-600)" stroke="#3498db" />
        <Series group={0} index={0} yScale="y1" stroke="#e74c3c" label="Small Scale" />
        <Series group={0} index={1} yScale="y2" stroke="#3498db" label="Large Scale" />
        <Legend />
      </Chart>
    </div>
  );
}
