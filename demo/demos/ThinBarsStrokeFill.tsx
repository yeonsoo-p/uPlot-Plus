import { Chart, Series, Legend, groupedBars } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function generateData(): ChartData {
  const n = 15;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y1 = x.map(() => Math.round(Math.random() * 60 + 20));
  const y2 = x.map(() => Math.round(Math.random() * 60 + 20));
  const y3 = x.map(() => Math.round(Math.random() * 60 + 20));
  const y4 = x.map(() => Math.round(Math.random() * 60 + 20));
  return [{ x, series: [y1, y2, y3, y4] }];
}

export default function ThinBarsStrokeFill() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} xlabel="Item" ylabel="Value">
      {/* No specifics — auto palette assigns stroke and fill */}
      <Series group={0} index={0} label="Stroke and Fill" paths={groupedBars(0, 4)} />
      {/* Fill only — transparent stroke hides the outline */}
      <Series group={0} index={1} stroke="transparent" fill="rgba(52, 152, 219, 0.6)" label="Fill Only" paths={groupedBars(1, 4)} />
      {/* Stroke only — transparent fill shows just the outline */}
      <Series group={0} index={2} stroke="#e74c3c" fill="transparent" label="Stroke Only" paths={groupedBars(2, 4)} />
      {/* Both specified explicitly */}
      <Series group={0} index={3} stroke="#27ae60" fill="rgba(39, 174, 96, 0.3)" label="Custom Stroke + Fill" paths={groupedBars(3, 4)} />
      <Legend />
    </Chart>
  );
}
