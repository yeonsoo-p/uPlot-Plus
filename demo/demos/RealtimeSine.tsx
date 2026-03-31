import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, Scale, Series, Legend } from 'uplot-plus';

const WINDOW = 10000;
const SAMPLE_RATE = 500; // samples per second
const BATCH = 8; // samples per frame (~480/sec at 60fps)

function initData() {
  const x = new Array<number>(WINDOW);
  const y1 = new Array<number>(WINDOW);
  const y2 = new Array<number>(WINDOW);
  const y3 = new Array<number>(WINDOW);

  for (let i = 0; i < WINDOW; i++) {
    const t = i / SAMPLE_RATE;
    x[i] = t;
    y1[i] = Math.sin(2 * Math.PI * 1.0 * t);             // 1 Hz
    y2[i] = 0.7 * Math.sin(2 * Math.PI * 2.5 * t);       // 2.5 Hz
    y3[i] = 0.4 * Math.sin(2 * Math.PI * 4.0 * t + 1.2); // 4 Hz, phase shifted
  }

  return [{ x, series: [y1, y2, y3] }];
}

export default function RealtimeSine() {
  const [data, setData] = useState(initData);
  const sampleRef = useRef(WINDOW);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastSecRef = useRef(performance.now());

  const tick = useCallback(() => {
    setData(prev => {
      const group = prev[0];
      if (!group) return prev;

      const xArr = group.x;
      const s1 = group.series[0] ?? [];
      const s2 = group.series[1] ?? [];
      const s3 = group.series[2] ?? [];

      // Slide window: drop oldest BATCH, push BATCH new
      const newX = xArr.slice(BATCH);
      const newS1 = s1.slice(BATCH);
      const newS2 = s2.slice(BATCH);
      const newS3 = s3.slice(BATCH);

      const base = sampleRef.current;
      for (let b = 0; b < BATCH; b++) {
        const t = (base + b) / SAMPLE_RATE;
        newX.push(t);
        newS1.push(Math.sin(2 * Math.PI * 1.0 * t));
        newS2.push(0.7 * Math.sin(2 * Math.PI * 2.5 * t));
        newS3.push(0.4 * Math.sin(2 * Math.PI * 4.0 * t + 1.2));
      }
      sampleRef.current += BATCH;

      return [{ x: newX, series: [newS1, newS2, newS3] }];
    });
  }, []);

  useEffect(() => {
    let rafId: number;

    const loop = () => {
      tick();

      frameCountRef.current++;
      const now = performance.now();
      if (now - lastSecRef.current >= 1000) {
        setFps(frameCountRef.current);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          {WINDOW.toLocaleString()} pts &middot; 3 sine waves (1 Hz, 2.5 Hz, 4 Hz) &middot; ~{BATCH * 60} samples/sec
        </span>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: fps > 50 ? '#27ae60' : fps > 30 ? '#f39c12' : '#e74c3c' }}>
          {fps} FPS
        </span>
      </div>
      <Chart width={800} height={350} data={data} xlabel="Time (s)" ylabel="Amplitude">
        <Scale id="y" min={-1.5} max={1.5} />
        <Series group={0} index={0} width={1.5} label="1 Hz" />
        <Series group={0} index={1} width={1.5} label="2.5 Hz" />
        <Series group={0} index={2} width={1.5} label="4 Hz" />
        <Legend />
      </Chart>
    </div>
  );
}
