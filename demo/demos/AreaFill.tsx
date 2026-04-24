import { Chart, Series, withAlpha } from 'uplot-plus';

function generateData() {
  const xs = Array.from({ length: 30 }, (_, i) => i + 1);
  const vals = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const pick = () => vals[Math.floor(Math.random() * vals.length)] ?? 0;

  return [{
    x: xs,
    series: [
      xs.map(() => pick()),
      xs.map(() => pick()),
      xs.map(() => pick()),
    ],
  }];
}

export default function AreaFill() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      <Series stroke="#ff0000" fill={withAlpha('#ff0000', 0.1)} label="Red" />
      <Series stroke="#00ff00" fill={withAlpha('#00ff00', 0.1)} label="Green" />
      <Series stroke="#0000ff" fill={withAlpha('#0000ff', 0.1)} label="Blue" />
    </Chart>
  );
}
