import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend, fmtMonthName } from '../../src';
import type { ChartData } from '../../src';

export default function MonthsTimeSeries() {
  const data: ChartData = useMemo(() => {
    // Generate monthly timestamps for 2 years
    const x: number[] = [];
    const y1: number[] = [];
    const y2: number[] = [];

    for (let year = 2024; year <= 2025; year++) {
      for (let month = 0; month < 12; month++) {
        const ts = new Date(year, month, 1).getTime() / 1000;
        x.push(ts);
        y1.push(Math.sin(month * 0.5) * 20 + 50 + (Math.random() - 0.5) * 5);
        y2.push(Math.cos(month * 0.4) * 15 + 40 + (Math.random() - 0.5) * 8);
      }
    }

    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Monthly time data with custom month-name formatter on the x-axis.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x"  />
        <Scale id="y"  />
        <Axis scale="x" label="Month" values={fmtMonthName()} />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Metric A" />
        <Series group={0} index={1} yScale="y" stroke="#3498db" width={2} label="Metric B" />
        <Legend />
      </Chart>
    </div>
  );
}
