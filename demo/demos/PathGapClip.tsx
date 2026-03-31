import React, { useMemo } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

export default function PathGapClip() {
  const data = useMemo(() => {
    const n = 120;
    const x = Array.from({ length: n }, (_, i) => i);
    const base = x.map(i => Math.sin(i * 0.08) * 30 + 50);

    // Create a version with null gaps
    const withGaps: (number | null)[] = base.map((v, i) => {
      if (i >= 20 && i <= 30) return null;
      if (i >= 55 && i <= 65) return null;
      if (i >= 90 && i <= 95) return null;
      return v;
    });

    return [{ x, series: [withGaps, withGaps] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Same data with null gaps. Red line shows gaps (default). Blue line uses <code>spanGaps</code> to connect across nulls.
      </p>
      <Chart width={800} height={400} data={data} xlabel="Index" ylabel="Value">
        <Series group={0} index={0} label="With Gaps (default)" />
        <Series group={0} index={1} label="spanGaps = true" spanGaps />
        <Legend />
      </Chart>
    </div>
  );
}
