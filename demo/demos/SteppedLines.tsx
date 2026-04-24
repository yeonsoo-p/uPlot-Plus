import { Chart, Series, stepped } from 'uplot-plus';

function generateData() {
  const n = 40;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.2) * 30 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y, y, y] }];
}

export default function SteppedLines() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
      <Series label="Step After (default)" paths={stepped(1)} />
      <Series label="Step Before" paths={stepped(-1)} />
      <Series label="Mid Step" paths={stepped(0)} />
    </Chart>
  );
}
