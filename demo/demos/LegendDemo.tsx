import { Chart, Series, Legend } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.08) * 30 + 50);
  const y2 = x.map(i => Math.cos(i * 0.06) * 25 + 45);
  const y3 = x.map(i => Math.sin(i * 0.1 + 2) * 20 + 55);
  const y4 = x.map(i => Math.cos(i * 0.12 + 1) * 15 + 40);
  return [{ x, series: [y1, y2, y3, y4] }];
}

export default function LegendDemo() {
  const data = generateData();

  return (
    <div>
      <div className="mb-4">
        <Chart width="auto" height={250} data={data} title="Legend at bottom (default)">
          <Series group={0} index={0} label="Alpha" />
          <Series group={0} index={1} label="Beta" />
          <Series group={0} index={2} label="Gamma" />
          <Series group={0} index={3} label="Delta" />
          <Legend />
        </Chart>
      </div>
      <div>
        <Chart width="auto" height={250} data={data} title="Legend at top — click series to toggle">
          <Series group={0} index={0} label="Alpha" />
          <Series group={0} index={1} label="Beta" />
          <Series group={0} index={2} label="Gamma" />
          <Series group={0} index={3} label="Delta" />
          <Legend position="top" />
        </Chart>
      </div>
    </div>
  );
}
