import { useMemo, useState, useCallback } from 'react';
import { Chart, Series } from 'uplot-plus';
import type { CursorDrawCallback, ActionEntry } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.05) * 40 + 50 + (Math.random() - 0.5) * 8);
  return [{ x, series: [y] }];
}

interface RefPoint {
  left: number;
  top: number;
}

export default function MeasureDatums() {
  const data = useMemo(() => generateData(), []);
  const [refPoint, setRefPoint] = useState<RefPoint | null>(null);

  const actions = useMemo<ActionEntry[]>(() => [
    ['leftClick', (_store, _e, ctx) => {
      setRefPoint(prev => prev ? null : { left: ctx.cx, top: ctx.cy });
    }],
  ], []);

  const onCursorDraw: CursorDrawCallback = useCallback(({ ctx, plotBox }, cursor) => {
    if (cursor.left < 0 || cursor.top < 0) return;
    if (refPoint == null) return;

    // Both refPoint and cursor are in plot-relative CSS pixels — add plotBox offset for drawing
    const rx = refPoint.left + plotBox.left;
    const ry = refPoint.top + plotBox.top;
    const cx = cursor.left + plotBox.left;
    const cy = cursor.top + plotBox.top;

    // Draw reference point marker
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw dashed line from ref to cursor
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Draw dx/dy dimension lines
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
    ctx.lineWidth = 1;

    // Horizontal (dx)
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(cx, ry);
    ctx.stroke();

    // Vertical (dy)
    ctx.beginPath();
    ctx.moveTo(cx, ry);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Compute distances in CSS pixels
    const dx = cx - rx;
    const dy = cy - ry;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Label background
    const label = `dx: ${dx.toFixed(0)}px  dy: ${dy.toFixed(0)}px  d: ${dist.toFixed(0)}px`;
    ctx.font = '11px monospace';
    const metrics = ctx.measureText(label);
    const padX = 6;

    const labelX = Math.min(cx + 10, plotBox.left + plotBox.width - metrics.width - padX * 2);
    const labelY = cy - 24;

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(labelX, labelY, metrics.width + padX * 2, 18);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(label, labelX + padX, labelY + 13);
  }, [refPoint]);

  return (
    <div>
      <Chart width={800} height={400} data={data} onCursorDraw={onCursorDraw} actions={actions} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} label="Signal" />
      </Chart>
    </div>
  );
}
