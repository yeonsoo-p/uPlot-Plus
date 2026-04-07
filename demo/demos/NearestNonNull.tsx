import { Chart, Series, Legend } from 'uplot-plus';

function generateData() {
  const n = 60;
  const x = Array.from({ length: n }, (_, i) => i);
  const y: (number | null)[] = x.map(i => Math.sin(i * 0.15) * 30 + 50);

  // Sprinkle lots of nulls
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.4) {
      y[i] = null;
    }
  }

  return [{ x, series: [y] }];
}

export default function NearestNonNull() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
        <Series
          group={0}
          index={0}
          label="Sparse Signal"
          points={{ show: true, size: 6, fill: '#2980b9' }}
        />
        <Legend />
      </Chart>
    </div>
  );
}
