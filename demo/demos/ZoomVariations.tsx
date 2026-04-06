import { Chart, Series, Legend } from 'uplot-plus';

function generateData() {
  const N = 500;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < N; i++) {
    const t = i * 0.02;
    x.push(t);
    y.push(Math.sin(t * 3) * 40 + 50 + Math.sin(t * 7) * 10);
  }

  return [{ x, series: [y] }];
}

export default function ZoomVariations() {
  const data = generateData();

  return (
    <div>
      <Chart width={800} height={400} data={data} actions={[['wheel', 'zoomXY']]} xlabel="X" ylabel="Value">
        <Series group={0} index={0} label="Sine Wave" />
        <Legend />
      </Chart>
    </div>
  );
}
