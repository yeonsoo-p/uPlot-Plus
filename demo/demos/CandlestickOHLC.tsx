import React from 'react';
import { Chart, Series, Candlestick } from 'uplot-plus';

function generateOHLC() {
  const n = 60;
  const x: number[] = [];
  const open: number[] = [];
  const high: number[] = [];
  const low: number[] = [];
  const close: number[] = [];

  let price = 100;

  for (let i = 0; i < n; i++) {
    x.push(i);
    const o = price;
    const change = (Math.random() - 0.48) * 4;
    const c = o + change;
    const h = Math.max(o, c) + Math.random() * 3;
    const l = Math.min(o, c) - Math.random() * 3;
    open.push(o);
    high.push(h);
    low.push(l);
    close.push(c);
    price = c;
  }

  return [{ x, series: [open, high, low, close] }];
}

export default function CandlestickOHLC() {
  const data = generateOHLC();

  return (
    <Chart width={800} height={400} data={data} xlabel="Day" ylabel="Price">
      <Series group={0} index={0} show={false} label="Open" />
      <Series group={0} index={1} show={false} label="High" />
      <Series group={0} index={2} show={false} label="Low" />
      <Series group={0} index={3} show={false} label="Close" />
      <Candlestick />
    </Chart>
  );
}
