import { Chart, Series } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 50 + 50);
    y2.push(Math.cos(t) * 30 + 50);
  }

  return [{ x, series: [y1, y2] }];
}

export default function BasicLine() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Time (s)" ylabel="Value">
      <Series label="Sine" />
      <Series label="Cosine" />
    </Chart>
  );
}
