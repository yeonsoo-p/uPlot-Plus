import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function generateData(min: number, max: number, n: number): ChartData {
  const x: number[] = [];
  const y: number[] = [];
  const step = (max - min) / (n - 1);

  for (let i = 0; i < n; i++) {
    const t = min + i * step;
    x.push(t);
    y.push(Math.sin(t * 0.5) * 30 + Math.cos(t * 1.3) * 15 + 50);
  }

  return [{ x, series: [y] }];
}

export default function ZoomFetch() {
  const [data, setData] = useState<ChartData>(() => generateData(0, 100, 200));
  const [loading, setLoading] = useState(false);
  const prevRange = useRef<[number, number]>([0, 100]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const timerRef = useRef(0);

  // Clean up pending timeout on unmount
  useEffect(() => () => { window.clearTimeout(timerRef.current); }, []);

  // Watch for data range changes (simulating zoom-triggered re-fetch)
  useEffect(() => {
    const group = data[0];
    if (!group) return;

    const xArr = group.x;
    const curMin = Number(xArr[0]);
    const curMax = Number(xArr[xArr.length - 1]);
    const [prevMin, prevMax] = prevRange.current;

    // If range significantly changed, simulate a fetch
    if (Math.abs(curMin - prevMin) > 1 || Math.abs(curMax - prevMax) > 1) {
      prevRange.current = [curMin, curMax];
    }
  }, [data]);

  const handleZoomFetch = useCallback(() => {
    setLoading(true);
    window.clearTimeout(timerRef.current);
    // Simulate network delay then load higher-resolution data for zoomed range
    timerRef.current = window.setTimeout(() => {
      const group = dataRef.current[0];
      if (group) {
        const xArr = group.x;
        const min = Number(xArr[0]);
        const max = Number(xArr[xArr.length - 1]);
        const range = max - min;
        // Zoom into the middle 50%
        const newMin = min + range * 0.25;
        const newMax = max - range * 0.25;
        setData(generateData(newMin, newMax, 400));
      }
      setLoading(false);
    }, 600);
  }, []);

  const handleReset = () => {
    setData(generateData(0, 100, 200));
  };

  return (
    <div>
      <div className="mb-2 flex gap-2 items-center">
        <button className="px-3 py-1 text-demo rounded border border-border-light bg-surface hover:bg-border-lighter cursor-pointer dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15 dark:text-white transition-colors" onClick={handleZoomFetch}>Zoom In (fetch detail)</button>
        <button className="px-3 py-1 text-demo rounded border border-border-light bg-surface hover:bg-border-lighter cursor-pointer dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15 dark:text-white transition-colors" onClick={handleReset}>Reset</button>
        {loading && <span className="text-[#e67e22] font-bold">Loading...</span>}
      </div>
      <Chart width="auto" height={400} data={data} xlabel="X" ylabel="Value">
        <Series group={0} index={0} label="Signal" />
        <Legend />
      </Chart>
    </div>
  );
}
