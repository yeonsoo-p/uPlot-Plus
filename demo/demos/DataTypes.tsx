import React from 'react';
import { Chart, Series } from 'uplot-plus';

/**
 * Demonstrates that Chart accepts number[], Float64Array, and (number|null)[]
 * transparently. All are normalized internally for optimal performance.
 */
export default function DataTypes() {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* number[] — most common, promoted to Float64Array internally */}
      <div>
        <h4 style={{ margin: '0 0 4px' }}>number[]</h4>
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
          Plain arrays — promoted to Float64Array internally
        </p>
        <Chart width={250} height={180} data={{ x: [1, 2, 3, 4, 5], y: [10, 40, 20, 50, 30] }}>
          <Series group={0} index={0} label="Plain" />
        </Chart>
      </div>

      {/* Float64Array — passed through directly, zero copy */}
      <div>
        <h4 style={{ margin: '0 0 4px' }}>Float64Array</h4>
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
          Typed arrays — passed through, zero copy
        </p>
        <Chart
          width={250}
          height={180}
          data={{
            x: new Float64Array([1, 2, 3, 4, 5]),
            y: new Float64Array([10, 40, 20, 50, 30]),
          }}
        >
          <Series group={0} index={0} label="Typed" />
        </Chart>
      </div>

      {/* (number|null)[] — nulls create gaps in the series */}
      <div>
        <h4 style={{ margin: '0 0 4px' }}>(number | null)[]</h4>
        <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>
          Nullable arrays — nulls become gaps
        </p>
        <Chart width={250} height={180} data={{ x: [1, 2, 3, 4, 5], y: [10, null, 30, null, 50] }}>
          <Series group={0} index={0} label="Nullable" />
        </Chart>
      </div>
    </div>
  );
}
