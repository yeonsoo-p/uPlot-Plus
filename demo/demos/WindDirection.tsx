import React, { useMemo } from 'react';
import { Chart, Series, Axis } from '../../src';
import type { DrawCallback } from '../../src';

function generateWindData() {
  const n = 48; // 48 half-hour intervals
  const x: number[] = [];
  const speed: number[] = [];
  const directions: number[] = [];

  let dir = Math.random() * 360;

  for (let i = 0; i < n; i++) {
    x.push(i * 0.5); // hours
    speed.push(5 + Math.random() * 25);
    // Direction drifts gradually
    dir += (Math.random() - 0.5) * 40;
    if (dir < 0) dir += 360;
    if (dir >= 360) dir -= 360;
    directions.push(dir);
  }

  return {
    directions,
    chartData: [{ x, series: [speed] }],
  };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  size: number,
): void {
  const rad = (angle - 90) * (Math.PI / 180); // 0=N, 90=E
  const len = size;
  const headLen = len * 0.35;
  const headAngle = Math.PI / 6;

  const tipX = cx + Math.cos(rad) * len;
  const tipY = cy + Math.sin(rad) * len;
  const tailX = cx - Math.cos(rad) * len * 0.5;
  const tailY = cy - Math.sin(rad) * len * 0.5;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - headLen * Math.cos(rad - headAngle),
    tipY - headLen * Math.sin(rad - headAngle),
  );
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - headLen * Math.cos(rad + headAngle),
    tipY - headLen * Math.sin(rad + headAngle),
  );
  ctx.stroke();
}

export default function WindDirection() {
  const { directions, chartData } = useMemo(() => generateWindData(), []);

  const onDraw: DrawCallback = ({ ctx, valToX, valToY }) => {
    const group = chartData[0];
    if (group == null) return;

    const xArr = group.x;
    const speedArr = group.series[0];
    if (speedArr == null) return;

    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (let i = 0; i < xArr.length; i++) {
      const speed = speedArr[i] as number;
      const dir = directions[i];
      if (dir == null) continue;

      const px = valToX(xArr[i] as number);
      const py = valToY(speed, 'y');
      if (px == null || py == null) continue;

      // Arrow size proportional to wind speed
      const arrowSize = 4 + (speed / 30) * 6;
      drawArrow(ctx, px, py, dir, arrowSize);
    }
  };

  const fmtHour = (splits: number[]) => splits.map(v => `${v.toFixed(0)}h`);

  return (
    <Chart width={800} height={400} data={chartData} onDraw={onDraw} ylabel="Wind Speed (km/h)">
      <Axis scale="x" label="Time (hours)" values={fmtHour} />
      <Series group={0} index={0} label="Speed"
        dash={[4, 3]} />
    </Chart>
  );
}
