import { Chart, Scale, Series, Legend } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  // Data stays between ~30-70 most of the time
  const y = x.map(i => Math.sin(i * 0.08) * 20 + 50 + (Math.random() - 0.5) * 5);
  return [{ x, series: [y] }];
}

export default function SoftMinMax() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
        <Scale
          id="y"
          auto


          range={{
            min: { soft: 0, mode: 1 },
            max: { soft: 100, mode: 1 },
          }}
        />
        <Series group={0} index={0} label="Data (soft 0-100)" />
        <Legend />
      </Chart>
    </div>
  );
}
