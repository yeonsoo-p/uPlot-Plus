import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function ScalePadding() {
  const data: ChartData = useMemo(() => {
    const n = 80;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.1) * 30 + 50);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Scale with range padding adds extra space around the data range (10% on each side).
      </p>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 4px' }}>With padding (10%)</h4>
        <Chart width={800} height={200} data={data}>
          <Scale id="x" />
          <Scale
            id="y"
            auto
           
           
            range={{
              min: { pad: 0.1 },
              max: { pad: 0.1 },
            }}
          />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Padded" />
        </Chart>
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px' }}>Without padding (default)</h4>
        <Chart width={800} height={200} data={data}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#3498db" width={2} label="Default" />
        </Chart>
      </div>
    </div>
  );
}
