import React, { useSyncExternalStore, useCallback } from 'react';
import { Chart, Series, Legend, useChart } from '../../src';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50);
  const y2 = x.map(i => Math.cos(i * 0.05) * 30 + 50);
  return [{ x, series: [y1, y2] }];
}

/** Child component that reads chart store state via useChart() */
function ChartInfoPanel() {
  const store = useChart();

  const subscribe = useCallback((cb: () => void) => store.subscribe(cb), [store]);
  const getSnapshot = useCallback(() => ({
    cursor: { ...store.cursorManager.state },
    xScale: store.scaleManager.getScale('x'),
    yScale: store.scaleManager.getScale('y'),
    plotBox: { ...store.plotBox },
    seriesCount: store.seriesConfigs.length,
  }), [store]);

  const snap = useSyncExternalStore(subscribe, getSnapshot);

  const xMin = snap.xScale?.min?.toFixed(1) ?? '—';
  const xMax = snap.xScale?.max?.toFixed(1) ?? '—';
  const yMin = snap.yScale?.min?.toFixed(1) ?? '—';
  const yMax = snap.yScale?.max?.toFixed(1) ?? '—';
  const cursorX = snap.cursor.left >= 0 ? snap.cursor.left.toFixed(0) : '—';
  const cursorY = snap.cursor.top >= 0 ? snap.cursor.top.toFixed(0) : '—';
  const activeIdx = snap.cursor.activeDataIdx >= 0 ? snap.cursor.activeDataIdx : '—';

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
            <td style={cellStyle}>{snap.plotBox.width}x{snap.plotBox.height}</td>
            <td style={labelStyle}>Series count:</td>
            <td style={cellStyle}>{snap.seriesCount}</td>
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
        The <code>useChart()</code> hook gives child components access to the chart store.
        The panel below reads scale ranges, cursor position, and layout info in real time.
      </p>
      <Chart width={800} height={350} data={data} cursor={{ wheelZoom: true }}>
        <Series group={0} index={0} label="Sine" stroke="#e74c3c" />
        <Series group={0} index={1} label="Cosine" stroke="#3498db" />
        <Legend />
        <ChartInfoPanel />
      </Chart>
    </div>
  );
}
