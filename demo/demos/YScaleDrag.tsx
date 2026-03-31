import React from 'react';
import { Chart, Scale, Series, Axis, Legend, Side } from 'uplot-plus';

function generateData() {
  const N = 200;
  const x = new Float64Array(N);
  const y1 = new Float64Array(N);
  const y2 = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    x[i] = i;
    y1[i] = Math.sin(i * 0.05) * 100 + 200;
    y2[i] = Math.cos(i * 0.03) * 50 + 50;
  }

  return [{ x, series: [y1, y2] }];
}

export default function YScaleDrag() {
  const data = generateData();

  return (
    <div>
      <p className="text-demo text-muted-light mb-2">
        Click and drag on the left or right y-axis to pan the scale. Double-click chart to reset.
      </p>
      <Chart width={800} height={400} data={data} ylabel="Temperature">
        <Scale id="y2"  />
        <Series group={0} index={0} label="Temperature" />
        <Series group={0} index={1} yScale="y2" stroke="#1f78b4" label="Humidity" />
        <Axis scale="y2" side={Side.Right} label="Humidity" stroke="#1f78b4" />
        <Legend />
      </Chart>
    </div>
  );
}
