import { bench, describe } from 'vitest';
import { CanvasRenderer } from '@/rendering/CanvasRenderer';
import { linear } from '@/paths/linear';
import { DataStore } from '@/core/DataStore';
import { ScaleManager } from '@/core/ScaleManager';
import { convergeSize } from '@/axes/layout';
import type { ChartData } from '@/types';
import type { AxisState } from '@/types/axes';
import { Side } from '@/types';
import { round } from '@/math/utils';

const pxRound = (v: number) => round(v);
const builder = linear();

function makeData(nSeries: number, nPoints: number): ChartData {
  const x = Array.from({ length: nPoints }, (_, i) => i);
  const series: (number | null)[][] = [];
  for (let s = 0; s < nSeries; s++) {
    series.push(Array.from({ length: nPoints }, (_, i) => Math.sin(i * 0.01 + s) * 100));
  }
  return [{ x, series }];
}

function makeScales(nPoints: number) {
  const mgr = new ScaleManager();
  mgr.addScale({ id: 'x', min: 0, max: nPoints - 1 });
  mgr.addScale({ id: 'y', min: -100, max: 100 });
  mgr.setGroupXScale(0, 'x');
  return mgr;
}

function makeAxes(): AxisState[] {
  return [
    {
      config: { scale: 'x', side: Side.Bottom },
      _show: true, _size: 50, _pos: 0, _lpos: 0,
      _splits: null, _values: null, _incr: 1, _space: 50, _rotate: 0,
    },
    {
      config: { scale: 'y', side: Side.Left },
      _show: true, _size: 50, _pos: 0, _lpos: 0,
      _splits: null, _values: null, _incr: 1, _space: 50, _rotate: 0,
    },
  ];
}

function runFullRedraw(nSeries: number, nPoints: number) {
  const data = makeData(nSeries, nPoints);
  const mgr = makeScales(nPoints);
  const ds = new DataStore();
  ds.setData(data);

  const xScale = mgr.getScale('x')!;
  const yScale = mgr.getScale('y')!;

  ds.updateWindows(() => xScale);

  const axes = makeAxes();
  convergeSize(800, 600, axes, (id) => mgr.getScale(id));

  // Build and draw paths for each series
  // CanvasRenderer constructed for side-effect registration
  for (let s = 0; s < nSeries; s++) {
    const window = ds.getWindow(0);
    builder(
      data[0]!.x, data[0]!.series[s]!,
      xScale, yScale,
      700, 500, 50, 20,
      window[0], window[1],
      1, pxRound,
    );
  }
}

describe('full render pass', () => {
  bench('1 series, 10K points', () => {
    runFullRedraw(1, 10_000);
  });

  bench('10 series, 10K points', () => {
    runFullRedraw(10, 10_000);
  });

  bench('1 series, 100K points', () => {
    runFullRedraw(1, 100_000);
  });

  bench('1 series, 1M points', () => {
    runFullRedraw(1, 1_000_000);
  });
});

describe('path building vs cache hit', () => {
  const data = makeData(1, 100_000);
  const mgr = makeScales(100_000);
  const xScale = mgr.getScale('x')!;
  const yScale = mgr.getScale('y')!;
  const renderer = new CanvasRenderer();

  bench('cache miss: build 100K point path', () => {
    builder(
      data[0]!.x, data[0]!.series[0]!,
      xScale, yScale,
      700, 500, 50, 20,
      0, 99_999,
      1, pxRound,
    );
  });

  // Pre-cache a path, then benchmark cache hit
  const paths = builder(
    data[0]!.x, data[0]!.series[0]!,
    xScale, yScale,
    700, 500, 50, 20,
    0, 99_999,
    1, pxRound,
  );
  renderer.setCachedPaths(0, 0, 0, 99_999, paths);

  bench('cache hit: exact key lookup', () => {
    renderer.getCachedPaths(0, 0, 0, 99_999);
  });

  bench('cache hit: superset fallback', () => {
    renderer.getCachedPaths(0, 0, 1000, 98_999);
  });
});
