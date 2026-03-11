import React, { useMemo, useState, useCallback } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData, ChartEventInfo } from '../../src';

function generateData(): ChartData {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50 + (Math.random() - 0.5) * 8);
  const y2 = x.map(i => Math.cos(i * 0.03) * 25 + 45 + (Math.random() - 0.5) * 6);
  return [{ x, series: [y1, y2] }];
}

export default function EventCallbacks() {
  const data = useMemo(() => generateData(), []);
  const [xRange, setXRange] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState('Click or right-click on the chart.');
  const [menu, setMenu] = useState<{ x: number; y: number; info: ChartEventInfo } | null>(null);

  const onScaleChange = useCallback((id: string, min: number, max: number) => {
    if (id === 'x') setXRange([min, max]);
  }, []);

  const onClick = useCallback((info: ChartEventInfo) => {
    setMenu(null);
    if (info.point) {
      const { seriesIdx, xVal, yVal, dist } = info.point;
      setStatus(`Clicked: series ${seriesIdx}, x=${xVal.toFixed(1)}, y=${yVal.toFixed(1)} (${dist.toFixed(0)}px away)`);
    } else {
      setStatus(`Clicked at (${info.plotX.toFixed(0)}, ${info.plotY.toFixed(0)}) — no nearby point`);
    }
  }, []);

  const onContextMenu = useCallback((info: ChartEventInfo) => {
    setMenu({ x: info.srcEvent.clientX, y: info.srcEvent.clientY, info });
  }, []);

  const handleZoomIn = () => {
    if (!xRange) return;
    const span = xRange[1] - xRange[0];
    setXRange([xRange[0] + span * 0.25, xRange[1] - span * 0.25]);
  };

  const handleZoomOut = () => {
    if (!xRange) return;
    const span = xRange[1] - xRange[0];
    setXRange([xRange[0] - span * 0.5, xRange[1] + span * 0.5]);
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
        <button onClick={() => setXRange(null)}>Reset</button>
      </div>

      <div style={{ position: 'relative' }}>
        <Chart
          width={800}
          height={400}
          data={data}
          cursor={{ wheelZoom: true }}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onScaleChange={onScaleChange}
        >
          <Scale id="x" ori={0} dir={1} time={false}
            auto={xRange == null} min={xRange?.[0]} max={xRange?.[1]} />
          <Scale id="y" auto ori={1} dir={1} />
          <Axis scale="x" side={2} label="Sample" />
          <Axis scale="y" side={3} label="Value" />
          <Series group={0} index={0} yScale="y" stroke="#2980b9" width={2} label="Signal A" />
          <Series group={0} index={1} yScale="y" stroke="#e67e22" width={2} label="Signal B" />
          <Legend />
        </Chart>

        {menu && (
          <div
            style={{
              position: 'fixed',
              left: menu.x,
              top: menu.y,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: '6px 0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
              fontSize: 13,
              minWidth: 160,
            }}
            onClick={() => setMenu(null)}
          >
            {menu.info.point ? (
              <>
                <div style={{ padding: '4px 12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                  Series {menu.info.point.seriesIdx}
                </div>
                <div style={{ padding: '4px 12px' }}>X: {menu.info.point.xVal.toFixed(2)}</div>
                <div style={{ padding: '4px 12px' }}>Y: {menu.info.point.yVal.toFixed(2)}</div>
                <div style={{ padding: '4px 12px', color: '#999' }}>
                  Index: {menu.info.point.dataIdx}
                </div>
              </>
            ) : (
              <div style={{ padding: '4px 12px', color: '#999' }}>No nearby point</div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }}>
        {status}
      </div>
    </div>
  );
}
