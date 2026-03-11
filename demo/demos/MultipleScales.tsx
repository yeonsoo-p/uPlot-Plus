import React from 'react';
import { Chart, Scale, Series, Axis, fmtSuffix, Side } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x: number[] = [];
  const temp: number[] = [];
  const humid: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    temp.push(20 + Math.sin(i * 0.1) * 8 + (Math.random() - 0.5) * 2);
    humid.push(60 + Math.cos(i * 0.08) * 20 + (Math.random() - 0.5) * 5);
  }

  return [{ x, series: [temp, humid] }];
}

export default function MultipleScales() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="x" />
      <Scale id="temp"  />
      <Scale id="humid"  />
      <Axis scale="x" label="Sample" />
      <Axis scale="temp" label="Temperature" values={fmtSuffix('°C', 1)} stroke="#e74c3c" />
      <Axis scale="humid" side={Side.Right} label="Humidity" values={fmtSuffix('%')} stroke="#3498db" grid={{ show: false }} />
      <Series group={0} index={0} yScale="temp" stroke="#e74c3c" width={2} label="Temperature" />
      <Series group={0} index={1} yScale="humid" stroke="#3498db" width={2} label="Humidity" />
    </Chart>
  );
}
