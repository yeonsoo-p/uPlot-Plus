import { Chart, Series, DiagonalLine, at } from 'uplot-plus';

function generateData() {
  const n = 80;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    x.push(i);
    // Upward trend with noise
    y.push(20 + i * 0.8 + (Math.random() - 0.5) * 25);
  }

  // Linear regression
  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += at(x, i);
    sumY += at(y, i);
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = at(x, i) - meanX;
    const dy = at(y, i) - meanY;
    num += dx * dy;
    den += dx * dx;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  const label = `Trend: y = ${slope.toFixed(2)}x + ${intercept.toFixed(1)}`;

  return { data: [{ x, series: [y] }], slope, intercept, n, trendLabel: label };
}

export default function Trendlines() {
  const { data, slope, intercept, n, trendLabel } = generateData();

  return (
    <Chart width={800} height={400} data={data} xlabel="X" ylabel="Y">
      <Series group={0} index={0} label="Data"
        points={{ show: true, size: 4, fill: '#3498db' }} />
      <DiagonalLine
        x1={0} y1={intercept}
        x2={n - 1} y2={slope * (n - 1) + intercept}
        stroke="#e74c3c" width={2.5} dash={[8, 4]}
        label={trendLabel}
      />
    </Chart>
  );
}
