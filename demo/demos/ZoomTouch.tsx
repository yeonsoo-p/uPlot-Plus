import React, { useMemo } from 'react';
import { Chart, Series } from '../../src';

export default function ZoomTouch() {
  const data = useMemo(() => {
    const N = 500;
    const x = new Float64Array(N);
    const y = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      x[i] = i;
      y[i] = Math.sin(i * 0.02) * 50 + Math.random() * 10;
    }

    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
        Use two-finger pinch to zoom on touch devices. Drag to zoom on desktop. Double-tap to reset.
      </p>
      <Chart width={800} height={400} data={data} cursor={{ wheelZoom: true }}>
        <Series group={0} index={0} label="Signal" />
      </Chart>
    </div>
  );
}
