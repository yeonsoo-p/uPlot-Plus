import React from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

function makeData(offset: number) {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.05 + offset) * 30 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y] }];
}

const LABELS = ['CPU', 'Memory', 'Disk I/O', 'Network', 'GPU', 'Swap'];

export default function ScrollSync() {
  const datasets = LABELS.map((_, i) => makeData(i * 0.7));

  return (
    <div>
      <p className="text-demo text-muted mb-2">
        Multiple synced charts in a scrollable container. All share <code>syncKey=&quot;scroll&quot;</code>.
      </p>
      <div className="max-h-[500px] overflow-y-auto border border-border-light p-2">
        {LABELS.map((label, i) => (
          <div key={label} className="mb-3">
            <Chart width={760} height={150} data={datasets[i] ?? []} syncKey="scroll" ylabel={label}>
              <Series group={0} index={0} label={label} />
              <Legend />
            </Chart>
          </div>
        ))}
      </div>
    </div>
  );
}
