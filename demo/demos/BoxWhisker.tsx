import React, { useMemo } from 'react';
import { Chart, Scale, Axis, BoxWhisker, fmtLabels } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

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

const categoryLabels = Array.from({ length: 10 }, (_, i) => `Cat ${i + 1}`);

export default function BoxWhiskerDemo() {
  const { boxes, chartData, yMin, yMax } = useMemo(() => generateBoxData(), []);

  return (
    <Chart width={800} height={400} data={chartData} ylabel="Value">
      <Scale id="x" auto={false} min={0.5} max={10.5} />
      <Scale id="y" auto={false} min={yMin} max={yMax} />
      <Axis scale="x" label="Category" values={fmtLabels(categoryLabels, 1)} />
      <Axis scale="y" />
      <BoxWhisker boxes={boxes} />
    </Chart>
  );
}
