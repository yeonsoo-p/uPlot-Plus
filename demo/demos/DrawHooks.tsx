import { Chart, Scale, Series, HLine, Region } from 'uplot-plus';
import type { CursorDrawCallback } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = x.map(i => Math.sin(i * 0.04) * 30 + 50 + (Math.random() - 0.5) * 10);
  return [{ x, series: [y] }];
}

// Draw crosshair coordinates on the cursor overlay
const onCursorDraw: CursorDrawCallback = ({ ctx, plotBox }, cursor) => {
  if (cursor.left < 0 || cursor.top < 0) return;

  const x = cursor.left;
  const y = cursor.top;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';

  const label = `(${cursor.left.toFixed(0)}, ${cursor.top.toFixed(0)})`;
  const textW = ctx.measureText(label).width;

  // Background box
  const padX = 4;
  const boxX = Math.min(x + 8, plotBox.left + plotBox.width - textW - padX * 2);
  const boxY = y - 20;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(boxX, boxY, textW + padX * 2, 16);

  ctx.fillStyle = '#fff';
  ctx.fillText(label, boxX + padX, boxY + 12);
};

export default function DrawHooks() {
  const data = generateData();

  return (
    <Chart width="auto" height={400} data={data} onCursorDraw={onCursorDraw} xlabel="Sample" ylabel="Value">
      <Scale id="y" auto={false} min={10} max={90} />
      <Series group={0} index={0} label="Signal" />
      <Region yMin={65} yMax={90} fill="rgba(231, 76, 60, 0.08)" />
      <HLine value={65} stroke="#e74c3c" width={2} dash={[6, 4]} label="Threshold: 65" />
    </Chart>
  );
}
