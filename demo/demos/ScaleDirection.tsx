import { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Direction, Side, fmtSuffix } from 'uplot-plus';

function generateData() {
  const n = 50;
  const x = Array.from({ length: n }, (_, i) => i);
  // Depth in meters — increases with sample index
  const depth = x.map(i => i * 2 + (Math.random() - 0.5) * 0.5);
  const temp = x.map(i => 25 - i * 0.3 + (Math.random() - 0.5) * 0.5);

  return [{ x, series: [depth, temp] }];
}

export default function ScaleDirection() {
  const data = useMemo(() => generateData(), []);

  return (
    <Chart width="auto" height={400} data={data} xlabel="Sample">
      <Scale id="depth"  dir={Direction.Backward} />
      <Scale id="temp"  />
      <Axis scale="depth" label="Depth" values={fmtSuffix('m')} stroke="#2980b9" />
      <Axis scale="temp" side={Side.Right} label="Temperature (°C)" stroke="#e67e22" grid={{ show: false }} />
      <Series yScale="depth" stroke="#2980b9" label="Depth" />
      <Series yScale="temp" stroke="#e67e22" label="Temperature" />
    </Chart>
  );
}
