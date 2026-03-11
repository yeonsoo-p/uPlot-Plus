import React, { useMemo } from 'react';
import { Chart, Scale, Series, Axis, Band, bars, stackGroup } from '../../src';
import type { ChartData, BandConfig } from '../../src';
import type { PathBuilder, PathBuilderOpts } from '../../src/paths/types';

/**
 * Wrap the bars() path builder to inject barGroupIdx and barGroupCount
 * into the opts that are passed by the CanvasRenderer.
 */
function groupedBars(groupIdx: number, groupCount: number): PathBuilder {
  const inner = bars();
  return (dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, opts) => {
    const merged: PathBuilderOpts = {
      ...opts,
      barGroupIdx: groupIdx,
      barGroupCount: groupCount,
    };
    return inner(dataX, dataY, scaleX, scaleY, xDim, yDim, xOff, yOff, idx0, idx1, dir, pxRound, merged);
  };
}

const months = [1, 2, 3, 4, 5, 6];
const fmtMonth = (splits: number[]) =>
  splits.map(v => {
    const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return names[v] ?? String(v);
  });

function makeGroupedData(): ChartData {
  return [{
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 60 + 20)),
      months.map(() => Math.round(Math.random() * 50 + 15)),
      months.map(() => Math.round(Math.random() * 40 + 10)),
    ],
  }];
}

function makeStackedData() {
  const raw = {
    x: months,
    series: [
      months.map(() => Math.round(Math.random() * 30 + 10)),
      months.map(() => Math.round(Math.random() * 25 + 10)),
      months.map(() => Math.round(Math.random() * 20 + 5)),
    ],
  };
  const result = stackGroup(raw);
  return { data: [result.group] as ChartData, bands: result.bands };
}

export default function BarsGroupedStacked() {
  const groupedData = useMemo(() => makeGroupedData(), []);
  const { data: stackedData, bands } = useMemo(() => makeStackedData(), []);

  return (
    <div>
      <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>Grouped Bars</h3>
      <Chart width={800} height={300} data={groupedData}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Month" values={fmtMonth} />
        <Axis scale="y" label="Sales" />
        <Series group={0} index={0} yScale="y" stroke="#2980b9" fill="rgba(41,128,185,0.7)" width={0} label="Product A" paths={groupedBars(0, 3)} fillTo={0} />
        <Series group={0} index={1} yScale="y" stroke="#27ae60" fill="rgba(39,174,96,0.7)" width={0} label="Product B" paths={groupedBars(1, 3)} fillTo={0} />
        <Series group={0} index={2} yScale="y" stroke="#e67e22" fill="rgba(230,126,34,0.7)" width={0} label="Product C" paths={groupedBars(2, 3)} fillTo={0} />
      </Chart>

      <h3 style={{ fontSize: 14, margin: '24px 0 8px' }}>Stacked Bars</h3>
      <Chart width={800} height={300} data={stackedData}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Month" values={fmtMonth} />
        <Axis scale="y" label="Sales" />
        <Series group={0} index={0} yScale="y" stroke="#2980b9" fill="rgba(41,128,185,0.8)" width={0} label="Product A" paths={bars()} fillTo={0} />
        <Series group={0} index={1} yScale="y" stroke="#27ae60" fill="rgba(39,174,96,0.8)" width={0} label="Product B" paths={bars()} fillTo={0} />
        <Series group={0} index={2} yScale="y" stroke="#e67e22" fill="rgba(230,126,34,0.8)" width={0} label="Product C" paths={bars()} fillTo={0} />
        {bands.map((b: BandConfig, i: number) => (
          <Band
            key={i}
            series={b.series}
            group={b.group}
            fill={
              b.series[0] === 2
                ? 'rgba(230,126,34,0.6)'
                : 'rgba(39,174,96,0.6)'
            }
          />
        ))}
      </Chart>
    </div>
  );
}
