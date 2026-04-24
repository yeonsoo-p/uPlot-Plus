import { Chart, Scale, Series, Axis, fmtSuffix, Side } from 'uplot-plus';

function generateData() {
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
    <Chart width="auto" height={400} data={data} xlabel="Sample">
      <Scale id="temp"  />
      <Scale id="humid"  />
      <Axis scale="temp" label="Temperature" values={fmtSuffix('°C', 1)} stroke="#e74c3c" />
      <Axis scale="humid" side={Side.Right} label="Humidity" values={fmtSuffix('%')} stroke="#3498db" grid={{ show: false }} />
      <Series yScale="temp" stroke="#e74c3c" label="Temperature" />
      <Series yScale="humid" stroke="#3498db" label="Humidity" />
    </Chart>
  );
}
