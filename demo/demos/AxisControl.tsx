import { Chart, Scale, Series, Axis } from 'uplot-plus';

function generateData() {
  const n = 50000;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    x[i] = i;
    y[i] = Math.sin(i * 0.00002) * 40 + Math.sin(i * 0.001) * 5 + Math.sin(i * 0.1) * 2 + (Math.random() - 0.5) * 3;
  }

  return [{ x: Array.from(x), series: [Array.from(y)] }];
}

export default function AxisControl() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Sample Index">
      <Scale id="y" auto={false} min={-50} max={50} />
      <Axis scale="y" label="Amplitude" labelSize={20} space={50} />
      <Series group={0} index={0} label="Signal" />
    </Chart>
  );
}
