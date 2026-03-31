import React, { useMemo } from 'react';
import { Chart, Series, Axis, Vector, fmtSuffix } from 'uplot-plus';

function generateWindData() {
  const n = 48; // 48 half-hour intervals
  const x: number[] = [];
  const speed: number[] = [];
  const directions: number[] = [];

  let dir = Math.random() * 360;

  for (let i = 0; i < n; i++) {
    x.push(i * 0.5); // hours
    speed.push(5 + Math.random() * 25);
    // Direction drifts gradually
    dir += (Math.random() - 0.5) * 40;
    if (dir < 0) dir += 360;
    if (dir >= 360) dir -= 360;
    directions.push(dir);
  }

  return {
    directions,
    chartData: [{ x, series: [speed] }],
  };
}

export default function WindDirection() {
  const { directions, chartData } = useMemo(() => generateWindData(), []);

  return (
    <Chart width={800} height={400} data={chartData} ylabel="Wind Speed (km/h)">
      <Axis scale="x" label="Time (hours)" values={fmtSuffix('h')} />
      <Series group={0} index={0} label="Speed"
        dash={[4, 3]} />
      <Vector directions={directions} />
    </Chart>
  );
}
