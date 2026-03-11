import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function NearestNonNull() {
  const data: ChartData = useMemo(() => {
    const n = 60;
    const x = Array.from({ length: n }, (_, i) => i);
    const y: (number | null)[] = x.map(i => Math.sin(i * 0.15) * 30 + 50);

    // Sprinkle lots of nulls
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.4) {
        y[i] = null;
      }
    }

    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Sparse data with ~40% null values. Cursor snaps to the nearest non-null point,
        skipping over null gaps.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Index" />
        <Axis scale="y" label="Value" />
        <Series
          group={0}
          index={0}
          yScale="y"
          stroke="#2980b9"
          width={2}
          label="Sparse Signal"
          points={{ show: true, size: 6, fill: '#2980b9' }}
        />
        <Legend />
      </Chart>
    </div>
  );
}
