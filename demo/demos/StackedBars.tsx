import React, { useMemo } from 'react';
import { Chart, Series, Axis, Band, Legend, stackedBars, stackGroup, fmtLabels } from 'uplot-plus';
import type { ChartData, BandConfig } from 'uplot-plus';

const months = [1, 2, 3, 4, 5, 6];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function makeStackedData() {
  const raw = {
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 30 + 10)),
      months.map(() => Math.round(Math.random() * 25 + 10)),
      months.map(() => Math.round(Math.random() * 20 + 5)),
    ],
  };
  const result = stackGroup(raw);
  return { data: [result.group] as ChartData, bands: result.bands };
}

export default function StackedBars() {
  const { data, bands } = useMemo(() => makeStackedData(), []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Stacked bars using <code>stackGroup()</code> to transform data and <code>Band</code> for shaded regions.
      </p>
      <Chart width={800} height={400} data={data} title="Stacked Bars" ylabel="Sales">
        <Axis scale="x" label="Month" values={fmtLabels(MONTH_NAMES)} />
        <Series group={0} index={0} stroke="#3498db" label="Product A" paths={stackedBars()} />
        <Series group={0} index={1} stroke="#2ecc71" label="Product B" paths={stackedBars()} />
        <Series group={0} index={2} stroke="#e74c3c" label="Product C" paths={stackedBars()} />
        {bands.map((b: BandConfig, i: number) => (
          <Band
            key={i}
            series={b.series}
            group={b.group}
            fill={
              b.series[0] === 2
                ? 'rgba(231,76,60,0.3)'
                : 'rgba(46,204,113,0.3)'
            }
          />
        ))}
        <Legend />
      </Chart>
    </div>
  );
}
