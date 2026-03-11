import React from 'react';
import { Chart, Scale, Series, Axis, HLine, VLine, Region, AnnotationLabel } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 150;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.04) * 30 + 50 + (Math.random() - 0.5) * 8);
  return [{ x, series: [y] }];
}

export default function Annotations() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Declarative annotation components: horizontal lines, vertical markers, shaded regions, and labels.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y" auto={false} min={10} max={90} />
        <Axis scale="x" label="Sample" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#2c3e50" width={2} label="Signal" />

        {/* Shaded region between y=40 and y=60 */}
        <Region yMin={40} yMax={60} yScale="y" fill="rgba(46,204,113,0.12)" stroke="rgba(46,204,113,0.4)" strokeWidth={1} dash={[3, 3]} />

        {/* Horizontal threshold lines */}
        <HLine value={65} yScale="y" stroke="#e74c3c" width={1.5} dash={[6, 4]} label="Upper threshold" />
        <HLine value={35} yScale="y" stroke="#3498db" width={1.5} dash={[6, 4]} label="Lower threshold" />

        {/* Vertical marker */}
        <VLine value={75} xScale="x" stroke="#8e44ad" width={1} dash={[4, 4]} />

        {/* Labels */}
        <AnnotationLabel x={76} y={80} text="Event" fill="#8e44ad" font="11px sans-serif" />
      </Chart>
    </div>
  );
}
