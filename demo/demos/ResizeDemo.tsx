import React, { useState, useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

export default function ResizeDemo() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(400);

  const data: ChartData = useMemo(() => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.05) * 40 + 50 + (Math.random() - 0.5) * 5);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 24, alignItems: 'center' }}>
        <label>
          Width: {width}px
          <input
            type="range"
            min={300}
            max={1200}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
            style={{ marginLeft: 8, width: 200 }}
          />
        </label>
        <label>
          Height: {height}px
          <input
            type="range"
            min={150}
            max={600}
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            style={{ marginLeft: 8, width: 200 }}
          />
        </label>
      </div>
      <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
        <Chart width={width} height={height} data={data}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" label="Index" />
          <Axis scale="y" label="Value" />
          <Series group={0} index={0} yScale="y" stroke="#8e44ad" width={2} label="Signal" />
          <Legend />
        </Chart>
      </div>
    </div>
  );
}
