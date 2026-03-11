import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function SoftMinMax() {
  const data: ChartData = useMemo(() => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    // Data stays between ~30-70 most of the time
    const y = x.map(i => Math.sin(i * 0.08) * 20 + 50 + (Math.random() - 0.5) * 5);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Scale has <code>range.min.soft=0</code> and <code>range.max.soft=100</code>.
        The range expands to include data beyond those bounds but never contracts below them.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale
          id="y"
          auto
         
         
          range={{
            min: { soft: 0, mode: 1 },
            max: { soft: 100, mode: 1 },
          }}
        />
        <Axis scale="x" label="Index" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#27ae60" width={2} label="Data (soft 0-100)" />
        <Legend />
      </Chart>
    </div>
  );
}
