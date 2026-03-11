import React, { useMemo, useState, useCallback } from 'react';
import { Chart, Scale, Series, Axis, ZoomRanger } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 400;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(i);
    y1.push(Math.sin(i * 0.04) * 60 + 50 + Math.random() * 8);
    y2.push(Math.cos(i * 0.06) * 25 + 30 + Math.random() * 5);
  }
  return [{ x, series: [y1, y2] }];
}

export default function ZoomRangerXYDemo() {
  const data = useMemo(() => generateData(), []);
  const [range, setRange] = useState<[number, number] | null>(null);

  const onRangeChange = useCallback((min: number, max: number) => {
    setRange([min, max]);
  }, []);

  return (
    <div>
      <h4 style={{ margin: '0 0 8px' }}>Detail view (controlled by ranger below)</h4>
      <Chart width={800} height={300} data={data} cursor={{ wheelZoom: true }}>
        <Scale id="x" ori={0} dir={1} auto={range == null} min={range?.[0]} max={range?.[1]} />
        <Scale id="y" auto ori={1} dir={1} />
        <Scale id="y2" auto ori={1} dir={1} />
        <Axis scale="x" side={2} />
        <Axis scale="y" side={3} label="Signal A" />
        <Axis scale="y2" side={1} label="Signal B" />
        <Series group={0} index={0} yScale="y" stroke="#4caf50" label="Signal A" />
        <Series group={0} index={1} yScale="y2" stroke="#9c27b0" label="Signal B" />
      </Chart>

      <div style={{ marginTop: 8 }}>
        <h4 style={{ margin: '0 0 4px' }}>Overview (drag to select range)</h4>
        <ZoomRanger
          width={800}
          height={80}
          data={data}
          onRangeChange={onRangeChange}
          initialRange={[50, 300]}
          colors={['#4caf50', '#9c27b0']}
          grips
        />
      </div>
    </div>
  );
}
