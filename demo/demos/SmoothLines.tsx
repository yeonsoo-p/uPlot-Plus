import { Chart, Series, linear, monotoneCubic, catmullRom } from 'uplot-plus';

function generateData() {
  const n = 30;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.3) * 25 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y, y, y] }];
}

export default function SmoothLines() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
      <Series group={0} index={0} label="Linear" paths={linear()} />
      <Series group={0} index={1} label="Monotone Cubic" paths={monotoneCubic()} />
      <Series group={0} index={2} label="Catmull-Rom" paths={catmullRom()} />
    </Chart>
  );
}
