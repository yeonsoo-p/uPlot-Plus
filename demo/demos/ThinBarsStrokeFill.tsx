import React, { useMemo } from 'react';
import { Chart, Series, Legend, groupedBars } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

export default function ThinBarsStrokeFill() {
  const data: ChartData = useMemo(() => {
    const n = 15;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y1 = x.map(() => Math.round(Math.random() * 60 + 20));
    const y2 = x.map(() => Math.round(Math.random() * 60 + 20));
    const y3 = x.map(() => Math.round(Math.random() * 60 + 20));
    return [{ x, series: [y1, y2, y3] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Bar chart variations: stroke-only, fill-only, and stroke+fill with different widths.
      </p>
      <Chart width={800} height={400} data={data} xlabel="Item" ylabel="Value">
        {/* Stroke only (auto-fill from palette) */}
        <Series group={0} index={0} label="Stroke Only" paths={groupedBars(0, 3)} />
        {/* Fill only — explicit transparent stroke + custom fill */}
        <Series group={0} index={1} stroke="transparent" fill="rgba(52, 152, 219, 0.6)" label="Fill Only" paths={groupedBars(1, 3)} />
        {/* Stroke + Fill — explicit low-alpha fill */}
        <Series group={0} index={2} stroke="#27ae60" fill="rgba(39, 174, 96, 0.3)" label="Stroke + Fill" paths={groupedBars(2, 3)} />
        <Legend />
      </Chart>
    </div>
  );
}
