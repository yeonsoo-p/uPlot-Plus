import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend, linear, monotoneCubic, catmullRom, stepped, bars, points } from '../../src';
import type { ChartData } from '../../src';

export default function LinePaths() {
  const data: ChartData = useMemo(() => {
    const n = 25;
    const x = Array.from({ length: n }, (_, i) => i);
    const base = x.map(i => Math.sin(i * 0.3) * 20 + 50 + (Math.random() - 0.5) * 8);
    // Same data for all series so differences are purely visual
    return [{ x, series: [base, base, base, base, base, base] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        All path builder types rendering the same data for comparison.
      </p>
      <Chart width={800} height={500} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Index" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="linear" paths={linear()} />
        <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="monotoneCubic" paths={monotoneCubic()} />
        <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="catmullRom" paths={catmullRom()} />
        <Series group={0} index={3} yScale="y" stroke="#f39c12" width={2} label="stepped" paths={stepped(1)} />
        <Series group={0} index={4} yScale="y" stroke="#9b59b6" fill="rgba(155,89,182,0.4)" width={0} label="bars" paths={bars()} fillTo={0} />
        <Series group={0} index={5} yScale="y" stroke="#1abc9c" width={0} label="points" paths={points()} points={{ show: true, size: 8, fill: '#1abc9c' }} />
        <Legend />
      </Chart>
    </div>
  );
}
