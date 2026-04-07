import { useState, useRef, useMemo, useCallback } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';

/**
 * Demonstrates width="auto" in a flex layout with a drag-resizable side panel.
 * The chart fills the remaining space and redraws in real-time as the panel is resized.
 */
export default function FlexAutoResize() {
  const [panelWidth, setPanelWidth] = useState(250);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    e.preventDefault();

    const onMouseMove = (ev: MouseEvent) => {
      const delta = startX.current - ev.clientX;
      setPanelWidth(Math.max(100, Math.min(600, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [panelWidth]);

  const data = useMemo(() => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50);
    const y2 = x.map(i => Math.cos(i * 0.07) * 30 + 45);
    return [{ x, series: [y1, y2] }];
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: 400, overflow: 'hidden', border: '1px dashed #999', borderRadius: 6 }}>
      <div style={{ flex: 1, minWidth: 200, overflow: 'hidden' }}>
        <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
          <Series group={0} index={0} label="Sin" />
          <Series group={0} index={1} label="Cos" />
          <Legend />
        </Chart>
      </div>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 6,
          cursor: 'col-resize',
          background: '#ccc',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
      />
      <div
        style={{
          width: panelWidth,
          flexShrink: 0,
          padding: 16,
          background: 'var(--color-bg-subtle, #f5f5f5)',
          overflow: 'auto',
          borderLeft: '1px solid #ddd',
        }}
      >
        <h4 style={{ margin: '0 0 8px' }}>Side Panel</h4>
        <p>Panel width: <strong>{panelWidth}px</strong></p>
      </div>
    </div>
  );
}
