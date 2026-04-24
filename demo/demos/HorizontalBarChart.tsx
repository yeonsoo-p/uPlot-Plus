import { Chart, Series, Axis, horizontalBars, fmtLabels, fmtWrap } from 'uplot-plus';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateData() {
  const months = 12;
  const x = Array.from({ length: months }, (_, i) => i + 1);
  const revenue = x.map(() => Math.round(Math.random() * 80 + 20));
  return [{ x, series: [revenue] }];
}

export default function HorizontalBarChart() {
  const data = generateData();

  return (
    <Chart width="auto" height={500} data={data}>
      <Axis scale="x" label="Month" values={fmtLabels(MONTHS)} />
      <Axis scale="y" label="Revenue" values={fmtWrap('$', 'K')} />
      <Series stroke="#2980b9" label="Revenue" paths={horizontalBars()} />
    </Chart>
  );
}
