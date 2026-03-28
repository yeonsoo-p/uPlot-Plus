import React, { useMemo } from 'react';
import { Chart, Series } from '../../src';

export default function NiceScale() {
  const data1 = useMemo(() => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map(i => i * 0.37 + 2.1 + (Math.random() - 0.5) * 0.5);
    return [{ x, series: [y] }];
  }, []);

  const data2 = useMemo(() => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.12) * 1234 + 5000);
    return [{ x, series: [y] }];
  }, []);

  const data3 = useMemo(() => {
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
        <Chart width={800} height={180} data={data1} title="Small range (~2-20)">
          <Series group={0} index={0} label="Small" />
        </Chart>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={180} data={data2} title="Medium range (~3700-6200)">
          <Series group={0} index={0} label="Medium" />
        </Chart>
      </div>
      <div>
        <Chart width={800} height={180} data={data3} title="Tiny range (~0.004-0.056)">
          <Series group={0} index={0} label="Tiny" />
        </Chart>
      </div>
    </div>
  );
}
