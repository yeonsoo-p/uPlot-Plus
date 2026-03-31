import React, { useMemo } from 'react';
import { Chart, Series, Axis } from 'uplot-plus';

export default function TimePeriods() {
  // Hourly data: 48 hours
  const hourly = useMemo(() => {
    const base = new Date(2024, 5, 1, 0, 0, 0).getTime() / 1000;
    const x = Array.from({ length: 48 }, (_, i) => base + i * 3600);
    const y = x.map((_, i) => 20 + Math.sin(i * 0.26) * 8 + (Math.random() - 0.5) * 2);
    return [{ x, series: [y] }];
  }, []);

  // Daily data: 60 days
  const daily = useMemo(() => {
    const base = new Date(2024, 0, 1).getTime() / 1000;
    const x = Array.from({ length: 60 }, (_, i) => base + i * 86400);
    const y = x.map((_, i) => 100 + Math.sin(i * 0.1) * 30 + (Math.random() - 0.5) * 10);
    return [{ x, series: [y] }];
  }, []);

  // Monthly data: 36 months
  const monthly = useMemo(() => {
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < 36; i++) {
      const d = new Date(2022, i, 1);
      x.push(d.getTime() / 1000);
      y.push(500 + Math.sin(i * 0.17) * 200 + (Math.random() - 0.5) * 50);
    }
    return [{ x, series: [y] }];
  }, []);

  const fmtHour = (splits: number[]) =>
    splits.map(s => {
      const d = new Date(s * 1000);
      return `${d.getHours()}:00`;
    });

  const fmtDay = (splits: number[]) =>
    splits.map(s => {
      const d = new Date(s * 1000);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

  const fmtMonth = (splits: number[]) =>
    splits.map(s => {
      const d = new Date(s * 1000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Time series at different granularities: hourly, daily, and monthly.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={160} data={hourly} title="Hourly (48h)">
          <Axis scale="x" values={fmtHour} />
          <Series group={0} index={0} label="Hourly" />
        </Chart>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={160} data={daily} title="Daily (60d)">
          <Axis scale="x" values={fmtDay} />
          <Series group={0} index={0} label="Daily" />
        </Chart>
      </div>
      <div>
        <Chart width={800} height={160} data={monthly} title="Monthly (3yr)">
          <Axis scale="x" values={fmtMonth} />
          <Series group={0} index={0} label="Monthly" />
        </Chart>
      </div>
    </div>
  );
}
