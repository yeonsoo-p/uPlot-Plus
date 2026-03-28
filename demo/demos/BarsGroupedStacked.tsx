import React, { useMemo } from 'react';
import { Chart, Series, Axis, Legend, groupedBars, fmtLabels } from '../../src';
import type { ChartData } from '../../src';

const months = [1, 2, 3, 4, 5, 6];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function makeGroupedData(): ChartData {
  return [{
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 60 + 20)),
      months.map(() => Math.round(Math.random() * 50 + 15)),
      months.map(() => Math.round(Math.random() * 40 + 10)),
    ],
  }];
}

export default function BarsGroupedStacked() {
  const data = useMemo(() => makeGroupedData(), []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Side-by-side grouped bars using the <code>groupedBars()</code> path builder.
      </p>
      <Chart width={800} height={400} data={data} title="Grouped Bars" ylabel="Sales">
        <Axis scale="x" label="Month" values={fmtLabels(MONTH_NAMES)} />
        <Series group={0} index={0} stroke="#2980b9" fill="rgba(41,128,185,0.7)" width={0} label="Product A" paths={groupedBars(0, 3)} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
        <Series group={0} index={1} stroke="#27ae60" fill="rgba(39,174,96,0.7)" width={0} label="Product B" paths={groupedBars(1, 3)} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
        <Series group={0} index={2} stroke="#e67e22" fill="rgba(230,126,34,0.7)" width={0} label="Product C" paths={groupedBars(2, 3)} fillTo={0} cursor={{ show: false }} points={{ show: false }} />
        <Legend />
      </Chart>
    </div>
  );
}
