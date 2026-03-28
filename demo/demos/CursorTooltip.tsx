import React from 'react';
import { Chart, Series, Axis, Tooltip } from '../../src';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i * 0.1);
  const cpu = x.map(t => 30 + Math.sin(t) * 20 + (Math.random() - 0.5) * 10);
  const mem = x.map(t => 50 + Math.cos(t * 0.8) * 15 + (Math.random() - 0.5) * 5);

  return {
    data1: [{ x, series: [cpu] }],
    data2: [{ x, series: [mem] }],
  };
}

const fmtPct = (splits: number[]) => splits.map(v => v.toFixed(0) + '%');

export default function CursorTooltip() {
  const { data1, data2 } = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Two synced charts with tooltips. Hover over either chart and both tooltips follow.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={220} data={data1} syncKey="tt" xlabel="Time">
          <Axis scale="y" label="CPU" values={fmtPct} />
          <Series group={0} index={0} fill="rgba(231,76,60,0.1)" label="CPU %" />
          <Tooltip />
        </Chart>
      </div>
      <Chart width={800} height={220} data={data2} syncKey="tt" xlabel="Time">
        <Axis scale="y" label="Memory" values={fmtPct} />
        <Series group={0} index={0} fill="rgba(52,152,219,0.1)" label="Memory %" />
        <Tooltip />
      </Chart>
    </div>
  );
}
