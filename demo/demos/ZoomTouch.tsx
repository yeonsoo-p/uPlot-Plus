import { Chart, Series } from 'uplot-plus';

function generateData() {
  const N = 500;
  const x = new Float64Array(N);
  const y = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    x[i] = i;
    y[i] = Math.sin(i * 0.02) * 50 + Math.random() * 10;
  }

  return [{ x, series: [y] }];
}

export default function ZoomTouch() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} >
        <Series label="Signal" />
      </Chart>
    </div>
  );
}
