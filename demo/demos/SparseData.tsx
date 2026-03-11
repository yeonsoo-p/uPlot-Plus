import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function SparseData() {
  const data: ChartData = useMemo(() => {
    // Only 10 data points spread across 0-1000
    const positions = [0, 50, 120, 280, 400, 530, 650, 780, 900, 1000];
    const x = positions;
    const y = x.map(v => Math.sin(v * 0.005) * 40 + 50 + (Math.random() - 0.5) * 10);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Only 10 data points spread across an x-range of 0-1000, creating large gaps between points.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="X Position" />
        <Axis scale="y" label="Value" />
        <Series
          group={0}
          index={0}
          yScale="y"
          stroke="#e67e22"
          width={2}
          label="Sparse (10 pts)"
          points={{ show: true, size: 10, fill: '#e67e22', stroke: '#fff', width: 2 }}
        />
        <Legend />
      </Chart>
    </div>
  );
}
