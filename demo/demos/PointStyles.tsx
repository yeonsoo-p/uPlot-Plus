import { Chart, Series } from 'uplot-plus';

function randomWalk(n: number, start: number): number[] {
  const vals: number[] = [start];
  for (let i = 1; i < n; i++) {
    vals.push((vals[i - 1] ?? start) + (Math.random() - 0.5) * 10);
  }
  return vals;
}

function generateData() {
  const n = 100;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  return [{
    x,
    series: [
      randomWalk(n, 50),
      randomWalk(n, 50),
      randomWalk(n, 50),
      randomWalk(n, 50),
    ],
  }];
}

export default function PointStyles() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      {/* Line only (default) */}
      <Series group={0} index={0} label="Line only" />
      {/* Line + points */}
      <Series group={0} index={1} label="Line + Points"
        points={{ show: true, size: 6, fill: "#fff", stroke: "#e74c3c", width: 1.5 }} />
      {/* Points only (no line) */}
      <Series group={0} index={2} label="Points only"
        points={{ show: true, size: 8, fill: "#3498db" }} />
      {/* Custom point colors */}
      <Series group={0} index={3} stroke="#f39c12" fill="rgba(243,156,18,0.1)" label="Custom pts"
        points={{ show: true, size: 5, fill: "#e74c3c", stroke: "#f39c12", width: 1 }} />
    </Chart>
  );
}
