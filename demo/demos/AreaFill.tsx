import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const xs = Array.from({ length: 30 }, (_, i) => i + 1);
  const vals = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const pick = () => vals[Math.floor(Math.random() * vals.length)];

  return [{
    x: xs,
    series: [
      xs.map(() => pick()),
      xs.map(() => pick()),
      xs.map(() => pick()),
    ],
  }];
}

export default function AreaFill() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} time={false} />
      <Scale id="y" auto ori={1} dir={1} />
      <Axis scale="x" side={2} />
      <Axis scale="y" side={3} />
      <Series group={0} index={0} yScale="y" stroke="red" fill="rgba(255,0,0,0.1)" width={2} label="Red" />
      <Series group={0} index={1} yScale="y" stroke="green" fill="rgba(0,255,0,0.1)" width={2} label="Green" />
      <Series group={0} index={2} yScale="y" stroke="blue" fill="rgba(0,0,255,0.1)" width={2} label="Blue" />
    </Chart>
  );
}
