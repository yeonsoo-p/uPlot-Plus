import React, { useMemo } from 'react';
import { Chart, Series, Legend, points } from 'uplot-plus';

function generateScatterData() {
  const n1 = 80;
  const n2 = 60;

  // Cluster 1: centered around (30, 50)
  const x1: number[] = [];
  const y1: number[] = [];
  for (let i = 0; i < n1; i++) {
    x1.push(20 + Math.random() * 30 + (Math.random() - 0.5) * 10);
    y1.push(40 + Math.random() * 25 + (Math.random() - 0.5) * 15);
  }
  // Sort x1 and reorder y1 to match (required for x array ordering)
  const indices1 = x1.map((_, i) => i).sort((a, b) => (x1[a] ?? 0) - (x1[b] ?? 0));
  const sx1 = indices1.map(i => x1[i] as number);
  const sy1 = indices1.map(i => y1[i] as number);

  // Cluster 2: centered around (65, 70)
  const x2: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n2; i++) {
    x2.push(50 + Math.random() * 35 + (Math.random() - 0.5) * 10);
    y2.push(55 + Math.random() * 30 + (Math.random() - 0.5) * 15);
  }
  const indices2 = x2.map((_, i) => i).sort((a, b) => (x2[a] ?? 0) - (x2[b] ?? 0));
  const sx2 = indices2.map(i => x2[i] as number);
  const sy2 = indices2.map(i => y2[i] as number);

  return [
    { x: sx1, series: [sy1] },
    { x: sx2, series: [sy2] },
  ];
}

export default function ScatterPlot() {
  const data = useMemo(() => generateScatterData(), []);

  return (
    <Chart width={800} height={400} data={data} actions={[['wheel', 'zoomXY']]} xlabel="X" ylabel="Y">
      <Series
        group={0}
        index={0}
        fill="rgba(231, 76, 60, 0.6)"
        label="Cluster A"
        paths={points(5)}
      />
      <Series
        group={1}
        index={0}
        fill="rgba(52, 152, 219, 0.6)"
        label="Cluster B"
        paths={points(6)}
      />
      <Legend />
    </Chart>
  );
}
