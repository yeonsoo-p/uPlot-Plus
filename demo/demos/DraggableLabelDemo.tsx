import { useState } from 'react';
import { Chart, Series, DraggableLabel } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * 0.05;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.cos(t) * 30 + 50);
  }
  return [{ x, series: [y1, y2] }];
}

export default function DraggableLabelDemo() {
  const data = generateData();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mt-0 mb-2">Basic — drag to reposition</h4>
        <Chart width="auto" height={300} data={data} xlabel="Time" ylabel="Value">
          <Series label="Sine" />
          <Series label="Cosine" />
          <DraggableLabel position="top-left">Peak region</DraggableLabel>
        </Chart>
      </div>

      <div>
        <h4 className="mt-0 mb-2">Styled + position callback</h4>
        <Chart width="auto" height={300} data={data} xlabel="Time" ylabel="Value">
          <Series label="Sine" />
          <Series label="Cosine" />
          <DraggableLabel
            position="bottom-right"
            idleOpacity={0.5}
            onPositionChange={setPos}
            style={{ background: '#1e40af', color: '#fff', border: '1px solid #3b82f6', borderRadius: 4, padding: '4px 8px' }}
          >
            Custom styled label
          </DraggableLabel>
        </Chart>
        {pos && <pre className="mt-1 text-xs text-muted dark:text-muted-lighter">Position: x={Math.round(pos.x)}, y={Math.round(pos.y)}</pre>}
      </div>

      <div>
        <h4 className="mt-0 mb-2">Keyboard accessible</h4>
        <p className="mt-0 mb-2 text-sm text-muted dark:text-muted-lighter">Tab to label, arrow keys to move (Shift for fine control)</p>
        <Chart width="auto" height={300} data={data} xlabel="Time" ylabel="Value">
          <Series label="Sine" />
          <Series label="Cosine" />
          <DraggableLabel position="top-right" ariaLabel="Draggable note">
            Keyboard movable
          </DraggableLabel>
        </Chart>
      </div>
    </div>
  );
}
