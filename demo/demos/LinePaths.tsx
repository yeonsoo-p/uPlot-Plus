import React, { useMemo } from 'react';
import { Chart, Series, Legend, linear, monotoneCubic, catmullRom, stepped, bars, points } from '../../src';
export default function LinePaths() {
  const data = useMemo(() => {
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
      <Chart width={800} height={500} data={data} xlabel="Index" ylabel="Value">
        <Series group={0} index={0} label="linear" paths={linear()} />
        <Series group={0} index={1} label="monotoneCubic" paths={monotoneCubic()} />
        <Series group={0} index={2} label="catmullRom" paths={catmullRom()} />
        <Series group={0} index={3} label="stepped" paths={stepped(1)} />
        <Series group={0} index={4} stroke="#9b59b6" fill="rgba(155,89,182,0.4)" width={0} label="bars" paths={bars()} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
        <Series group={0} index={5} width={0} label="points" paths={points()} points={{ show: true, size: 8, fill: '#1abc9c' }} />
        <Legend />
      </Chart>
    </div>
  );
}
