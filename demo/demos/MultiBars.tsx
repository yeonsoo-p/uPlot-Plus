import { Chart, Series, Axis, groupedBars, fmtPrefix, fmtWrap } from 'uplot-plus';

function generateData() {
  const quarters = [1, 2, 3, 4];
  return [{
    x: quarters,
    series: [
      quarters.map(() => Math.round(Math.random() * 80 + 40)),
      quarters.map(() => Math.round(Math.random() * 60 + 30)),
      quarters.map(() => Math.round(Math.random() * 50 + 20)),
    ],
  }];
}

export default function MultiBars() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data}>
        <Axis scale="x" label="Quarter" values={fmtPrefix('Q')} />
        <Axis scale="y" label="Revenue" values={fmtWrap('$', 'K')} />
        <Series group={0} index={0} stroke="#2980b9" label="Widgets" paths={groupedBars(0, 3)} />
        <Series group={0} index={1} stroke="#27ae60" label="Gadgets" paths={groupedBars(1, 3)} />
        <Series group={0} index={2} stroke="#8e44ad" label="Gizmos" paths={groupedBars(2, 3)} />
      </Chart>
    </div>
  );
}
