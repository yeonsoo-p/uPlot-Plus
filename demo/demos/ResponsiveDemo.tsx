import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chart, Series, Legend } from '../../src';

/**
 * Example: responsive chart sizing via ResizeObserver.
 * This pattern replaces the removed ResponsiveChart component —
 * implement it yourself so you control the sizing logic.
 */
export default function ResponsiveDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [useAspectRatio, setUseAspectRatio] = useState(false);
  const aspectRatio = 2.5; // width / height

  const computeSize = useCallback(
    (w: number, h: number) => {
      const width = Math.max(Math.round(w), 100);
      const height = useAspectRatio
        ? Math.max(Math.round(width / aspectRatio), 100)
        : Math.max(Math.round(h), 100);
      return { width, height };
    },
    [useAspectRatio],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) return;

    const rect = el.getBoundingClientRect();
    setSize(computeSize(rect.width, rect.height));

    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry == null) return;
      const { width, height } = entry.contentRect;
      setSize(computeSize(width, height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [computeSize]);

  const data = useMemo(() => {
    const n = 300;
    const x = Array.from({ length: n }, (_, i) => i);
    const y1 = x.map(i => Math.sin(i * 0.04) * 30 + 50);
    const y2 = x.map(i => Math.cos(i * 0.06) * 20 + 40);
    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={useAspectRatio}
            onChange={e => setUseAspectRatio(e.target.checked)}
          />
          {' '}Lock aspect ratio ({aspectRatio}:1)
        </label>
        {size != null && (
          <span style={{ marginLeft: 16, color: '#888' }}>
            {size.width} x {size.height}px
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: useAspectRatio ? 'auto' : 400,
          border: '1px dashed #ccc',
        }}
      >
        {size != null && (
          <Chart width={size.width} height={size.height} data={data} xlabel="Index" ylabel="Value">
            <Series group={0} index={0} label="Sin" />
            <Series group={0} index={1} label="Cos" />
            <Legend />
          </Chart>
        )}
      </div>
    </div>
  );
}
