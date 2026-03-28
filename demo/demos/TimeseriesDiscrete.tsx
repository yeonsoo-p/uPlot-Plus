import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend, stepped } from '../../src';

export default function TimeseriesDiscrete() {
  const data = useMemo(() => {
    const base = new Date(2024, 5, 1, 0, 0, 0).getTime() / 1000;
    const n = 200;
    const x: number[] = [];
    const status: number[] = [];

    let currentStatus = 0;
    for (let i = 0; i < n; i++) {
      x.push(base + i * 300); // 5-minute intervals
      // Randomly change status
      if (Math.random() < 0.05) {
        currentStatus = Math.floor(Math.random() * 3);
      }
      status.push(currentStatus);
    }

    return [{ x, series: [status] }];
  }, []);

  const fmtTime = (splits: number[]) =>
    splits.map(s => {
      const d = new Date(s * 1000);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

  const fmtStatus = (splits: number[]) =>
    splits.map(v => {
      if (v === 0) return 'OK';
      if (v === 1) return 'WARN';
      if (v === 2) return 'CRIT';
      return String(v);
    });

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Discrete status values (0=OK, 1=WARN, 2=CRIT) over time using stepped interpolation.
      </p>
      <Chart width={800} height={300} data={data}>
        <Scale id="y" min={-0.5} max={2.5} />
        <Axis scale="x" label="Time" values={fmtTime} />
        <Axis scale="y" label="Status" values={fmtStatus} />
        <Series
          group={0}
          index={0}
          stroke="#e74c3c"
          fill="rgba(231, 76, 60, 0.15)"
          label="Service Status"
          paths={stepped(1)}
          fillTo={-0.5}
        />
        <Legend />
      </Chart>
    </div>
  );
}
