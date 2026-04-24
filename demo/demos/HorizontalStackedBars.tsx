import { Chart, Series, Axis, Legend, horizontalStackedBars, stackGroup, fmtLabels } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

const months = [1, 2, 3, 4, 5, 6];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function makeStackedData() {
  const raw = {
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 30 + 10)),
      months.map(() => Math.round(Math.random() * 25 + 10)),
      months.map(() => Math.round(Math.random() * 20 + 5)),
    ],
  };
  const result = stackGroup(raw);
  const data: ChartData = [result.group];
  return { data, stackedSeries: result.group.series };
}

export default function HorizontalStackedBars() {
  const { data, stackedSeries } = makeStackedData();

  return (
    <div>
      <Chart width="auto" height={500} data={data} title="Stacked Horizontal Bars" ylabel="Sales">
        <Axis scale="x" label="Month" values={fmtLabels(MONTH_NAMES)} />
        <Series stroke="#3498db" fill="#3498db" label="Product A" paths={horizontalStackedBars()} />
        <Series stroke="#2ecc71" fill="#2ecc71" label="Product B" paths={horizontalStackedBars(stackedSeries[0])} />
        <Series stroke="#e74c3c" fill="#e74c3c" label="Product C" paths={horizontalStackedBars(stackedSeries[1])} />
        <Legend />
      </Chart>
    </div>
  );
}
