import React, { useMemo } from 'react';
import { Chart, Series } from '../../src';
import type { DrawCallback } from '../../src';

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
  const data = useMemo(() => generateOHLC(), []);

  const onDraw: DrawCallback = ({ ctx, plotBox, valToX, valToY }) => {
    const group = data[0];
    if (group == null) return;

    const xArr = group.x;
    const openArr = group.series[0];
    const highArr = group.series[1];
    const lowArr = group.series[2];
    const closeArr = group.series[3];
    if (openArr == null || highArr == null || lowArr == null || closeArr == null) return;

    const candleW = Math.max(2, (plotBox.width / xArr.length) * 0.6);

    for (let i = 0; i < xArr.length; i++) {
      const o = openArr[i];
      const h = highArr[i];
      const l = lowArr[i];
      const c = closeArr[i];
      if (o == null || h == null || l == null || c == null) continue;

      const cx = valToX(xArr[i] as number);
      const oPx = valToY(o, 'y');
      const hPx = valToY(h, 'y');
      const lPx = valToY(l, 'y');
      const cPx = valToY(c, 'y');
      if (cx == null || oPx == null || hPx == null || lPx == null || cPx == null) continue;

      const isUp = c >= o;
      const color = isUp ? '#26a69a' : '#ef5350';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, hPx);
      ctx.lineTo(cx, lPx);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(oPx, cPx);
      const bodyH = Math.abs(cPx - oPx);
      const halfW = candleW / 2;
      ctx.fillStyle = color;
      ctx.fillRect(cx - halfW, bodyTop, halfW * 2, Math.max(bodyH, 1));
    }
  };

  return (
    <Chart width={800} height={400} data={data} onDraw={onDraw} xlabel="Day" ylabel="Price">
      <Series group={0} index={0} show={false} label="Open" />
      <Series group={0} index={1} show={false} label="High" />
      <Series group={0} index={2} show={false} label="Low" />
      <Series group={0} index={3} show={false} label="Close" />
    </Chart>
  );
}
