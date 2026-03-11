import React from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.08) * 30 + 50);
  const y2 = x.map(i => Math.cos(i * 0.06) * 25 + 45);
  const y3 = x.map(i => Math.sin(i * 0.1 + 2) * 20 + 55);
  const y4 = x.map(i => Math.cos(i * 0.12 + 1) * 15 + 40);
  return [{ x, series: [y1, y2, y3, y4] }];
}

export default function LegendDemo() {
  const data = generateData();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Legend at bottom (default)</h4>
        <Chart width={800} height={250} data={data}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Alpha" />
          <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Beta" />
          <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="Gamma" />
          <Series group={0} index={3} yScale="y" stroke="#f39c12" width={2} label="Delta" />
          <Legend />
        </Chart>
      </div>
      <div>
        <h4 style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Legend at top — click series to toggle</h4>
        <Chart width={800} height={250} data={data}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Alpha" />
          <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Beta" />
          <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="Gamma" />
          <Series group={0} index={3} yScale="y" stroke="#f39c12" width={2} label="Delta" />
          <Legend position="top" />
        </Chart>
      </div>
    </div>
  );
}
