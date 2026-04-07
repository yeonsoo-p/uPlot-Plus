import { Chart, Series, Axis, groupedBars, fmtLabels, fmtWrap } from 'uplot-plus';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateData() {
  const months = 12;
  const x = Array.from({ length: months }, (_, i) => i + 1);
  const revenue = x.map(() => Math.round(Math.random() * 80 + 20));
  const costs = x.map(() => Math.round(Math.random() * 50 + 10));

  return [{ x, series: [revenue, costs] }];
}

export default function BarChart() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data}>
      <Axis scale="x" label="Month" values={fmtLabels(MONTHS)} />
      <Axis scale="y" label="Amount" values={fmtWrap('$', 'K')} />
      <Series group={0} index={0} stroke="#2980b9" label="Revenue" paths={groupedBars(0, 2)} />
      <Series group={0} index={1} stroke="#e74c3c" label="Costs" paths={groupedBars(1, 2)} />
    </Chart>
  );
}
