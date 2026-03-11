import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

export default function AxisAutosize() {
  const data: ChartData = useMemo(() => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => 1_000_000 + Math.sin(i * 0.08) * 500_000 + Math.random() * 100_000);
    return [{ x, series: [y] }];
  }, []);

  const fmtMillions = (splits: number[]) =>
    splits.map(v => v.toLocaleString());

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Y-axis labels are very large numbers (millions) — the axis auto-sizes to fit them.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Sample" />
        <Axis scale="y" label="Value" values={fmtMillions} />
        <Series group={0} index={0} yScale="y" stroke="#16a085" width={2} label="Large Values" />
      </Chart>
    </div>
  );
}
