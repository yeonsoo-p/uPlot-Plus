import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData, DrawCallback } from '../../src';

function generateData(): ChartData {
  const n = 80;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    // Upward trend with noise
    y.push(20 + i * 0.8 + (Math.random() - 0.5) * 25);
  }

  return [{ x, series: [y] }];
}

export default function Trendlines() {
  const data = useMemo(() => generateData(), []);

  // Pre-compute regression (data doesn't change)
  const regression = useMemo(() => {
    const group = data[0];
    if (group == null) return { slope: 0, intercept: 0 };
    const xArr = group.x;
    const yArr = group.series[0];
    if (yArr == null) return { slope: 0, intercept: 0 };
    const n = xArr.length;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += xArr[i] as number;
      sumY += yArr[i] as number;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = (xArr[i] as number) - meanX;
      const dy = (yArr[i] as number) - meanY;
      num += dx * dy;
      den += dx * dx;
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  }, [data]);

  const onDraw: DrawCallback = ({ ctx, valToX, valToY }) => {
    const group = data[0];
    if (group == null) return;
    const xArr = group.x;
    const n = xArr.length;
    if (n === 0) return;

    const { slope, intercept } = regression;
    const x0 = xArr[0] as number;
    const x1 = xArr[n - 1] as number;
    const y0 = slope * x0 + intercept;
    const y1 = slope * x1 + intercept;

    const px0 = valToX(x0);
    const py0 = valToY(y0, 'y');
    const px1 = valToX(x1);
    const py1 = valToY(y1, 'y');
    if (px0 == null || py0 == null || px1 == null || py1 == null) return;

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(px0, py0);
    ctx.lineTo(px1, py1);
    ctx.stroke();

    // Label
    ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `y = ${slope.toFixed(2)}x + ${intercept.toFixed(1)}`,
      px0 + 8,
      py0 - 8,
    );
  };

  return (
    <Chart width={800} height={400} data={data} onDraw={onDraw}>
      <Scale id="x" />
      <Scale id="y"  />
      <Axis scale="x" label="X" />
      <Axis scale="y" label="Y" />
      <Series group={0} index={0} yScale="y" stroke="#3498db" width={2} label="Data"
        points={{ show: true, size: 4, fill: '#3498db' }} />
    </Chart>
  );
}
