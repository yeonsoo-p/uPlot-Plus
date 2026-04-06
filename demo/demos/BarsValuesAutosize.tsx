import { Chart, Scale, Series, bars } from 'uplot-plus';
import type { DrawCallback } from 'uplot-plus';

function generateValues() {
  return Array.from({ length: 10 }, () => Math.round(Math.random() * 80 + 10));
}

function generateData(values: number[]) {
  const x = Array.from({ length: values.length }, (_, i) => i + 1);
  return [{ x, series: [values] }];
}

export default function BarsValuesAutosize() {
  const values = generateValues();

  const data = generateData(values);

  // Draw value labels above each bar
  const onDraw: DrawCallback = ({ ctx, valToX, valToY }) => {
    ctx.fillStyle = '#333';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v == null) continue;
      const xVal = i + 1; // x data values are 1-indexed
      const cx = valToX(xVal);
      const cy = valToY(v, 'y');
      if (cx == null || cy == null) continue;
      ctx.fillText(String(v), cx, cy - 4);
    }
  };

  return (
    <div>
      <Chart width={800} height={400} data={data} onDraw={onDraw} xlabel="Category" ylabel="Value">
        <Scale id="y" min={0} max={100} />
        <Series
          group={0}
          index={0}
          stroke="#2980b9"
          label="Sales"
          paths={bars()}
        />
      </Chart>
    </div>
  );
}
