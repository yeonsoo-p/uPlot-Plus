import { Chart, Series, Legend, linear, monotoneCubic, catmullRom, stepped, bars, points } from 'uplot-plus';

function generateData() {
  const n = 25;
  const x = Array.from({ length: n }, (_, i) => i);
  const base = x.map(i => Math.sin(i * 0.3) * 20 + 50 + (Math.random() - 0.5) * 8);
  // Same data for all series so differences are purely visual
  return [{ x, series: [base, base, base, base, base, base] }];
}

export default function LinePaths() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={500} data={data} xlabel="Index" ylabel="Value">
        <Series label="linear" paths={linear()} />
        <Series label="monotoneCubic" paths={monotoneCubic()} />
        <Series label="catmullRom" paths={catmullRom()} />
        <Series label="stepped" paths={stepped(1)} />
        <Series stroke="#9b59b6" label="bars" paths={bars()} />
        <Series label="points" paths={points()} points={{ show: true, size: 8, fill: '#1abc9c' }} />
        <Legend />
      </Chart>
    </div>
  );
}
