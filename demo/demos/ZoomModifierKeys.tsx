import { Chart, Series, Legend } from 'uplot-plus';

function generateData() {
  const N = 500;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < N; i++) {
    const t = i * 0.02;
    x.push(t);
    y1.push(Math.sin(t * 3) * 40 + 50);
    y2.push(Math.cos(t * 2) * 25 + 30);
  }

  return [{ x, series: [y1, y2] }];
}

export default function ZoomModifierKeys() {
  const data = generateData();

  return (
    <div>
      <Chart
        width={800}
        height={400}
        data={data}
        actions={[['shiftWheel', 'zoomX'], ['altWheel', 'zoomY'], ['wheel', 'none']]}
        xlabel="Time"
        ylabel="Value"
      >
        <Series group={0} index={0} label="Sine" />
        <Series group={0} index={1} label="Cosine" />
        <Legend />
      </Chart>
    </div>
  );
}
