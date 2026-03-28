import React, { useState, useCallback } from 'react';
import { Chart, Series, Legend } from '../../src';
import type { ChartData, SelectEventInfo } from '../../src';

function generateData(min: number, max: number, n: number): ChartData {
  const x: number[] = [];
  const y: number[] = [];
  const step = (max - min) / (n - 1);

  for (let i = 0; i < n; i++) {
    const t = min + i * step;
    x.push(t);
    y.push(Math.sin(t * 0.5) * 30 + Math.cos(t * 1.3) * 15 + 50 + (Math.random() - 0.5) * 4);
  }

  return [{ x, series: [y] }];
}

export default function SelectFetch() {
  const [data, setData] = useState<ChartData>(() => generateData(0, 100, 200));
  const [loading, setLoading] = useState(false);
  const [rangeText, setRangeText] = useState('');

  const onSelect = useCallback((sel: SelectEventInfo): false => {
    const xRange = sel.ranges['x'];
    if (!xRange) return false;

    setLoading(true);

    // Simulate a network fetch for higher-resolution data in the selected range
    setTimeout(() => {
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
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleReset}>Reset to full range</button>
        {loading && <span style={{ color: '#e67e22', fontWeight: 'bold' }}>Fetching detail data...</span>}
        {rangeText && !loading && (
          <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#666' }}>{rangeText}</span>
        )}
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
        Drag to select a region — instead of zooming, the chart fetches higher-resolution data for that range.
        The onScaleChange callback displays the current x-range.
      </p>
      <Chart
        width={800}
        height={400}
        data={data}
        cursor={{ wheelZoom: true }}
        onSelect={onSelect}
        onDblClick={() => false}
        onScaleChange={onScaleChange}
        xlabel="X"
        ylabel="Value"
      >
        <Series group={0} index={0} label="Signal" />
        <Legend />
      </Chart>
    </div>
  );
}
