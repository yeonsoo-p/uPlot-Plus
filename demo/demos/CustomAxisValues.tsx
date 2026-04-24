import { Chart, Series, Axis, fmtSuffix } from 'uplot-plus';

function generateData() {
  const n = 288; // 24h at 5-min intervals
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i * 300); // seconds
    // Simulated network throughput with daily pattern
    const hour = (i * 5) / 60;
    const base = 50 + 30 * Math.sin((hour - 6) * Math.PI / 12);
    y.push(Math.max(0, base + (Math.random() - 0.5) * 20));
  }

  return [{ x, series: [y] }];
}

const fmtTime = (splits: number[]) => splits.map(v => {
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

export default function CustomAxisValues() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      <Axis scale="x" label="Time of Day" values={fmtTime} space={80} />
      <Axis scale="y" label="Throughput" values={fmtSuffix(' MB/s')} />
      <Series stroke="#2980b9" fill="rgba(41,128,185,0.1)" label="Throughput" />
    </Chart>
  );
}
