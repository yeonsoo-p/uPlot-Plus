import React, { useMemo } from 'react';
import { Chart, Series, Band, stackGroup } from '../../src';
import type { ChartData, BandConfig } from '../../src';

function generateRawData() {
  const n = 80;
  const x = Array.from({ length: n }, (_, i) => i);
  const s0 = x.map(() => Math.random() * 30 + 10);
  const s1 = x.map(() => Math.random() * 25 + 15);
  const s2 = x.map(() => Math.random() * 20 + 5);

  return { x, series: [s0, s1, s2] };
}

export default function StackedSeries() {
  const { stackedData, bands } = useMemo(() => {
    const raw = generateRawData();
    const rawGroup = { x: raw.x, series: raw.series };
    const result = stackGroup(rawGroup);
    const data: ChartData = [result.group];
    return { stackedData: data, bands: result.bands };
  }, []);

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Stacked area chart using stackGroup() to compute cumulative sums and bands.
      </p>
      <Chart width={800} height={400} data={stackedData} xlabel="Sample" ylabel="Value">
        <Series group={0} index={0} stroke="#e74c3c" fill="rgba(231,76,60,0.4)" label="Series A" fillTo={0} />
        <Series group={0} index={1} stroke="#2ecc71" fill="rgba(46,204,113,0.4)" label="Series B" fillTo={0} />
        <Series group={0} index={2} stroke="#3498db" fill="rgba(52,152,219,0.4)" label="Series C" fillTo={0} />
        {bands.map((b: BandConfig, i: number) => (
          <Band
            key={i}
            series={b.series}
            group={b.group}
            fill={
              b.series[0] === 2
                ? 'rgba(52,152,219,0.3)'
                : b.series[0] === 1
                  ? 'rgba(46,204,113,0.3)'
                  : 'rgba(231,76,60,0.3)'
            }
          />
        ))}
      </Chart>
    </div>
  );
}
