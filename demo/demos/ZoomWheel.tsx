import React, { useMemo } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

export default function ZoomWheel() {
  const data = useMemo(() => {
    const N = 1000;
    const x = new Float64Array(N);
    const y1 = new Float64Array(N);
    const y2 = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      const xi = i * 0.1;
      x[i] = xi;
      y1[i] = Math.sin(xi) * Math.exp(-xi * 0.02);
      y2[i] = Math.cos(xi * 0.7) * 0.8;
    }

    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <Chart width={800} height={400} data={data} >
      <Series group={0} index={0} label="Damped sine" />
      <Series group={0} index={1} label="Cosine" />
      <Legend />
    </Chart>
  );
}
