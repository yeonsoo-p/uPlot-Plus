import { Chart, Series, Tooltip } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  const y3: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.1;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.sin(t + 2) * 30 + 50);
    y3.push(Math.sin(t + 4) * 20 + 50);
  }

  return [{ x, series: [y1, y2, y3] }];
}

export default function Tooltips() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="Time" ylabel="Value">
        <Series group={0} index={0} label="Alpha" />
        <Series group={0} index={1} label="Beta" />
        <Series group={0} index={2} label="Gamma" />
        <Tooltip />
      </Chart>
    </div>
  );
}
