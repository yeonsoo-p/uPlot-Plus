import React from 'react';
import { Sparkline } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function randomWalk(n: number, start: number): number[] {
  const vals: number[] = [start];
  for (let i = 1; i < n; i++) {
    vals.push((vals[i - 1] ?? start) + (Math.random() - 0.5) * 4);
  }
  return vals;
}

const symbols = ['AAPL', 'AMD', 'AMZN', 'CSCO', 'META', 'MSFT', 'QCOM', 'SBUX', 'TSLA', 'NVDA'];

function makeSparkData(n: number): ChartData {
  const x = Array.from({ length: n }, (_, i) => i);
  return [{ x, series: [randomWalk(n, 100 + Math.random() * 100)] }];
}

export default function Sparklines() {
  const rows = symbols.map(sym => ({
    sym,
    price: makeSparkData(120),
    volume: makeSparkData(120),
  }));

  return (
    <table className="sparkline-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Price</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.sym}>
            <th>{r.sym}</th>
            <td><Sparkline data={r.price} stroke="#03a9f4" fill="#b3e5fc" /></td>
            <td><Sparkline data={r.volume} stroke="#03a9f4" fill="#b3e5fc" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
