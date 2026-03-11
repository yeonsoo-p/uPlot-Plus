import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

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

  const handleZoomFetch = () => {
    setLoading(true);
    // Simulate network delay then load higher-resolution data for zoomed range
    setTimeout(() => {
      const group = data[0];
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
  };

  const handleReset = () => {
    setData(generateData(0, 100, 200));
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleZoomFetch}>Zoom In (fetch detail)</button>
        <button onClick={handleReset}>Reset</button>
        {loading && <span style={{ color: '#e67e22', fontWeight: 'bold' }}>Loading...</span>}
      </div>
      <Chart width={800} height={400} data={data}>
        <Scale id="x"  />
        <Scale id="y"  />
        <Axis scale="x" label="X" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2} label="Signal" />
        <Legend />
      </Chart>
    </div>
  );
}
