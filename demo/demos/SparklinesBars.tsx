import React from 'react';
import { Sparkline, bars, withAlpha } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

const ITEMS = ['Revenue', 'Expenses', 'Profit', 'Users', 'Sessions', 'Bounce Rate'];

function makeBarData(n: number): ChartData {
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(() => Math.random() * 80 + 20);
  return [{ x, series: [y] }];
}

export default function SparklinesBars() {
  const colors = ['#2980b9', '#e74c3c', '#27ae60', '#8e44ad', '#f39c12', '#1abc9c'];

  const rows = ITEMS.map((name, i) => ({
    name,
    data: makeBarData(20),
    color: colors[i % colors.length] ?? '#000',
    value: (Math.random() * 1000).toFixed(0),
  }));

  return (
    <table className="sparkline-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Trend</th>
          <th>Current</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.name}>
            <td style={{ fontWeight: 600 }}>{r.name}</td>
            <td><Sparkline data={r.data} width={120} height={28} stroke={r.color} fill={withAlpha(r.color, 0.6)} paths={bars()} /></td>
            <td>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
