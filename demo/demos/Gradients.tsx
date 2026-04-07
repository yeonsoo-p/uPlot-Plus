import { Chart, Series, fadeGradient } from 'uplot-plus';

function generateData() {
  const n = 120;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 35 + 50);
    y2.push(Math.cos(t * 0.7) * 25 + 45);
  }

  return [{ x, series: [y1, y2] }];
}

export default function Gradients() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="Time" ylabel="Value">
        <Series group={0} index={0} stroke="#4285f4" fill={fadeGradient('#4285f4')} label="Blue Series" />
        <Series group={0} index={1} stroke="#9c27b0" fill={fadeGradient('#9c27b0', 0.7)} label="Purple Series" />
      </Chart>
    </div>
  );
}
