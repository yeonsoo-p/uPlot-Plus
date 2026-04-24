import { useMemo } from 'react';
import { Chart, Series, ZoomRanger } from 'uplot-plus';
import type { ChartData } from 'uplot-plus';

function generateData(): ChartData {
  const n = 500;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(i);
    y1.push(Math.sin(i * 0.05) * 50 + 50 + Math.random() * 10);
    y2.push(Math.cos(i * 0.03) * 30 + 40 + Math.random() * 8);
  }
  return [{ x, series: [y1, y2] }];
}

/**
 * ZoomRanger with bidirectional sync via `syncScaleKey`.
 *
 * - Drag the ranger window → main chart x-range updates.
 * - Wheel/drag-zoom the main chart → ranger window follows.
 *
 * No controlled `<Scale>` props or callback plumbing required — the shared
 * `syncScaleKey` does it.
 */
export default function ZoomRangerSyncDemo() {
  const data = useMemo(() => generateData(), []);

  return (
    <div>
      <Chart
        width="auto"
        height={300}
        data={data}
        syncScaleKey="zr-sync"
        actions={[['wheel', 'zoomX'], ['leftDrag', 'zoomX']]}
      >
        <Series label="Signal A" />
        <Series label="Signal B" />
      </Chart>

      <div className="mt-2">
        <ZoomRanger
          width="auto"
          height={60}
          data={data}
          syncScaleKey="zr-sync"
          initialRange={[100, 400]}
          colors={['#2196f3', '#ff9800']}
          grips
        />
      </div>
    </div>
  );
}
