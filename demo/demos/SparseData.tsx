import React from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

function generateData() {
  // Only 10 data points spread across 0-1000
  const positions = [0, 50, 120, 280, 400, 530, 650, 780, 900, 1000];
  const x = positions;
  const y = x.map(v => Math.sin(v * 0.005) * 40 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y] }];
}

export default function SparseData() {
  const data = generateData();

  return (
    <div>
      <Chart width={800} height={400} data={data} xlabel="X Position" ylabel="Value">
        <Series
          group={0}
          index={0}
          label="Sparse (10 pts)"
          points={{ show: true, size: 10, fill: '#e67e22', stroke: '#fff', width: 2 }}
        />
        <Legend />
      </Chart>
    </div>
  );
}
