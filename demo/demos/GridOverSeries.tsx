import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData, DrawCallback } from '../../src';

function generateData(): ChartData {
  const n = 60;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.15) * 30 + 50);
  const y2 = x.map(i => Math.cos(i * 0.12) * 25 + 45);
  return [{ x, series: [y1, y2] }];
}

// Custom draw hook that re-draws the grid lines on top of the series
const gridOverlay: DrawCallback = ({ ctx, plotBox }) => {
  const gridColor = 'rgba(0, 0, 0, 0.12)';
  const gridCount = 6;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  const l = plotBox.left;
  const t = plotBox.top;
  const w = plotBox.width;
  const h = plotBox.height;

  // Horizontal grid lines
  for (let i = 0; i <= gridCount; i++) {
    const y = t + (h * i) / gridCount;
    ctx.beginPath();
    ctx.moveTo(l, y);
    ctx.lineTo(l + w, y);
    ctx.stroke();
  }

  // Vertical grid lines
  for (let i = 0; i <= gridCount; i++) {
    const x = l + (w * i) / gridCount;
    ctx.beginPath();
    ctx.moveTo(x, t);
    ctx.lineTo(x, t + h);
    ctx.stroke();
  }
};

export default function GridOverSeries() {
  const data = generateData();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Default (grid behind series)</h4>
        <Chart width={800} height={200} data={data}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" fill="rgba(231,76,60,0.3)" width={2} label="Series A" />
          <Series group={0} index={1} yScale="y" stroke="#3498db" fill="rgba(52,152,219,0.3)" width={2} label="Series B" />
        </Chart>
      </div>
      <div>
        <h4 style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Grid over series (via onDraw hook)</h4>
        <Chart width={800} height={200} data={data} onDraw={gridOverlay}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" grid={{ show: false }} />
          <Axis scale="y" grid={{ show: false }} />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" fill="rgba(231,76,60,0.3)" width={2} label="Series A" />
          <Series group={0} index={1} yScale="y" stroke="#3498db" fill="rgba(52,152,219,0.3)" width={2} label="Series B" />
        </Chart>
      </div>
    </div>
  );
}
