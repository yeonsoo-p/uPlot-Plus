import { Chart, Series } from 'uplot-plus';

function generateData() {
  const n = 100;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * 0.1;
    x.push(t);
    y1.push(Math.sin(t) * 20 + 50);
    y2.push(Math.cos(t) * 15 + 50);
  }
  return { x, y1, y2 };
}

/**
 * Shows progressive complexity — from minimal (just data) to fully customized.
 */
export default function MinimalChart() {
  const { x, y1, y2 } = generateData();

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Minimal — auto-fills every data slot, auto-creates scales/axes/colors */}
      <div>
        <h4 className="mt-0 mb-2">Minimal: just data</h4>
        <Chart width="auto" height={180} data={{ x, y: y1 }} />
      </div>

      {/* 2. Custom axis labels via Chart props; bare <Series /> picks the next slot */}
      <div>
        <h4 className="mt-0 mb-2">Custom labels via xlabel / ylabel props</h4>
        <Chart width="auto" height={180} data={{ x, y: y1 }} xlabel="Time (s)" ylabel="Temperature">
          <Series label="Sensor A" />
        </Chart>
      </div>

      {/* 3. Full control when needed — explicit slots customize each line */}
      <div>
        <h4 className="mt-0 mb-2">Full control with explicit children</h4>
        <Chart width="auto" height={200} data={[{ x, series: [y1, y2] }]} xlabel="Time (s)" ylabel="Temperature">
          <Series index={0} label="Indoor" />
          <Series index={1} label="Outdoor" />
        </Chart>
      </div>
    </div>
  );
}
