import { Chart, Scale, Series, Axis, Side, fmtSuffix } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x: number[] = [];
  const cpu: (number | null)[] = [];
  const ram: (number | null)[] = [];
  const tcp: (number | null)[] = [];

  for (let i = 0; i < n; i++) {
    x.push(1566453600 + i * 60);
    cpu.push(+(Math.random() * 0.5 + 0.1).toFixed(2));
    ram.push(+(14 + Math.random() * 0.1).toFixed(2));
    tcp.push(+(Math.random() * 0.02).toFixed(3));
  }

  // Inject null gaps
  for (let i = 35; i <= 40; i++) cpu[i] = null;
  for (const i of [79, 80, 91, 125, 126, 127]) ram[i] = null;

  return [{ x, series: [cpu, ram, tcp] }];
}

export default function MissingData() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      <Scale id="pct"  />
      <Scale id="mb"  />
      <Axis scale="pct" values={fmtSuffix('%', 1)} />
      <Axis scale="mb" side={Side.Right} values={fmtSuffix(' MB', 2)} grid={{ show: false }} />
      <Series group={0} index={0} yScale="pct" stroke="red" fill="rgba(255,0,0,0.05)" label="CPU" />
      <Series group={0} index={1} yScale="pct" stroke="blue" fill="rgba(0,0,255,0.05)" label="RAM" />
      <Series group={0} index={2} yScale="mb" stroke="green" fill="rgba(0,255,0,0.05)" label="TCP Out" />
    </Chart>
  );
}
