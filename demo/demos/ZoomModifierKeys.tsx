import React, { useMemo } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

export default function ZoomModifierKeys() {
  const data = useMemo(() => {
    const N = 500;
    const x: number[] = [];
    const y1: number[] = [];
    const y2: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i * 0.02;
      x.push(t);
      y1.push(Math.sin(t * 3) * 40 + 50);
      y2.push(Math.cos(t * 2) * 25 + 30);
    }

    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        <strong>Shift + Scroll</strong> to zoom X axis &middot;{' '}
        <strong>Alt + Scroll</strong> to zoom Y axis &middot;{' '}
        <strong>Drag</strong> to zoom a region &middot;{' '}
        <strong>Double-click</strong> to reset
      </p>
      <Chart
        width={800}
        height={400}
        data={data}
        actions={[['shiftWheel', 'zoomX'], ['altWheel', 'zoomY'], ['wheel', 'none']]}
        xlabel="Time"
        ylabel="Value"
      >
        <Series group={0} index={0} label="Sine" />
        <Series group={0} index={1} label="Cosine" />
        <Legend />
      </Chart>
    </div>
  );
}
