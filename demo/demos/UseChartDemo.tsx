import { Chart, Series, Legend, useChart } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50);
  const y2 = x.map(i => Math.cos(i * 0.05) * 30 + 50);
  return [{ x, series: [y1, y2] }];
}

/** Child component that reads chart state via useChart() */
function ChartInfoPanel() {
  const chart = useChart();

  const xScale = chart.getScale('x');
  const yScale = chart.getScale('y');

  const xMin = xScale?.min?.toFixed(1) ?? '—';
  const xMax = xScale?.max?.toFixed(1) ?? '—';
  const yMin = yScale?.min?.toFixed(1) ?? '—';
  const yMax = yScale?.max?.toFixed(1) ?? '—';
  const cursorX = chart.left >= 0 ? chart.left.toFixed(0) : '—';
  const cursorY = chart.top >= 0 ? chart.top.toFixed(0) : '—';
  const activeIdx = chart.activeDataIdx >= 0 ? chart.activeDataIdx : '—';

  const cellClass = 'px-2 py-0.5 text-xs font-mono';
  const labelClass = `${cellClass} text-muted-light text-right`;

  return (
    <div className="border border-border-light rounded p-2 mt-2 bg-surface-light">
      <div className="text-xs font-semibold mb-1">useChart() Store Inspector</div>
      <table className="border-collapse">
        <tbody>
          <tr>
            <td className={labelClass}>X scale range:</td>
            <td className={cellClass}>[{xMin}, {xMax}]</td>
            <td className={labelClass}>Y scale range:</td>
            <td className={cellClass}>[{yMin}, {yMax}]</td>
          </tr>
          <tr>
            <td className={labelClass}>Cursor pixel:</td>
            <td className={cellClass}>({cursorX}, {cursorY})</td>
            <td className={labelClass}>Active data idx:</td>
            <td className={cellClass}>{activeIdx}</td>
          </tr>
          <tr>
            <td className={labelClass}>Plot box:</td>
            <td className={cellClass}>{chart.plotWidth}x{chart.plotHeight}</td>
            <td className={labelClass}>Series count:</td>
            <td className={cellClass}>{chart.seriesCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function UseChartDemo() {
  const data = generateData();

  return (
    <div>
      <Chart width="auto" height={350} data={data} >
        <Series group={0} index={0} label="Sine" stroke="#e74c3c" />
        <Series group={0} index={1} label="Cosine" stroke="#3498db" />
        <Legend />
        <ChartInfoPanel />
      </Chart>
    </div>
  );
}
