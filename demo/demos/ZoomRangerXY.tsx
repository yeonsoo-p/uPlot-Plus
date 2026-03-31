import React, { useMemo, useState, useCallback } from 'react';
import { Chart, Scale, Series, Axis, ZoomRanger, Side } from 'uplot-plus';

function generateData() {
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
      <Chart width={800} height={300} data={data} actions={[['wheel', 'zoomXY']]} title="Detail view (controlled by ranger below)" ylabel="Signal A">
        <Scale id="x" auto={range == null} min={range?.[0]} max={range?.[1]} />
        <Scale id="y2"  />
        <Axis scale="y2" side={Side.Right} label="Signal B" />
        <Series group={0} index={0} label="Signal A" />
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
