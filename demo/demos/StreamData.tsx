import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

const WINDOW = 2000;
const BATCH = 4; // points per frame

function initData() {
  const x = Array.from({ length: WINDOW }, (_, i) => i);
  const y1: number[] = []; // random walk
  const y2: number[] = []; // oscillating
  const y3: number[] = []; // spiky

  let walk = 50;
  for (let i = 0; i < WINDOW; i++) {
    walk += (Math.random() - 0.5) * 4;
    walk = Math.max(5, Math.min(95, walk));
    y1.push(walk);
    y2.push(50 + Math.sin(i * 0.03) * 20 + (Math.random() - 0.5) * 6);
    y3.push(30 + Math.random() * 40 + (Math.random() > 0.95 ? (Math.random() - 0.5) * 40 : 0));
  }

  return [{ x, series: [y1, y2, y3] }];
}

export default function StreamData() {
  const [data, setData] = useState(initData);
  const counterRef = useRef(WINDOW);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastSecRef = useRef(performance.now());
  const [fps, setFps] = useState(0);

  const tick = useCallback(() => {
    setData(prev => {
      const group = prev[0];
      if (!group) return prev;

      const xArr = group.x;
      const y1 = group.series[0] ?? [];
      const y2 = group.series[1] ?? [];
      const y3 = group.series[2] ?? [];

      // Remove oldest BATCH points, push BATCH new points
      const newX = xArr.slice(BATCH);
      const newY1 = y1.slice(BATCH);
      const newY2 = y2.slice(BATCH);
      const newY3 = y3.slice(BATCH);

      let walk = newY1[newY1.length - 1] ?? 50;
      const baseI = counterRef.current;

      for (let b = 0; b < BATCH; b++) {
        const i = baseI + b;
        newX.push(i);

        // Random walk
        walk += (Math.random() - 0.5) * 4;
        walk = Math.max(5, Math.min(95, walk));
        newY1.push(walk);

        // Oscillating
        newY2.push(50 + Math.sin(i * 0.03) * 20 + (Math.random() - 0.5) * 6);

        // Spiky
        newY3.push(30 + Math.random() * 40 + (Math.random() > 0.95 ? (Math.random() - 0.5) * 40 : 0));
      }

      counterRef.current += BATCH;
      return [{ x: newX, series: [newY1, newY2, newY3] }];
    });
  }, []);

  useEffect(() => {
    let rafId: number;

    const loop = () => {
      tick();

      // FPS counter
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastSecRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        setFps(fpsRef.current);
        frameCountRef.current = 0;
        lastSecRef.current = now;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tick]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <span className="text-demo text-muted">
          {WINDOW} pts &middot; {BATCH} pts/frame &middot; ~{BATCH * 60} pts/sec
        </span>
        <span className={`text-demo font-bold ${fps > 50 ? 'text-green-600' : fps > 30 ? 'text-amber-500' : 'text-red-500'}`}>
          {fps} FPS
        </span>
      </div>
      <Chart width="auto" height={350} data={data} xlabel="Tick" ylabel="Value">
        <Series width={1.5} label="Random Walk" />
        <Series width={1.5} label="Oscillating" />
        <Series label="Spiky" />
        <Legend />
      </Chart>
    </div>
  );
}
