import { useState, useMemo } from 'react';
import { Chart, Series, Legend, palette } from 'uplot-plus';

const COLORS = palette(5);
const LABELS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

export default function AddDelSeries() {
  const [visible, setVisible] = useState<boolean[]>([true, true, false, false, false]);

  const data = useMemo(() => {
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
      <div className="mb-2 flex gap-1.5">
        {LABELS.map((label, i) => (
          <button
            key={label}
            onClick={() => toggle(i)}
            className="text-white border-none px-3 py-1 rounded cursor-pointer"
            style={{
              background: visible[i] ? COLORS[i] : '#ccc',
            }}
          >
            {visible[i] ? 'Hide' : 'Show'} {label}
          </button>
        ))}
      </div>
      <Chart width="auto" height={400} data={data} xlabel="Index" ylabel="Value">
        {LABELS.map((label, i) =>
          visible[i] ? (
            <Series
              key={label}
              group={0}
              index={i}
              label={label}
            />
          ) : null
        )}
        <Legend />
      </Chart>
    </div>
  );
}
