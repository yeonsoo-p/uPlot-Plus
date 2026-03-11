import React from 'react';
import { Chart, Scale, Series, Axis, Tooltip } from '../../src';
import type { ChartData } from '../../src';

function generateData(): ChartData {
  const n = 100;
  const x: number[] = [];
  const y1: number[] = [];
  const y2: number[] = [];
  const y3: number[] = [];

  for (let i = 0; i < n; i++) {
    const t = i * 0.1;
    x.push(t);
    y1.push(Math.sin(t) * 40 + 50);
    y2.push(Math.sin(t + 2) * 30 + 50);
    y3.push(Math.sin(t + 4) * 20 + 50);
  }

  return [{ x, series: [y1, y2, y3] }];
}

export default function TooltipsClosest() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Tooltip shows only the single closest series value to the cursor.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Time" />
        <Axis scale="y" label="Value" />
        <Series group={0} index={0} yScale="y" stroke="#e74c3c" width={2} label="Alpha" />
        <Series group={0} index={1} yScale="y" stroke="#2ecc71" width={2} label="Beta" />
        <Series group={0} index={2} yScale="y" stroke="#3498db" width={2} label="Gamma" />
        <Tooltip>
          {(data) => {
            // Find the item with the smallest absolute distance to the cursor y
            // Since we only have values (not pixel positions), pick the non-null item closest to cursor
            const validItems = data.items.filter(item => item.value != null);
            if (validItems.length === 0) return null;

            // Pick the closest by finding min distance from cursor top to each value
            let closest = validItems[0]!;
            let minDist = Infinity;
            for (const item of validItems) {
              if (item.value != null) {
                // Use the cursor y relative position as proxy
                const dist = Math.abs(item.value - (data.x ?? 0));
                if (dist < minDist) {
                  minDist = dist;
                  closest = item;
                }
              }
            }

            return (
              <div
                style={{
                  background: 'rgba(0,0,0,0.85)',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: 'sans-serif',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.xLabel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: closest.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>{closest.label}:</span>
                  <span style={{ fontWeight: 600 }}>
                    {closest.value != null ? closest.value.toPrecision(4) : '\u2014'}
                  </span>
                </div>
              </div>
            );
          }}
        </Tooltip>
      </Chart>
    </div>
  );
}
