import React from 'react';
import { Chart, Series } from '../../src';

/**
 * Demonstrates the three data input formats accepted by Chart.
 */
export default function SimpleData() {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y1 = [10, 40, 20, 50, 30, 60, 25, 45];
  const y2 = [30, 20, 40, 10, 50, 15, 55, 35];

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Form 1: { x, y } — single series, simplest possible */}
      <div>
        <h4 style={{ margin: '0 0 8px' }}>{'{ x, y }'}</h4>
        <Chart width={250} height={200} data={{ x, y: y1 }}>
          <Series group={0} index={0} />
        </Chart>
      </div>

      {/* Form 2: [{ x, y }] — array of single-series groups */}
      <div>
        <h4 style={{ margin: '0 0 8px' }}>{'[{ x, y }]'}</h4>
        <Chart width={250} height={200} data={[{ x, y: y1 }]}>
          <Series group={0} index={0} />
        </Chart>
      </div>

      {/* Form 3: [{ x, series }] — full multi-series form */}
      <div>
        <h4 style={{ margin: '0 0 8px' }}>{'[{ x, series }]'}</h4>
        <Chart width={250} height={200} data={[{ x, series: [y1, y2] }]}>
          <Series group={0} index={0} />
          <Series group={0} index={1} />
        </Chart>
      </div>
    </div>
  );
}
