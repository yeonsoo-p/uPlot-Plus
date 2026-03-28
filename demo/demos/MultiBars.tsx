import React from 'react';
import { Chart, Series, Axis, groupedBars, fmtPrefix, fmtWrap } from '../../src';

function generateData() {
  const quarters = [1, 2, 3, 4];
  return [{
    x: quarters,
    series: [
      quarters.map(() => Math.round(Math.random() * 80 + 40)),
      quarters.map(() => Math.round(Math.random() * 60 + 30)),
      quarters.map(() => Math.round(Math.random() * 50 + 20)),
    ],
  }];
}

export default function MultiBars() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Grouped bar chart: 3 product lines shown side-by-side per quarter.
      </p>
      <Chart width={800} height={400} data={data}>
        <Axis scale="x" label="Quarter" values={fmtPrefix('Q')} />
        <Axis scale="y" label="Revenue" values={fmtWrap('$', 'K')} />
        <Series
          group={0} index={0}
          stroke="#2980b9" fill="rgba(41,128,185,0.75)" width={0}
          label="Widgets" paths={groupedBars(0, 3)} fillTo={0}
          cursor={{ show: false }} points={{ show: false }}
        />
        <Series
          group={0} index={1}
          stroke="#27ae60" fill="rgba(39,174,96,0.75)" width={0}
          label="Gadgets" paths={groupedBars(1, 3)} fillTo={0}
          cursor={{ show: false }} points={{ show: false }}
        />
        <Series
          group={0} index={2}
          stroke="#8e44ad" fill="rgba(142,68,173,0.75)" width={0}
          label="Gizmos" paths={groupedBars(2, 3)} fillTo={0}
          cursor={{ show: false }} points={{ show: false }}
        />
      </Chart>
    </div>
  );
}
