import { useMemo, useState, useCallback } from 'react';
import { Chart, Series, Legend } from 'uplot-plus';
import type { ChartEventInfo } from 'uplot-plus';

function generateData() {
  const n = 200;
  const x = Array.from({ length: n }, (_, i) => i);
  const y1 = x.map(i => Math.sin(i * 0.05) * 40 + 50 + (Math.random() - 0.5) * 8);
  const y2 = x.map(i => Math.cos(i * 0.03) * 25 + 45 + (Math.random() - 0.5) * 6);
  return [{ x, series: [y1, y2] }];
}

export default function EventCallbacks() {
  const data = useMemo(() => generateData(), []);
  const [status, setStatus] = useState('Click or right-click on the chart.');
  const [menu, setMenu] = useState<{ x: number; y: number; info: ChartEventInfo } | null>(null);

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
    const e = info.srcEvent;
    const x = 'clientX' in e ? e.clientX : 0;
    const y = 'clientY' in e ? e.clientY : 0;
    setMenu({ x, y, info });
  }, []);

  const onScaleChange = useCallback((id: string, min: number, max: number) => {
    setStatus(s => s.startsWith('Scale') ? `Scale "${id}": ${min.toFixed(1)}–${max.toFixed(1)}` : s);
  }, []);

  return (
    <div>
      <div className="relative">
        <Chart
          width="auto"
          height={400}
          data={data}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onScaleChange={onScaleChange}
          xlabel="Sample"
          ylabel="Value"
        >
          <Series group={0} index={0} label="Signal A" />
          <Series group={0} index={1} label="Signal B" />
          <Legend />
        </Chart>

        {menu && (
          <div
            className="fixed bg-white dark:bg-[#1e1e2e] border border-gray-300 dark:border-border-light dark:text-white rounded py-1.5 shadow-lg z-1000 text-demo min-w-40"
            style={{
              left: menu.x,
              top: menu.y,
            }}
            onClick={() => setMenu(null)}
          >
            {menu.info.point ? (
              <>
                <div className="px-3 py-1 font-bold border-b border-border-lighter">
                  Series {menu.info.point.seriesIdx}
                </div>
                <div className="px-3 py-1">X: {menu.info.point.xVal.toFixed(2)}</div>
                <div className="px-3 py-1">Y: {menu.info.point.yVal.toFixed(2)}</div>
                <div className="px-3 py-1 text-muted-lighter">
                  Index: {menu.info.point.dataIdx}
                </div>
              </>
            ) : (
              <div className="px-3 py-1 text-muted-lighter">No nearby point</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 px-2.5 py-1.5 bg-surface rounded text-demo font-mono">
        {status}
      </div>
    </div>
  );
}
