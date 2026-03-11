import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const series = [0, 1, 2, 3, 4].map(offset =>
    x.map(i => Math.sin(i * 0.08 + offset * 0.7) * 40 + 50 + offset * 5)
  );
  return [{ x, series }];
}

export default function DashPatterns() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} time={false} />
      <Scale id="y" auto ori={1} dir={1} />
      <Axis scale="x" side={2} />
      <Axis scale="y" side={3} />
      <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Solid" />
      <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Dashed [5,5]" dash={[5, 5]} />
      <Series group={0} index={2} yScale="y" stroke="#2ecc71" width={2} label="Dash-dot [10,5,2,5]" dash={[10, 5, 2, 5]} />
      <Series group={0} index={3} yScale="y" stroke="#f39c12" width={2} label="Long dash [15,5]" dash={[15, 5]} cap="round" />
      <Series group={0} index={4} yScale="y" stroke="#9b59b6" width={2} label="Dotted [2,4]" dash={[2, 4]} cap="round" />
    </Chart>
  );
}
