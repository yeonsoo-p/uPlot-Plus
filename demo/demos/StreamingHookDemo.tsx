import React, { useState, useRef, useEffect } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

const WINDOW = 500;

function initData() {
  const x = Array.from({ length: 50 }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.1) * 30 + 50);
  const y2 = x.map(i => Math.cos(i * 0.1) * 20 + 50);
  return [{ x, series: [y1, y2] }];
}

export default function StreamingHookDemo() {
  const [data, setData] = useState(initData);
  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(0);

  const counterRef = useRef(50);
  const tickRef = useRef(0);
  const fpsFrames = useRef(0);
  const fpsLast = useRef(0);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      return;
    }
    fpsLast.current = performance.now();
    fpsFrames.current = 0;

    const tick = (now: number) => {
      const i = counterRef.current++;
      setData(prev => {
        const group = prev[0];
        if (group == null) return prev;
        const prevX = Array.from(group.x);
        const newX = prevX.concat(i);
        const s0 = group.series[0];
        const s1 = group.series[1];
        if (s0 == null || s1 == null) return prev;
        const newY1 = Array.from(s0).concat(Math.sin(i * 0.1) * 30 + 50 + (Math.random() - 0.5) * 8);
        const newY2 = Array.from(s1).concat(Math.cos(i * 0.1) * 20 + 50 + (Math.random() - 0.5) * 8);
        const drop = Math.max(0, newX.length - WINDOW);
        return [{ x: newX.slice(drop), series: [newY1.slice(drop), newY2.slice(drop)] }];
      });

      fpsFrames.current++;
      const elapsed = now - fpsLast.current;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsFrames.current * 1000) / elapsed));
        fpsFrames.current = 0;
        fpsLast.current = now;
      }

      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => { if (tickRef.current) cancelAnimationFrame(tickRef.current); };
  }, [running]);

  return (
    <div>
      <div className="mb-2 flex gap-2 items-center">
        <button onClick={() => setRunning(r => !r)}>
          {running ? 'Stop' : 'Start'}
        </button>
        <span className="text-demo text-muted-lighter">
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
