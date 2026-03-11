import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

export default function NiceScale() {
  const data1: ChartData = useMemo(() => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map(i => i * 0.37 + 2.1 + (Math.random() - 0.5) * 0.5);
    return [{ x, series: [y] }];
  }, []);

  const data2: ChartData = useMemo(() => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.12) * 1234 + 5000);
    return [{ x, series: [y] }];
  }, []);

  const data3: ChartData = useMemo(() => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map(i => 0.001 * i + 0.005 + (Math.random() - 0.5) * 0.002);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Auto-range produces &quot;nice&quot; round tick numbers for different data magnitudes.
      </p>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 4px' }}>Small range (~2-20)</h4>
        <Chart width={800} height={180} data={data1}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Small" />
        </Chart>
      </div>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 4px' }}>Medium range (~3700-6200)</h4>
        <Chart width={800} height={180} data={data2}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2} label="Medium" />
        </Chart>
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px' }}>Tiny range (~0.004-0.056)</h4>
        <Chart width={800} height={180} data={data3}>
          <Scale id="x" />
          <Scale id="y"  />
          <Axis scale="x" />
          <Axis scale="y" />
          <Series group={0} index={0} yScale="y" stroke="#27ae60" width={2} label="Tiny" />
        </Chart>
      </div>
    </div>
  );
}
