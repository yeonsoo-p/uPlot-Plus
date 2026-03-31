import React, { useMemo, useState, useCallback } from 'react';
import { Chart, Scale, Series, ZoomRanger } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function generateData(): ChartData {
  const n = 500;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(i);
    y1.push(Math.sin(i * 0.05) * 50 + 50 + Math.random() * 10);
    y2.push(Math.cos(i * 0.03) * 30 + 40 + Math.random() * 8);
  }
  return [{ x, series: [y1, y2] }];
}

export default function ZoomRangerDemo() {
  const data = useMemo(() => generateData(), []);
  const [range, setRange] = useState<[number, number] | null>(null);

  const onRangeChange = useCallback((min: number, max: number) => {
    setRange([min, max]);
  }, []);

  return (
    <div>
      <Chart width={800} height={300} data={data}>
        <Scale id="x" auto={range == null} min={range?.[0]} max={range?.[1]} />
        <Series group={0} index={0} label="Signal A" />
        <Series group={0} index={1} label="Signal B" />
      </Chart>

      <div className="mt-2">
        <ZoomRanger
          width={800}
          height={60}
          data={data}
          onRangeChange={onRangeChange}
          initialRange={[100, 400]}
          colors={['#2196f3', '#ff9800']}
        />
      </div>
    </div>
  );
}
