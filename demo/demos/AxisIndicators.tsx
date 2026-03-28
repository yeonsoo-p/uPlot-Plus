import React, { useMemo } from 'react';
import { Chart, Series, Axis, Side } from '../../src';

export default function AxisIndicators() {
  const data = useMemo(() => {
    const n = 80;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.1) * 40 + 50);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Each axis has different grid, tick, and border styles with custom colors, widths, and dash patterns.
      </p>
      <Chart width={800} height={400} data={data}>
        {/* Bottom x-axis: blue grid dashed, red ticks, green border */}
        <Axis
          scale="x"
          side={Side.Bottom}
          label="X Axis (bottom)"
          grid={{ show: true, stroke: '#3498db', width: 1, dash: [4, 4] }}
          ticks={{ show: true, stroke: '#e74c3c', width: 2, size: 8 }}
          border={{ show: true, stroke: '#2ecc71', width: 2 }}
        />

        {/* Top x-axis: dotted grid, no ticks, thick border */}
        <Axis
          scale="x"
          side={Side.Top}
          label="X Axis (top)"
          grid={{ show: true, stroke: 'rgba(155, 89, 182, 0.3)', width: 1, dash: [2, 6] }}
          ticks={{ show: false }}
          border={{ show: true, stroke: '#9b59b6', width: 3 }}
        />

        {/* Left y-axis: solid grid, dash ticks, dashed border */}
        <Axis
          scale="y"
         
          label="Y Axis (left)"
          grid={{ show: true, stroke: 'rgba(230, 126, 34, 0.3)', width: 1 }}
          ticks={{ show: true, stroke: '#e67e22', width: 1, size: 6, dash: [3, 3] }}
          border={{ show: true, stroke: '#e67e22', width: 2, dash: [6, 3] }}
        />

        {/* Right y-axis: no grid, thick ticks, solid border */}
        <Axis
          scale="y"
          side={Side.Right}
          label="Y Axis (right)"
          grid={{ show: false }}
          ticks={{ show: true, stroke: '#c0392b', width: 3, size: 10 }}
          border={{ show: true, stroke: '#c0392b', width: 1 }}
        />

        <Series group={0} index={0} label="Signal" />
      </Chart>
    </div>
  );
}
