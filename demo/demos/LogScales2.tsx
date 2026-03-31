import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Distribution } from 'uplot-plus';

export default function LogScales2() {
  const data = useMemo(() => {
    const n = 80;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = x.map(i => Math.pow(2, i / 8) + (Math.random() - 0.5) * Math.pow(2, i / 10));
    return [{ x, series: [y] }];
  }, []);

  const fmtLog10 = (splits: number[]) =>
    splits.map(v => {
      if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
      if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
      return v.toFixed(0);
    });

  const fmtLog2 = (splits: number[]) =>
    splits.map(v => {
      if (v >= 1024) return (v / 1024).toFixed(0) + 'K';
      return v.toFixed(0);
    });

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Log scale comparison: base 10 (top) vs base 2 (bottom) on exponentially growing data.
      </p>
      <div style={{ marginBottom: 16 }}>
        <Chart width={800} height={220} data={data} title="Log base 10">
          <Scale id="y"  distr={Distribution.Log} log={10} />
          <Axis scale="y" label="Value (log10)" values={fmtLog10} />
          <Series group={0} index={0} label="Base 10" />
        </Chart>
      </div>
      <div>
        <Chart width={800} height={220} data={data} title="Log base 2">
          <Scale id="y"  distr={Distribution.Log} log={2} />
          <Axis scale="y" label="Value (log2)" values={fmtLog2} />
          <Series group={0} index={0} label="Base 2" />
        </Chart>
      </div>
    </div>
  );
}
