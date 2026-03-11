import React, { useMemo } from 'react';
import { Chart, Scale, Axis } from '../../src';
import type { ChartData, DrawCallback } from '../../src';

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

function heatColor(t: number): string {
  // 0 = green, 0.5 = yellow, 1 = red
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) {
    const f = clamped * 2;
    const r = Math.round(f * 255);
    const g = 200;
    return `rgb(${r},${g},50)`;
  }
  const f = (clamped - 0.5) * 2;
  const r = 255;
  const g = Math.round((1 - f) * 200);
  return `rgb(${r},${g},50)`;
}

const fmtHour = (splits: number[]) =>
  splits.map(v => {
    const h = Math.round(v);
    if (h < 0 || h > 23) return '';
    return `${h}:00`;
  });

const fmtLatency = (splits: number[]) =>
  splits.map(v => `${Math.round(v)}ms`);

export default function Heatmap() {
  const { grid, chartData } = useMemo(() => generateHeatmapData(), []);

  // Find max value for normalization
  const maxVal = useMemo(() => {
    let m = 0;
    for (const row of grid) {
      for (const v of row) {
        if (v > m) m = v;
      }
    }
    return m;
  }, [grid]);

  const onDraw: DrawCallback = ({ ctx, valToX, valToY }) => {
    const bucketHeight = MAX_LATENCY / BUCKETS;

    for (let h = 0; h < HOURS; h++) {
      const row = grid[h];
      if (row == null) continue;

      const x0 = valToX(h);
      const x1 = valToX(h + 1);
      if (x0 == null || x1 == null) continue;
      const cellW = x1 - x0;

      for (let b = 0; b < BUCKETS; b++) {
        const val = row[b] ?? 0;
        const latLo = b * bucketHeight;
        const latHi = (b + 1) * bucketHeight;

        const y0 = valToY(latHi, 'y');
        const y1 = valToY(latLo, 'y');
        if (y0 == null || y1 == null) continue;
        const cellH = y1 - y0;

        ctx.fillStyle = heatColor(val / maxVal);
        ctx.fillRect(x0, y0, cellW, cellH);
      }
    }
  };

  return (
    <Chart width={800} height={400} data={chartData} onDraw={onDraw}>
      <Scale id="x" auto={false} min={0} max={HOURS} />
      <Scale id="y" auto={false} min={0} max={MAX_LATENCY} />
      <Axis scale="x" label="Hour" values={fmtHour} />
      <Axis scale="y" label="Latency" values={fmtLatency} />
    </Chart>
  );
}
