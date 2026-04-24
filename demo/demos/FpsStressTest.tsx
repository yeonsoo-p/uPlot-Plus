import { useState, useRef, useCallback, useEffect } from 'react';
import { Chart, Scale, Series, Axis } from 'uplot-plus';
import { Distribution } from 'uplot-plus';
import { fmtCompact } from 'uplot-plus';

const START_POINTS = 1000;
const MAX_POINTS = 100_000_000;
const GROWTH_RATE = 1.04; // multiply point count by this each frame
const FPS_SAMPLE_MS = 200; // record an FPS data point this often


/** Extend existing arrays in-place with new random walk points */
function extendRandomWalk(
  x: number[],
  y: number[],
  target: number,
  state: { val: number; momentum: number; volatility: number; drift: number },
) {
  const start = x.length;
  for (let i = start; i < target; i++) {
    x.push(i);
    if (Math.random() < 0.0001) {
      state.volatility = 0.3 + Math.random() * 3;
      state.drift = (Math.random() - 0.5) * 0.3;
    }
    state.momentum = state.momentum * 0.98 + (Math.random() - 0.5) * state.volatility;
    state.val += state.momentum + state.drift;
    state.val *= 0.99999;
    y.push(state.val);
  }
}

export default function FpsStressTest() {
  const [data, setData] = useState<{ x: number[]; series: number[][] }[]>([]);
  const [fpsChartData, setFpsChartData] = useState<{ x: number[]; series: number[][] }[]>([]);
  const [running, setRunning] = useState(false);
  const [currentFps, setCurrentFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [pointCount, setPointCount] = useState(0);

  const runningRef = useRef(false);
  const xRef = useRef<number[]>([]);
  const yRef = useRef<number[]>([]);
  const walkState = useRef({ val: 0, momentum: 0, volatility: 1, drift: 0 });
  const sizeRef = useRef(START_POINTS);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const fpsXRef = useRef<number[]>([]);
  const fpsYRef = useRef<number[]>([]);

  const reset = useCallback(() => {
    xRef.current = [];
    yRef.current = [];
    walkState.current = { val: 0, momentum: 0, volatility: 1, drift: 0 };
    sizeRef.current = START_POINTS;
    fpsXRef.current = [];
    fpsYRef.current = [];

    // Generate initial data
    extendRandomWalk(xRef.current, yRef.current, START_POINTS, walkState.current);
    setData([{ x: xRef.current, series: [yRef.current] }]);
    setFpsChartData([]);
    setCurrentFps(0);
    setFrameTime(0);
    setPointCount(START_POINTS);
  }, []);

  const start = useCallback(() => {
    reset();
    setRunning(true);
    runningRef.current = true;
  }, [reset]);

  const stop = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
  }, []);

  useEffect(() => {
    if (!running) return;

    let rafId: number;
    let growthDone = false;
    frameCountRef.current = 0;
    lastFpsTimeRef.current = performance.now();

    const loop = () => {
      if (!runningRef.current) return;

      const t0 = performance.now();

      // Grow the dataset smoothly (until capped)
      if (!growthDone) {
        const prevSize = sizeRef.current;
        const nextSize = Math.min(Math.ceil(prevSize * GROWTH_RATE), MAX_POINTS);
        sizeRef.current = nextSize;

        if (nextSize > xRef.current.length) {
          extendRandomWalk(xRef.current, yRef.current, nextSize, walkState.current);
        }

        setPointCount(nextSize);
        if (nextSize >= MAX_POINTS) growthDone = true;
      }

      // Set new data reference to trigger chart redraw
      setData([{ x: xRef.current, series: [yRef.current] }]);

      const t1 = performance.now();
      const ft = Math.round((t1 - t0) * 10) / 10;
      setFrameTime(ft);

      frameCountRef.current++;
      const elapsed = t0 - lastFpsTimeRef.current;

      // Sample FPS at regular intervals
      if (elapsed >= FPS_SAMPLE_MS) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = t0;
        setCurrentFps(fps);

        // Record to FPS chart only while still growing
        if (!growthDone) {
          fpsXRef.current.push(sizeRef.current);
          fpsYRef.current.push(fps);
          setFpsChartData([{ x: [...fpsXRef.current], series: [[...fpsYRef.current]] }]);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [running]);

  const hasFpsData = fpsChartData.length > 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={running ? stop : start}
          className="px-4 py-1 text-demo cursor-pointer"
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={reset}
          disabled={running}
          className={`px-3 py-1 text-demo ${running ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
        >
          Reset
        </button>
        <span className="text-demo text-muted">
          {pointCount.toLocaleString()} pts
        </span>
        <span
          className={`text-demo font-bold ${currentFps > 50 ? 'text-green-600' : currentFps > 30 ? 'text-amber-500' : 'text-red-500'}`}>
          {currentFps} FPS
        </span>
        <span className="text-xs text-muted-lighter">
          {frameTime} ms/frame
        </span>
      </div>

      {data.length > 0 && (
        <Chart width="auto" height={300} data={data} xlabel="Index" ylabel="Value">
          <Series label="Random Walk" width={1} />
        </Chart>
      )}

      {hasFpsData && (
        <div className="mt-4">
          <Chart width="auto" height={250} data={fpsChartData} xlabel="Points" ylabel="FPS">
            <Scale id="x" distr={Distribution.Log} log={10} />
            <Axis scale="x" values={fmtCompact()} />
            <Series label="FPS" width={2} stroke="#e74c3c" />
          </Chart>
        </div>
      )}
    </div>
  );
}
