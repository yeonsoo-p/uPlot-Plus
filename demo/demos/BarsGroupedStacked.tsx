import { Chart, Series, Axis, Legend, groupedBars, fmtLabels } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

const months = [1, 2, 3, 4, 5, 6];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function makeGroupedData(): ChartData {
  return [{
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 60 + 20)),
      months.map(() => Math.round(Math.random() * 50 + 15)),
      months.map(() => Math.round(Math.random() * 40 + 10)),
    ],
  }];
}

export default function BarsGroupedStacked() {
  const data = makeGroupedData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} title="Grouped Bars" ylabel="Sales">
        <Axis scale="x" label="Month" values={fmtLabels(MONTH_NAMES)} />
        <Series stroke="#2980b9" label="Product A" paths={groupedBars(0, 3)} />
        <Series stroke="#27ae60" label="Product B" paths={groupedBars(1, 3)} />
        <Series stroke="#e67e22" label="Product C" paths={groupedBars(2, 3)} />
        <Legend />
      </Chart>
    </div>
  );
}
