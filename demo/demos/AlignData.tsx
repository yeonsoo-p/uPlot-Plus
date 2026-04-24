import { Chart, Series, alignData } from 'uplot-plus';

function generateData() {
  // Two datasets with different x-values
  const x1 = [0, 1, 2, 3, 5, 7, 8, 10];
  const y1 = x1.map(t => Math.sin(t * 0.5) * 30 + 50);

  const x2 = [0, 2, 4, 5, 6, 8, 9, 10];
  const y2 = x2.map(t => Math.cos(t * 0.4) * 25 + 45);

  // alignData merges them onto a common x-axis, filling gaps with null
  return alignData([
    [x1, y1],
    [x2, y2],
  ]);
}

export default function AlignData() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={400} data={data} xlabel="X" ylabel="Value">
        <Series label="Dataset A" />
        <Series label="Dataset B" />
      </Chart>
    </div>
  );
}
