import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function randomWalk(n: number, start: number): number[] {
  const vals: number[] = [start];
  for (let i = 1; i < n; i++) {
    vals.push(vals[i - 1] + (Math.random() - 0.5) * 10);
  }
  return vals;
}

function generateData(): ChartData {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  return [{
    x,
    series: [
      randomWalk(n, 50),
      randomWalk(n, 50),
      randomWalk(n, 50),
      randomWalk(n, 50),
    ],
  }];
}

export default function PointStyles() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" auto ori={0} dir={1} time={false} />
      <Scale id="y" auto ori={1} dir={1} />
      <Axis scale="x" side={2} />
      <Axis scale="y" side={3} />
      {/* Line only (default) */}
      <Series group={0} index={0} yScale="y" stroke="#27ae60" width={2} label="Line only" />
      {/* Line + points */}
      <Series group={0} index={1} yScale="y" stroke="#e74c3c" width={2} label="Line + Points"
        points={{ show: true, size: 6, fill: "#fff", stroke: "#e74c3c", width: 1.5 }} />
      {/* Points only (no line) */}
      <Series group={0} index={2} yScale="y" stroke="#3498db" width={0} label="Points only"
        points={{ show: true, size: 8, fill: "#3498db" }} />
      {/* Custom point colors */}
      <Series group={0} index={3} yScale="y" stroke="#f39c12" fill="rgba(243,156,18,0.1)" width={2} label="Custom pts"
        points={{ show: true, size: 5, fill: "#e74c3c", stroke: "#f39c12", width: 1 }} />
    </Chart>
  );
}
