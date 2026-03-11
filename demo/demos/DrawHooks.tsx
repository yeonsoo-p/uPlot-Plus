import React from 'react';
import { Chart, Scale, Series, Axis, HLine, Region } from '../../src';
import type { ChartData, CursorDrawCallback } from '../../src';

function generateData(): ChartData {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.04) * 30 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y] }];
}

// Draw crosshair coordinates on the cursor overlay
const onCursorDraw: CursorDrawCallback = ({ ctx, plotBox }, cursor) => {
  if (cursor.left < 0 || cursor.top < 0) return;

  const x = cursor.left;
  const y = cursor.top;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';

  const label = `(${cursor.left.toFixed(0)}, ${cursor.top.toFixed(0)})`;
  const textW = ctx.measureText(label).width;

  // Background box
  const padX = 4;
  const boxX = Math.min(x + 8, plotBox.left + plotBox.width - textW - padX * 2);
  const boxY = y - 20;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(boxX, boxY, textW + padX * 2, 16);

  ctx.fillStyle = '#fff';
  ctx.fillText(label, boxX + padX, boxY + 12);
};

export default function DrawHooks() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} onCursorDraw={onCursorDraw}>
      <Scale id="x" />
      <Scale id="y" auto={false} min={10} max={90} />
      <Axis scale="x" label="Sample" />
      <Axis scale="y" label="Value" />
      <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2} label="Signal" />
      <Region yMin={65} yMax={90} yScale="y" fill="rgba(231, 76, 60, 0.08)" />
      <HLine value={65} yScale="y" stroke="#e74c3c" width={2} dash={[6, 4]} label="Threshold: 65" />
    </Chart>
  );
}
