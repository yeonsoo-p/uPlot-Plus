import React, { useMemo } from 'react';
import { Chart, Scale, Series } from 'uplot-plus';

export default function CustomScales() {
  const data = useMemo(() => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.08) * 30 + 50 + (Math.random() - 0.5) * 5);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Custom scale with manual <code>min</code>/<code>max</code> configuration.
        Data ranges ~20-80 but scale is fixed to 0-100.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={220} data={data} title="Fixed scale: 0 to 100" xlabel="Index" ylabel="Value (0-100)">
          <Scale id="y" auto={false} min={0} max={100} />
          <Series group={0} index={0} label="Fixed Range" />
        </Chart>
      </div>
      <div>
        <Chart width={800} height={220} data={data} title="Auto scale (for comparison)" xlabel="Index" ylabel="Value (auto)">
          <Series group={0} index={0} label="Auto Range" />
        </Chart>
      </div>
    </div>
  );
}
