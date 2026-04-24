import { useState, useCallback, useRef, useEffect } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';
import type { ChartData, SelectEventInfo } from 'uplot-plus';

/** Deterministic noise based on x-value (no Math.random). */
function noise(t: number): number {
  const x = Math.sin(t * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function generateData(min: number, max: number, n: number): ChartData {
  const x: number[] = [];
  const y: number[] = [];
  const step = (max - min) / (n - 1);

  for (let i = 0; i < n; i++) {
    const t = min + i * step;
    x.push(t);
    y.push(Math.sin(t * 0.5) * 30 + Math.cos(t * 1.3) * 15 + 50 + (noise(t) - 0.5) * 4);
  }

  return [{ x, series: [y] }];
}

export default function SelectFetch() {
  const [data, setData] = useState<ChartData>(() => generateData(0, 100, 200));
  const [loading, setLoading] = useState(false);
  const [rangeText, setRangeText] = useState('');
  const timerRef = useRef(0);

  // Clean up pending timeout on unmount
  useEffect(() => () => { window.clearTimeout(timerRef.current); }, []);

  const onSelect = useCallback((sel: SelectEventInfo): false => {
    const xRange = sel.ranges['x'];
    if (!xRange) return false;

    setLoading(true);
    window.clearTimeout(timerRef.current);

    // Simulate a network fetch for higher-resolution data in the selected range
    timerRef.current = window.setTimeout(() => {
      setData(generateData(0, 100, 400));
      setLoading(false);
    }, 500);

    // Return false to prevent the default zoom behavior
    return false;
  }, []);

  const onScaleChange = useCallback((scaleId: string, min: number, max: number) => {
    if (scaleId === 'x') {
      setRangeText(`x: [${min.toFixed(1)}, ${max.toFixed(1)}]`);
    }
  }, []);

  const handleReset = useCallback(() => {
    setData(generateData(0, 100, 200));
  }, []);

  return (
    <div>
      <div className="mb-2 flex gap-2 items-center">
        <button className="px-3 py-1 text-demo rounded border border-border-light bg-surface hover:bg-border-lighter cursor-pointer dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15 dark:text-white transition-colors" onClick={handleReset}>Reset to full range</button>
        {loading && <span className="text-[#e67e22] font-bold">Fetching detail data...</span>}
        {rangeText && !loading && (
          <span className="text-demo font-mono text-muted">{rangeText}</span>
        )}
      </div>
      <Chart
        width="auto"
        height={400}
        data={data}
        actions={[['leftDblclick', 'none']]}
        onSelect={onSelect}
        onScaleChange={onScaleChange}
        xlabel="X"
        ylabel="Value"
      >
        <Series label="Signal" />
        <Legend />
      </Chart>
    </div>
  );
}
