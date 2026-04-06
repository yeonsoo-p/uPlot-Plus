import { useState, useEffect, useRef } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

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

        const prevY = group.series[0];
        if (!prevY) return prev;
        const lastY = prevY[prevY.length - 1] ?? 50;
        const newIdx = counterRef.current++;
        const newX = [...Array.from(group.x).slice(1), newIdx];
        const newY = [...prevY.slice(1), lastY + (Math.random() - 0.5) * 6];

        return [{ x: newX, series: [newY] }];
      });
    }, 200);

    return () => clearInterval(id);
  }, [running]);

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button className="px-3 py-1 text-demo rounded border border-border-light bg-surface hover:bg-border-lighter cursor-pointer dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15 dark:text-white transition-colors" onClick={() => setRunning(r => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <span className="text-demo text-muted leading-7">
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
