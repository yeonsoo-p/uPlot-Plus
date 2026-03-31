import React from 'react';
import { Chart, Series, Legend, linear, monotoneCubic, catmullRom, stepped, bars, points } from 'uplot-plus';

function generateData() {
  const n = 25;
  const x = Array.from({ length: n }, (_, i) => i);
  const base = x.map(i => Math.sin(i * 0.3) * 20 + 50 + (Math.random() - 0.5) * 8);
  // Same data for all series so differences are purely visual
  return [{ x, series: [base, base, base, base, base, base] }];
}

export default function LinePaths() {
  const data = generateData();

  return (
    <div>
      <p className="text-demo text-muted mb-2">
        All path builder types rendering the same data for comparison.
      </p>
      <Chart width={800} height={500} data={data} xlabel="Index" ylabel="Value">
        <Series group={0} index={0} label="linear" paths={linear()} />
        <Series group={0} index={1} label="monotoneCubic" paths={monotoneCubic()} />
        <Series group={0} index={2} label="catmullRom" paths={catmullRom()} />
        <Series group={0} index={3} label="stepped" paths={stepped(1)} />
        <Series group={0} index={4} stroke="#9b59b6" label="bars" paths={bars()} />
        <Series group={0} index={5} label="points" paths={points()} points={{ show: true, size: 8, fill: '#1abc9c' }} />
        <Legend />
      </Chart>
    </div>
  );
}
