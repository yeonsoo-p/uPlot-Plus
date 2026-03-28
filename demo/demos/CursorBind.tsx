import React, { useMemo } from 'react';
import { Chart, Series, Legend } from '../../src';

export default function CursorBind() {
  const data1 = useMemo(() => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.sin(i * 0.05) * 30 + 50 + (Math.random() - 0.5) * 5);
    return [{ x, series: [y] }];
  }, []);

  const data2 = useMemo(() => {
    const n = 200;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = x.map(i => Math.cos(i * 0.03) * 20 + 40 + (Math.random() - 0.5) * 8);
    return [{ x, series: [y] }];
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Two charts synced via <code>syncKey=&quot;bind&quot;</code>. Hover one to see cursor on both.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={200} data={data1} syncKey="bind" xlabel="Index" ylabel="Temperature">
          <Series group={0} index={0} label="Temp (C)" />
          <Legend />
        </Chart>
      </div>
      <Chart width={800} height={200} data={data2} syncKey="bind" xlabel="Index" ylabel="Humidity">
        <Series group={0} index={0} label="Humidity (%)" />
        <Legend />
      </Chart>
    </div>
  );
}
