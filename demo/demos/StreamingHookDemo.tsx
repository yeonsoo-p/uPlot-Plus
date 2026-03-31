import React, { useRef } from 'react';
import { Chart, Series, Legend, useStreamingData } from 'uplot-plus';

const WINDOW = 500;

function initData() {
  const x = Array.from({ length: 50 }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.1) * 30 + 50);
  const y2 = x.map(i => Math.cos(i * 0.1) * 20 + 50);
  return [{ x, series: [y1, y2] }];
}

export default function StreamingHookDemo() {
  const { data, push, start, stop, running, fps } = useStreamingData(initData(), {
    window: WINDOW,
    autoStart: false,
  });

  const counterRef = useRef(50);

  // Push new points on every animation frame while running
  const tickRef = useRef(0);
  React.useEffect(() => {
    if (!running) {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      return;
    }
    const tick = () => {
      const i = counterRef.current++;
      push(
        [i],
        [Math.sin(i * 0.1) * 30 + 50 + (Math.random() - 0.5) * 8],
        [Math.cos(i * 0.1) * 20 + 50 + (Math.random() - 0.5) * 8],
      );
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => { if (tickRef.current) cancelAnimationFrame(tickRef.current); };
  }, [running, push]);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Uses the <code>useStreamingData</code> hook for sliding-window streaming with built-in FPS tracking.
      </p>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={running ? stop : start}>
          {running ? 'Stop' : 'Start'}
        </button>
        <span style={{ fontSize: 13, color: '#999' }}>
          {running ? `${fps} FPS` : 'Paused'} &middot; window: {WINDOW}
        </span>
      </div>
      <Chart width={800} height={350} data={data}>
        <Series group={0} index={0} label="Sine" stroke="#e74c3c" />
        <Series group={0} index={1} label="Cosine" stroke="#3498db" />
        <Legend />
      </Chart>
    </div>
  );
}
