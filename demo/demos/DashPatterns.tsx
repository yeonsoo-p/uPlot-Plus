import { Chart, Series } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const series = [0, 1, 2, 3, 4].map(offset =>
    x.map(i => Math.sin(i * 0.08 + offset * 0.7) * 40 + 50 + offset * 5)
  );
  return [{ x, series }];
}

export default function DashPatterns() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      <Series label="Solid" />
      <Series label="Dashed [5,5]" dash={[5, 5]} />
      <Series label="Dash-dot [10,5,2,5]" dash={[10, 5, 2, 5]} />
      <Series label="Long dash [15,5]" dash={[15, 5]} cap="round" />
      <Series label="Dotted [2,4]" dash={[2, 4]} cap="round" />
    </Chart>
  );
}
