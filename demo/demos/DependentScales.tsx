import React from 'react';
import { Chart, Scale, Series, Axis, Side, fmtSuffix } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  // Temperature in Fahrenheit
  const tempF = x.map(i => 60 + Math.sin(i * 0.08) * 20 + (Math.random() - 0.5) * 5);

  return [{ x, series: [tempF] }];
}

const fmtC = (splits: number[]) => splits.map(v => ((v - 32) * 5 / 9).toFixed(1) + '°C');

export default function DependentScales() {
  const data = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="Day">
      <Scale id="f"  />
      <Axis scale="f" label="Fahrenheit" values={fmtSuffix('°F')} stroke="#e74c3c" />
      <Axis scale="f" side={Side.Right} label="Celsius" values={fmtC} stroke="#3498db" grid={{ show: false }} />
      <Series group={0} index={0} yScale="f" stroke="#e74c3c" label="Temperature" />
    </Chart>
  );
}
