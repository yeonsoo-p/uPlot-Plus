import React, { useMemo } from 'react';
import { Chart, Series, Legend } from '../../src';

export default function CursorSnap() {
  const data = useMemo(() => {
    const n = 30;
    const x = Array.from({ length: n }, (_, i) => i * 3);
    const y = x.map(v => Math.sin(v * 0.1) * 40 + 50 + (Math.random() - 0.5) * 10);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Only 30 data points — cursor snaps to the nearest one. Notice the point indicator jumping between samples.
      </p>
      <Chart width={800} height={400} data={data} xlabel="X" ylabel="Value">
        <Series
          group={0}
          index={0}
          label="Sparse Signal"
          points={{ show: true, size: 8, fill: '#8e44ad', stroke: '#fff', width: 2 }}
        />
        <Legend />
      </Chart>
    </div>
  );
}
