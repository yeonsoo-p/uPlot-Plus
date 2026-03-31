import React from 'react';
import { Chart, Series, useDrawHook, useCursorDrawHook } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.04) * 30 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y] }];
}

const WARN = 65;
const CRIT = 75;

/** Child component that draws threshold zones using useDrawHook */
function ThresholdOverlay() {
  useDrawHook(({ ctx, plotBox, valToY }) => {
    const warnY = valToY(WARN, 'y');
    const critY = valToY(CRIT, 'y');
    const topY = valToY(100, 'y');
    if (warnY == null || critY == null || topY == null) return;

    // Warning zone
    ctx.fillStyle = 'rgba(243, 156, 18, 0.12)';
    ctx.fillRect(plotBox.left, critY, plotBox.width, warnY - critY);

    // Critical zone
    ctx.fillStyle = 'rgba(231, 76, 60, 0.12)';
    ctx.fillRect(plotBox.left, topY, plotBox.width, critY - topY);

    // Labels
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#e67e22';
    ctx.fillText(`Warn (${WARN})`, plotBox.left + 4, warnY - 3);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`Critical (${CRIT})`, plotBox.left + 4, critY - 3);
  });
  return null;
}

/** Child component that draws crosshair value label using useCursorDrawHook */
function CrosshairLabel() {
  useCursorDrawHook(({ ctx, plotBox, valToY: _valToY }, cursor) => {
    if (cursor.left < 0 || cursor.top < 0) return;

    const yPixel = cursor.top;
    const label = `y=${yPixel.toFixed(0)}px`;

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    const tw = ctx.measureText(label).width;
    const lx = Math.min(cursor.left + 10, plotBox.left + plotBox.width - tw - 8);
    ctx.fillRect(lx, yPixel - 14, tw + 6, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, lx + 3, yPixel - 2);
  });
  return null;
}

export default function DrawHooksComposable() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Composable child components using <code>useDrawHook</code> (threshold zones) and{' '}
        <code>useCursorDrawHook</code> (crosshair label). Each component registers its own canvas drawing.
      </p>
      <Chart width={800} height={400} data={data} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} label="Signal" stroke="#2980b9" />
        <ThresholdOverlay />
        <CrosshairLabel />
      </Chart>
    </div>
  );
}
