import { Chart, Series, HoverLabel, focus } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  const y3: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.cos(t) * 30 + 50);
    y3.push(Math.sin(t * 0.7 + 1) * 25 + 50);
  }
  return [{ x, series: [y1, y2, y3] }];
}

/**
 * Hover over a series for 1 second to show its label as a floating tag.
 * Uses the HoverLabel component which renders on the canvas cursor overlay.
 */
export default function HoverLabelDemo() {
  const data = generateData();

  return (
    <div>
      <Chart
        width="auto"
        height={400}
        data={data}
        actions={[['hover', focus(0.15)]]}
        xlabel="Time"
        ylabel="Value"
      >
        <Series label="Alpha" />
        <Series label="Beta" />
        <Series label="Gamma" />
        <HoverLabel delay={1000} />
      </Chart>
    </div>
  );
}
