import React, { useState, useMemo } from 'react';
import { Chart, Scale, Series, Axis, Legend } from '../../src';
import type { ChartData } from '../../src';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
const LABELS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

export default function AddDelSeries() {
  const [visible, setVisible] = useState<boolean[]>([true, true, false, false, false]);

  const data: ChartData = useMemo(() => {
    const n = 100;
    const x = Array.from({ length: n }, (_, i) => i);
    const allSeries = LABELS.map((_, si) =>
      x.map(i => Math.sin(i * 0.05 + si * 0.8) * (20 + si * 5) + 50)
    );
    return [{ x, series: allSeries }];
  }, []);

  const toggle = (idx: number) => {
    setVisible(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
        {LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => toggle(i)}
            style={{
              background: visible[i] ? COLORS[i] : '#ccc',
              color: '#fff',
              border: 'none',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {visible[i] ? 'Hide' : 'Show'} {label}
          </button>
        ))}
      </div>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Index" />
        <Axis scale="y" label="Value" />
        {LABELS.map((label, i) =>
          visible[i] ? (
            <Series
              key={label}
              group={0}
              index={i}
              yScale="y"
              stroke={COLORS[i]!}
              width={2}
              label={label}
            />
          ) : null
        )}
        <Legend />
      </Chart>
    </div>
  );
}
