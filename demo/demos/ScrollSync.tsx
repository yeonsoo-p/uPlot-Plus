import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

function makeData(offset: number): ChartData {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.05 + offset) * 30 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y] }];
}

const COLORS = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'];
const LABELS = ['CPU', 'Memory', 'Disk I/O', 'Network', 'GPU', 'Swap'];

export default function ScrollSync() {
  const datasets = useMemo(() => LABELS.map((_, i) => makeData(i * 0.7)), []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Multiple synced charts in a scrollable container. All share <code>syncKey=&quot;scroll&quot;</code>.
      </p>
      <div style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
        {LABELS.map((label, i) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <Chart width={760} height={150} data={datasets[i]!} syncKey="scroll">
              <Scale id="x" />
              <Scale id="y"  />
              <Axis scale="x" />
              <Axis scale="y" label={label} />
              <Series group={0} index={0} yScale="y" stroke={COLORS[i]!} width={2} label={label} />
              <Legend />
            </Chart>
          </div>
        ))}
      </div>
    </div>
  );
}
