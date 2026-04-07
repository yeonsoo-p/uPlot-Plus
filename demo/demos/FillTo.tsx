import { Chart, Series } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.08) * 40 + 10);
  const y2 = x.map(i => Math.cos(i * 0.06) * 30 + 50);
  const y3 = x.map(i => Math.sin(i * 0.1 + 1) * 20 + 60);

  return [{ x, series: [y1, y2, y3] }];
}

export default function FillTo() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
      <Series group={0} index={0} stroke="#e74c3c" fill="rgba(231,76,60,0.15)" label="Fill to 0" fillTo={0} />
      <Series group={0} index={1} stroke="#3498db" fill="rgba(52,152,219,0.15)" label="Fill to 30" fillTo={30} />
      <Series group={0} index={2} stroke="#2ecc71" fill="rgba(46,204,113,0.15)" label="Fill to min" fillTo={(min, _max) => min} />
    </Chart>
  );
}
