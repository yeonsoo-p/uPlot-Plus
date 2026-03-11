import React, { useMemo } from 'react';
import { Chart, Scale, Axis } from '../../src';
import type { ChartData, DrawCallback } from '../../src';

interface BoxData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

function generateBoxData(): { boxes: BoxData[]; chartData: ChartData; yMin: number; yMax: number } {
  const categories = 10;
  const boxes: BoxData[] = [];

  let yMin = Infinity, yMax = -Infinity;

  for (let i = 0; i < categories; i++) {
    const center = 30 + Math.random() * 60;
    const spread = 5 + Math.random() * 20;
    const min = center - spread - Math.random() * 10;
    const q1 = center - spread * 0.5;
    const median = center + (Math.random() - 0.5) * spread * 0.3;
    const q3 = center + spread * 0.5;
    const max = center + spread + Math.random() * 10;
    boxes.push({ min, q1, median, q3, max });
    if (min < yMin) yMin = min;
    if (max > yMax) yMax = max;
  }

  const pad = (yMax - yMin) * 0.1;
  yMin -= pad;
  yMax += pad;

  // Provide minimal data for axis rendering
  const x = Array.from({ length: categories }, (_, i) => i + 1);
  const y = x.map(() => 0);
  return { boxes, chartData: [{ x, series: [y] }], yMin, yMax };
}

const fmtCategory = (splits: number[]) =>
  splits.map(v => {
    const idx = Math.round(v);
    if (idx < 1 || idx > 10) return '';
    return `Cat ${idx}`;
  });

export default function BoxWhisker() {
  const { boxes, chartData, yMin, yMax } = useMemo(() => generateBoxData(), []);

  const onDraw: DrawCallback = ({ ctx, plotBox, valToX, valToY }) => {
    const boxW = (plotBox.width / boxes.length) * 0.5;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b == null) continue;

      const cx = valToX(i + 1);
      const minPx = valToY(b.min, 'y');
      const q1Px = valToY(b.q1, 'y');
      const medPx = valToY(b.median, 'y');
      const q3Px = valToY(b.q3, 'y');
      const maxPx = valToY(b.max, 'y');
      if (cx == null || minPx == null || q1Px == null || medPx == null || q3Px == null || maxPx == null) continue;

      const halfW = boxW / 2;
      const capW = halfW * 0.6;

      // Whisker line: min to max
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, minPx);
      ctx.lineTo(cx, maxPx);
      ctx.stroke();

      // Min cap
      ctx.beginPath();
      ctx.moveTo(cx - capW, minPx);
      ctx.lineTo(cx + capW, minPx);
      ctx.stroke();

      // Max cap
      ctx.beginPath();
      ctx.moveTo(cx - capW, maxPx);
      ctx.lineTo(cx + capW, maxPx);
      ctx.stroke();

      // Box Q1 to Q3
      const boxTop = Math.min(q1Px, q3Px);
      const boxH = Math.abs(q3Px - q1Px);
      ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.fillRect(cx - halfW, boxTop, halfW * 2, boxH);
      ctx.strokeStyle = '#2980b9';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - halfW, boxTop, halfW * 2, boxH);

      // Median line
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, medPx);
      ctx.lineTo(cx + halfW, medPx);
      ctx.stroke();
    }
  };

  return (
    <Chart width={800} height={400} data={chartData} onDraw={onDraw}>
      <Scale id="x" auto={false} min={0.5} max={10.5} />
      <Scale id="y" auto={false} min={yMin} max={yMax} />
      <Axis scale="x" label="Category" values={fmtCategory} />
      <Axis scale="y" label="Value" />
    </Chart>
  );
}
