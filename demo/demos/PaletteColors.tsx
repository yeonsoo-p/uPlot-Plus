import React from 'react';
import { Chart, Series, Legend, palette, withAlpha, fadeGradient } from 'uplot-plus';

const N = 8;
const colors = palette(N);

function generateData() {
  const n = 80;
  const x = Array.from({ length: n }, (_, i) => i);
  const series = Array.from({ length: N }, (_, s) => {
    const phase = s * 0.7;
    const amp = 15 + s * 3;
    return x.map(i => Math.sin(i * 0.05 + phase) * amp + 50);
  });
  return [{ x, series }];
}

export default function PaletteColors() {
  const data = generateData();

  return (
    <div>
      <h4 className="mt-3 mb-1">palette() &mdash; {N} auto-generated colors</h4>
      <Chart width={800} height={250} data={data}>
        {colors.map((c, i) => (
          <Series key={i} group={0} index={i} label={`S${i + 1}`} stroke={c} />
        ))}
        <Legend />
      </Chart>

      <h4 className="mt-3 mb-1">withAlpha() &mdash; semi-transparent fills</h4>
      <Chart width={800} height={250} data={data}>
        {colors.slice(0, 4).map((c, i) => (
          <Series key={i} group={0} index={i} label={`S${i + 1}`} stroke={c} fill={withAlpha(c, 0.15)} />
        ))}
        <Legend />
      </Chart>

      <h4 className="mt-3 mb-1">fadeGradient() &mdash; vertical gradient fills</h4>
      <Chart width={800} height={250} data={data}>
        {colors.slice(0, 3).map((c, i) => (
          <Series key={i} group={0} index={i} label={`S${i + 1}`} stroke={c} fill={fadeGradient(c, 0.5, 0.0)} />
        ))}
        <Legend />
      </Chart>

      <div className="mt-2 flex gap-2 flex-wrap">
        {colors.map((c, i) => (
          <div key={i} className="w-15 h-6 rounded flex items-center justify-center text-white text-2xs" style={{ background: c }}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
