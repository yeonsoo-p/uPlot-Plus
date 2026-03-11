import React, { useMemo, useState, useCallback } from 'react';
import { Chart, Scale, Series, Axis, ZoomRanger } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 300;
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(i);
    y.push(Math.sin(i * 0.08) * 40 + 50 + Math.random() * 5);
  }
  return [{ x, series: [y] }];
}

export default function ZoomRangerGripsDemo() {
  const data = useMemo(() => generateData(), []);
  const [range, setRange] = useState<[number, number] | null>(null);

  const onRangeChange = useCallback((min: number, max: number) => {
    setRange([min, max]);
  }, []);

  return (
    <div>
      <Chart width={800} height={300} data={data}>
        <Scale id="x" ori={0} dir={1} auto={range == null} min={range?.[0]} max={range?.[1]} />
        <Scale id="y" auto ori={1} dir={1} />
        <Axis scale="x" side={2} />
        <Axis scale="y" side={3} />
        <Series group={0} index={0} yScale="y" stroke="#e91e63" label="Value" />
      </Chart>

      <div style={{ marginTop: 8 }}>
        <ZoomRanger
          width={800}
          height={60}
          data={data}
          onRangeChange={onRangeChange}
          initialRange={[50, 200]}
          colors={['#e91e63']}
          grips
        />
      </div>
    </div>
  );
}
