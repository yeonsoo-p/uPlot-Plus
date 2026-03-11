import React from 'react';
import { Chart, Scale, Series, Axis } from '../../src';
import type { ChartData } from '../../src';

function randomWalk(n: number, start: number): number[] {
  const vals: number[] = [start];
  for (let i = 1; i < n; i++) {
    vals.push(vals[i - 1] + (Math.random() - 0.5) * 4);
  }
  return vals;
}

const symbols = ['AAPL', 'AMD', 'AMZN', 'CSCO', 'META', 'MSFT', 'QCOM', 'SBUX', 'TSLA', 'NVDA'];

function makeSparkData(n: number): ChartData {
  const x = Array.from({ length: n }, (_, i) => i);
  return [{ x, series: [randomWalk(n, 100 + Math.random() * 100)] }];
}

function Spark({ data }: { data: ChartData }) {
  return (
    <div style={{ pointerEvents: 'none' }}>
      <Chart width={150} height={30} data={data}>
        <Scale id="x" auto ori={0} dir={1} time={false} />
        <Scale id="y" auto ori={1} dir={1} />
        <Axis scale="x" side={2} show={false} />
        <Axis scale="y" side={3} show={false} />
        <Series group={0} index={0} yScale="y" stroke="#03a9f4" fill="#b3e5fc" width={1} />
      </Chart>
    </div>
  );
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
            <td><Spark data={r.price} /></td>
            <td><Spark data={r.volume} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
