import React from 'react';
import { Chart, Scale, Axis, Heatmap, fmtSuffix } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

const HOURS = 24;
const BUCKETS = 15;
const MAX_LATENCY = 300; // ms

function generateHeatmapData(): { grid: number[][]; chartData: ChartData } {
  const grid: number[][] = [];

  for (let h = 0; h < HOURS; h++) {
    const row: number[] = [];
    for (let b = 0; b < BUCKETS; b++) {
      // Higher density in lower latency buckets, with some random hotspots
      const base = Math.exp(-b / 5) * 100;
      const spike = (Math.abs(h - 12) < 3 && b > 5 && b < 10) ? 80 : 0;
      row.push(Math.max(0, base + spike + (Math.random() - 0.3) * 30));
    }
    grid.push(row);
  }

  // Provide a minimal series so Chart renders axes
  const x = Array.from({ length: HOURS }, (_, i) => i);
  const y = x.map(() => 0);
  return { grid, chartData: [{ x, series: [y] }] };
}

const fmtHour = (splits: number[]) => splits.map(v => {
  const h = Math.round(v);
  return (h < 0 || h > 23) ? '' : `${h}:00`;
});

export default function HeatmapDemo() {
  const { grid, chartData } = generateHeatmapData();

  return (
    <Chart width={800} height={400} data={chartData}>
      <Scale id="x" auto={false} min={0} max={HOURS} />
      <Scale id="y" auto={false} min={0} max={MAX_LATENCY} />
      <Axis scale="x" label="Hour" values={fmtHour} />
      <Axis scale="y" label="Latency" values={fmtSuffix('ms')} />
      <Heatmap grid={grid} xRange={[0, 24]} yRange={[0, 300]} />
    </Chart>
  );
}
