import { Chart, Series, stackGroup } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function generateRawData() {
  const n = 80;
  const x = Array.from({ length: n }, (_, i) => i);
  const s0 = x.map(() => Math.random() * 30 + 10);
  const s1 = x.map(() => Math.random() * 25 + 15);
  const s2 = x.map(() => Math.random() * 20 + 5);

  return { x, series: [s0, s1, s2] };
}

export default function StackedSeries() {
  const raw = generateRawData();
  const result = stackGroup({ x: raw.x, series: raw.series });
  const stackedData: ChartData = [result.group];
  const stackedSeries = result.group.series;

  return (
    <div>
      <Chart width="auto" height={400} data={stackedData} xlabel="Sample" ylabel="Value">
        <Series stroke="#e74c3c" fill="rgba(231,76,60,0.4)" label="Series A" />
        <Series stroke="#2ecc71" fill="rgba(46,204,113,0.4)" label="Series B" fillToData={stackedSeries[0]} />
        <Series stroke="#3498db" fill="rgba(52,152,219,0.4)" label="Series C" fillToData={stackedSeries[1]} />
      </Chart>
    </div>
  );
}
