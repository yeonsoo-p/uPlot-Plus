import { Chart, Series, Legend, focus } from 'uplot-plus';

function generateData() {
  const N = 200;
  const x = new Float64Array(N);
  const s0 = new Float64Array(N);
  const s1 = new Float64Array(N);
  const s2 = new Float64Array(N);
  const s3 = new Float64Array(N);
  const s4 = new Float64Array(N);

  for (let i = 0; i < N; i++) {
    x[i] = i;
    s0[i] = Math.sin(i * 0.05) * 50 + 50;
    s1[i] = Math.cos(i * 0.03) * 40 + 60;
    s2[i] = Math.sin(i * 0.08 + 1) * 30 + 40;
    s3[i] = Math.cos(i * 0.06 + 2) * 35 + 55;
    s4[i] = Math.sin(i * 0.04 + 3) * 25 + 45;
  }
  const series = [s0, s1, s2, s3, s4];

  return [{ x, series }];
}

export default function FocusCursor() {
  const data = generateData();

  const colors = ['#e24d42', '#1f78b4', '#33a02c', '#ff7f00', '#6a3d9a'];

  return (
    <Chart
      width="auto"
      height={400}
      data={data}
      actions={[['hover', focus(0.15)]]}
    >
      {colors.map((_, i) => (
        <Series
          key={i}
          group={0}
          index={i}
          label={`Series ${i + 1}`}
        />
      ))}
      <Legend />
    </Chart>
  );
}
