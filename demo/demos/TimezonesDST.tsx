import { Chart, Series, Axis, Legend } from 'uplot-plus';

function generateData() {
  // Spring-forward DST transition: March 10, 2024 at 2:00 AM EST -> 3:00 AM EDT
  const startTs = new Date(2024, 2, 9, 0, 0, 0).getTime() / 1000; // March 9
  const n = 96; // 4 days of hourly data
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    const ts = startTs + i * 3600;
    x.push(ts);
    y.push(20 + Math.sin(i * 0.26) * 10 + (Math.random() - 0.5) * 3);
  }

  return [{ x, series: [y] }];
}

export default function TimezonesDST() {
  const data = generateData();

  const fmtDateTime = (splits: number[]) =>
    splits.map(s => {
      const d = new Date(s * 1000);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:00`;
    });

  return (
    <div>
      <Chart width="auto" height={400} data={data} ylabel="Temperature (C)">
        <Axis scale="x" label="Date/Time" values={fmtDateTime} rotate={-45} />
        <Series group={0} index={0} label="Temp" />
        <Legend />
      </Chart>
    </div>
  );
}
