import React from 'react';
import { Chart, Scale, Series, Axis, Side } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 200;
  const x: number[] = [];
  const cpu: (number | null)[] = [];
  const ram: (number | null)[] = [];
  const tcp: (number | null)[] = [];

  for (let i = 0; i < n; i++) {
    x.push(1566453600 + i * 60);
    cpu.push(+(Math.random() * 0.5 + 0.1).toFixed(2));
    ram.push(+(14 + Math.random() * 0.1).toFixed(2));
    tcp.push(+(Math.random() * 0.02).toFixed(3));
  }

  // Inject null gaps
  for (let i = 35; i <= 40; i++) cpu[i] = null;
  for (const i of [79, 80, 91, 125, 126, 127]) ram[i] = null;

  return [{ x, series: [cpu, ram, tcp] }];
}

const fmtPct = (splits: number[]) => splits.map(v => v.toFixed(1) + '%');
const fmtMB = (splits: number[]) => splits.map(v => v.toFixed(2) + ' MB');

export default function MissingData() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x"  />
      <Scale id="pct"  />
      <Scale id="mb"  />
      <Axis scale="x" />
      <Axis scale="pct" values={fmtPct} />
      <Axis scale="mb" side={Side.Right} values={fmtMB} grid={{ show: false }} />
      <Series group={0} index={0} yScale="pct" stroke="red" fill="rgba(255,0,0,0.05)" width={2} label="CPU" />
      <Series group={0} index={1} yScale="pct" stroke="blue" fill="rgba(0,0,255,0.05)" width={2} label="RAM" />
      <Series group={0} index={2} yScale="mb" stroke="green" fill="rgba(0,255,0,0.05)" width={2} label="TCP Out" />
    </Chart>
  );
}
