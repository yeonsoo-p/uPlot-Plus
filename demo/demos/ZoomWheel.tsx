import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function ZoomWheel() {
  const data: ChartData = useMemo(() => {
    const N = 1000;
    const x = new Float64Array(N);
    const y1 = new Float64Array(N);
    const y2 = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      x[i] = i * 0.1;
      y1[i] = Math.sin(x[i]!) * Math.exp(-x[i]! * 0.02);
      y2[i] = Math.cos(x[i]! * 0.7) * 0.8;
    }

    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <Chart width={800} height={400} data={data} cursor={{ wheelZoom: true }}>
      <Scale id="x"  />
      <Scale id="y"  />
      <Series group={0} index={0} yScale="y" stroke="#e24d42" label="Damped sine" width={2} />
      <Series group={0} index={1} yScale="y" stroke="#1f78b4" label="Cosine" width={2} />
      <Axis scale="x" />
      <Axis scale="y" />
      <Legend />
    </Chart>
  );
}
