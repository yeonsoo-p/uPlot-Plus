import React from 'react';
import { Chart, Scale, Series, Axis, bars } from '../../src';
import type { ChartData } from '../../src';
import type { PathBuilder, PathBuilderOpts } from '../../src/paths/types';

/**
 * Wrap the bars() path builder to inject barGroupIdx and barGroupCount
 * into the opts, enabling side-by-side grouped bars.
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

function generateData(): ChartData {
  const quarters = [1, 2, 3, 4];
  return [{
    x: quarters,
    series: [
      quarters.map(() => Math.round(Math.random() * 80 + 40)),
      quarters.map(() => Math.round(Math.random() * 60 + 30)),
      quarters.map(() => Math.round(Math.random() * 50 + 20)),
    ],
  }];
}

const fmtQuarter = (splits: number[]) =>
  splits.map(v => 'Q' + v);

const fmtK = (splits: number[]) =>
  splits.map(v => '$' + v + 'K');

export default function MultiBars() {
  const data = generateData();

  return (
    <div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Grouped bar chart: 3 product lines shown side-by-side per quarter.
      </p>
      <Chart width={800} height={400} data={data}>
        <Scale id="x" />
        <Scale id="y"  />
        <Axis scale="x" label="Quarter" values={fmtQuarter} />
        <Axis scale="y" label="Revenue" values={fmtK} />
        <Series
          group={0} index={0} yScale="y"
          stroke="#2980b9" fill="rgba(41,128,185,0.75)" width={0}
          label="Widgets" paths={groupedBars(0, 3)} fillTo={0}
        />
        <Series
          group={0} index={1} yScale="y"
          stroke="#27ae60" fill="rgba(39,174,96,0.75)" width={0}
          label="Gadgets" paths={groupedBars(1, 3)} fillTo={0}
        />
        <Series
          group={0} index={2} yScale="y"
          stroke="#8e44ad" fill="rgba(142,68,173,0.75)" width={0}
          label="Gizmos" paths={groupedBars(2, 3)} fillTo={0}
        />
      </Chart>
    </div>
  );
}
