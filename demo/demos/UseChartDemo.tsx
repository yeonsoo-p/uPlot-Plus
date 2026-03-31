import React from 'react';
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

  const cellStyle: React.CSSProperties = { padding: '2px 8px', fontSize: 12, fontFamily: 'monospace' };
  const labelStyle: React.CSSProperties = { ...cellStyle, color: '#888', textAlign: 'right' };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 8, marginTop: 8, background: '#fafafa' }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>useChart() Store Inspector</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={labelStyle}>X scale range:</td>
            <td style={cellStyle}>[{xMin}, {xMax}]</td>
            <td style={labelStyle}>Y scale range:</td>
            <td style={cellStyle}>[{yMin}, {yMax}]</td>
          </tr>
          <tr>
            <td style={labelStyle}>Cursor pixel:</td>
            <td style={cellStyle}>({cursorX}, {cursorY})</td>
            <td style={labelStyle}>Active data idx:</td>
            <td style={cellStyle}>{activeIdx}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Plot box:</td>
            <td style={cellStyle}>{chart.plotWidth}x{chart.plotHeight}</td>
            <td style={labelStyle}>Series count:</td>
            <td style={cellStyle}>{chart.seriesCount}</td>
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
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        The <code>useChart()</code> hook gives child components read-only access to chart state.
        The panel below reads scale ranges, cursor position, and layout info in real time.
      </p>
      <Chart width={800} height={350} data={data} >
        <Series group={0} index={0} label="Sine" stroke="#e74c3c" />
        <Series group={0} index={1} label="Cosine" stroke="#3498db" />
        <Legend />
        <ChartInfoPanel />
      </Chart>
    </div>
  );
}
