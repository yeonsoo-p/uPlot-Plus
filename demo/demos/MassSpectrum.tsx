import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, bars, Distribution, fmtSuffix } from 'uplot-plus';

function generateMassSpecData() {
  // Mass spectrum: sharp peaks at specific m/z values
  const peaks: Array<{ mz: number; intensity: number }> = [
    { mz: 18, intensity: 5e3 },
    { mz: 28, intensity: 8e4 },
    { mz: 32, intensity: 2e4 },
    { mz: 44, intensity: 1.5e5 },
    { mz: 57, intensity: 3e3 },
    { mz: 69, intensity: 7e4 },
    { mz: 77, intensity: 4e4 },
    { mz: 91, intensity: 1e5 },
    { mz: 105, intensity: 6e4 },
    { mz: 119, intensity: 2.5e4 },
    { mz: 128, intensity: 8e3 },
    { mz: 141, intensity: 3.5e4 },
    { mz: 155, intensity: 1.2e4 },
    { mz: 169, intensity: 5e3 },
    { mz: 183, intensity: 2e5 },
    { mz: 197, intensity: 1.5e4 },
    { mz: 211, intensity: 4e3 },
    { mz: 225, intensity: 9e3 },
    { mz: 253, intensity: 7e4 },
    { mz: 281, intensity: 3e4 },
    { mz: 310, intensity: 1e4 },
    { mz: 350, intensity: 5e3 },
    { mz: 391, intensity: 2e3 },
    { mz: 420, intensity: 8e2 },
  ];

  // Add some random low-intensity noise peaks
  for (let mz = 15; mz <= 430; mz += 3 + Math.floor(Math.random() * 5)) {
    const existing = peaks.find(p => Math.abs(p.mz - mz) < 2);
    if (existing == null) {
      peaks.push({ mz, intensity: Math.random() * 500 + 50 });
    }
  }

  // Sort by m/z
  peaks.sort((a, b) => a.mz - b.mz);

  const x = peaks.map(p => p.mz);
  const y = peaks.map(p => p.intensity);

  return [{ x, series: [y] }];
}

const fmtIntensity = (splits: number[]) =>
  splits.map(v => {
    if (v === 0) return '0';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return v.toFixed(0);
  });

export default function MassSpectrum() {
  const data = useMemo(() => generateMassSpecData(), []);

  return (
    <Chart width={800} height={400} data={data}>
      <Scale id="y"  distr={Distribution.Log} log={10} />
      <Axis scale="x" label="m/z" values={fmtSuffix('')} />
      <Axis scale="y" label="Intensity" values={fmtIntensity} />
      <Series
        group={0}
        index={0}
        stroke="#2c3e50"
        label="Intensity"
        paths={bars()}
      />
    </Chart>
  );
}
