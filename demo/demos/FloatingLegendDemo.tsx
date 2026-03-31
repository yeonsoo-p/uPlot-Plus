import React from 'react';
import { Chart, Series, FloatingLegend } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  const y3: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.cos(t) * 30 + 50);
    y3.push(Math.sin(t * 0.7 + 1) * 25 + 50);
  }
  return [{ x, series: [y1, y2, y3] }];
}

/**
 * Two FloatingLegend modes:
 * 1. Cursor mode — follows the cursor like a tooltip
 * 2. Draggable mode — fixed position, drag to move, fades when not hovered
 */
export default function FloatingLegendDemo() {
  const data = generateData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mt-0 mb-2">Cursor mode — follows cursor</h4>
        <Chart width={800} height={350} data={data} xlabel="Time" ylabel="Value">
          <Series group={0} index={0} label="Temperature" />
          <Series group={0} index={1} label="Humidity" />
          <Series group={0} index={2} label="Pressure" />
          <FloatingLegend mode="cursor" />
        </Chart>
      </div>

      <div>
        <h4 className="mt-0 mb-2">Draggable mode — fades when idle, drag to reposition</h4>
        <Chart width={800} height={350} data={data} xlabel="Time" ylabel="Value">
          <Series group={0} index={0} label="Sensor A" />
          <Series group={0} index={1} label="Sensor B" />
          <Series group={0} index={2} label="Sensor C" />
          <FloatingLegend mode="draggable" position="top-right" />
        </Chart>
      </div>
    </div>
  );
}
