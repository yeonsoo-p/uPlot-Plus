import { Chart, Series, Axis } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => 1_000_000 + Math.sin(i * 0.08) * 500_000 + Math.random() * 100_000);
  return [{ x, series: [y] }];
}

export default function AxisAutosize() {
  const data = generateData();

  const fmtMillions = (splits: number[]) =>
    splits.map(v => v.toLocaleString());

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="Sample">
        <Axis scale="y" label="Value" values={fmtMillions} />
        <Series group={0} index={0} label="Large Values" />
      </Chart>
    </div>
  );
}
