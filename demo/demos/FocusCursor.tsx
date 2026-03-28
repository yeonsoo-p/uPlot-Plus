import React, { useMemo } from 'react';
import { Chart, Series, Legend } from '../../src';

export default function FocusCursor() {
  const data = useMemo(() => {
    const N = 200;
    const x = new Float64Array(N);
    const series: Float64Array[] = [];

    for (let s = 0; s < 5; s++) {
      series.push(new Float64Array(N));
    }

    for (let i = 0; i < N; i++) {
      x[i] = i;
      series[0]![i] = Math.sin(i * 0.05) * 50 + 50;
      series[1]![i] = Math.cos(i * 0.03) * 40 + 60;
      series[2]![i] = Math.sin(i * 0.08 + 1) * 30 + 40;
      series[3]![i] = Math.cos(i * 0.06 + 2) * 35 + 55;
      series[4]![i] = Math.sin(i * 0.04 + 3) * 25 + 45;
    }

    return [{ x, series }];
  }, []);

  const colors = ['#e24d42', '#1f78b4', '#33a02c', '#ff7f00', '#6a3d9a'];

  return (
    <Chart
      width={800}
      height={400}
      data={data}
      cursor={{ focus: { alpha: 0.15 } }}
    >
      {colors.map((color, i) => (
        <Series
          key={i}
          group={0}
          index={i}
          label={`Series ${i + 1}`}
        />
      ))}
      <Legend />
    </Chart>
  );
}
