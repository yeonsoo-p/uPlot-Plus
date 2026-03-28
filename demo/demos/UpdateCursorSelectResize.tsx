import React, { useState, useEffect, useRef } from 'react';
import { Chart, Series, Legend } from '../../src';

const WINDOW = 100;

export default function UpdateCursorSelectResize() {
  const [data, setData] = useState(() => {
    const x = Array.from({ length: WINDOW }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.1) * 30 + 50);
    return [{ x, series: [y] }];
  });

  const counterRef = useRef(WINDOW);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setData(prev => {
        const group = prev[0];
        if (!group) return prev;

        const prevY = group.series[0] as number[];
        const lastY = prevY[prevY.length - 1] ?? 50;
        const newIdx = counterRef.current++;
        const newX = [...(group.x as number[]).slice(1), newIdx];
        const newY = [...prevY.slice(1), lastY + (Math.random() - 0.5) * 6];

        return [{ x: newX, series: [newY] }];
      });
    }, 200);

    return () => clearInterval(id);
  }, [running]);

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => setRunning(r => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <span style={{ fontSize: 13, color: '#666', lineHeight: '28px' }}>
          Data updates every 200ms. Hover to test cursor stability during updates.
        </span>
      </div>
      <Chart width={800} height={400} data={data} xlabel="Tick" ylabel="Value">
        <Series group={0} index={0} label="Live" />
        <Legend />
      </Chart>
    </div>
  );
}
