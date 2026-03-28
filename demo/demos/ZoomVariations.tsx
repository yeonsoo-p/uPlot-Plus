import React, { useMemo } from 'react';
import { Chart, Series, Legend } from '../../src';

export default function ZoomVariations() {
  const data = useMemo(() => {
    const N = 500;
    const x: number[] = [];
    const y: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i * 0.02;
      x.push(t);
      y.push(Math.sin(t * 3) * 40 + 50 + Math.sin(t * 7) * 10);
    }

    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        <strong>Drag</strong> to zoom a region &middot;{' '}
        <strong>Scroll wheel</strong> to zoom both axes &middot;{' '}
        <strong>Double-click</strong> to reset zoom
      </p>
      <Chart width={800} height={400} data={data} cursor={{ wheelZoom: 'xy' }} xlabel="X" ylabel="Value">
        <Series group={0} index={0} label="Sine Wave" />
        <Legend />
      </Chart>
    </div>
  );
}
