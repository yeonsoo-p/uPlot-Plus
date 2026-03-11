import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

const singlePoint: ChartData = [{ x: [1], series: [[42]] }];
const twoPoints: ChartData = [{ x: [0, 1], series: [[10, 20]] }];
const allNulls: ChartData = [{ x: [0, 1, 2, 3], series: [[null, null, null, null]] }];

function MiniChart({ title, data }: { title: string; data: ChartData }) {
  return (
    <div style={{ display: 'inline-block', marginRight: 16, marginBottom: 16, verticalAlign: 'top' }}>
      <h4 style={{ fontSize: 13, marginBottom: 4, color: '#555' }}>{title}</h4>
      <Chart width={240} height={180} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" />
        <Axis scale="y" />
        <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2}
          points={{ show: true, size: 6, fill: '#2980b9' }} />
      </Chart>
    </div>
  );
}

export default function NoData() {
  return (
    <div>
      <MiniChart title="Single Point" data={singlePoint} />
      <MiniChart title="Two Points" data={twoPoints} />
      <MiniChart title="All Nulls" data={allNulls} />
    </div>
  );
}
