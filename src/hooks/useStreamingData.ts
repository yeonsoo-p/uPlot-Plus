import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChartData, DataInput } from '../types';
import { normalizeData } from '../core/normalizeData';

export interface StreamingOptions {
  /** Maximum number of data points to retain (sliding window size) */
  window: number;
  /** Number of points to push per tick (default: 1) */
  batchSize?: number;
  /** Start streaming immediately on mount (default: true) */
  autoStart?: boolean;
}

export interface StreamingResult {
  /** Current chart data (pass to <Chart data={...}>) */
  data: ChartData;
  /**
   * Push new data points into group 0. Oldest points beyond the window are dropped.
   * Multiple calls within the same animation frame are batched into a single React update.
   * @param x - new x values
   * @param ySeries - one array of new y values per series
   */
  push: (x: number[], ...ySeries: number[][]) => void;
  /**
   * Push new data points into a specific group. Oldest points beyond the window are dropped.
   * Other groups are preserved unchanged.
   * Multiple calls within the same animation frame are batched into a single React update.
   * @param group - target group index
   * @param x - new x values
   * @param ySeries - one array of new y values per series
   */
  pushGroup: (group: number, x: number[], ...ySeries: number[][]) => void;
  /** Start the rAF loop (calls the onTick callback each frame) */
  start: () => void;
  /** Stop the rAF loop */
  stop: () => void;
  /** Whether the rAF loop is running */
  running: boolean;
  /** Frames per second (smoothed) */
  fps: number;
}

interface PendingGroup {
  x: number[];
  series: number[][];
}

/**
 * Hook for streaming/real-time chart data with a sliding window.
 *
 * Manages a requestAnimationFrame loop and FPS counter.
 * Call `push()` from your own tick callback, or use it standalone.
 *
 * Multiple push() calls within the same animation frame are batched
 * into a single React state update, avoiding redundant re-renders.
 */
export function useStreamingData(
  initialData: DataInput,
  options: StreamingOptions,
): StreamingResult {
  const { window: windowSize, batchSize = 1 } = options;
  const autoStart = options.autoStart ?? true;

  const [data, setData] = useState<ChartData>(() => normalizeData(initialData));
  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(0);

  const rafRef = useRef(0);
  const fpsFrames = useRef(0);
  const fpsLast = useRef(0);

  // Pending buffer for rAF-batched pushes
  const pendingRef = useRef<Map<number, PendingGroup>>(new Map());
  const batchRafRef = useRef(0);
  const windowSizeRef = useRef(windowSize);
  windowSizeRef.current = windowSize;
  const batchSizeRef = useRef(batchSize);
  batchSizeRef.current = batchSize;

  const pushGroup = useCallback(
    (groupIdx: number, x: number[], ...ySeries: number[][]) => {
      // Accumulate into pending buffer
      let pending = pendingRef.current.get(groupIdx);
      if (pending == null) {
        pending = { x: [], series: ySeries.map(() => []) };
        pendingRef.current.set(groupIdx, pending);
      }
      pending.x.push(...x);
      for (let i = 0; i < ySeries.length; i++) {
        let arr = pending.series[i];
        if (arr == null) {
          arr = [];
          pending.series[i] = arr;
        }
        arr.push(...(ySeries[i] ?? []));
      }

      // Schedule flush on next rAF, respecting batchSize threshold
      const totalPending = pending.x.length;
      if (batchRafRef.current === 0 && totalPending >= batchSizeRef.current) {
        batchRafRef.current = requestAnimationFrame(() => {
          batchRafRef.current = 0;
          const batched = pendingRef.current;
          pendingRef.current = new Map();
          const ws = windowSizeRef.current;

          setData(prev => {
            const next = prev.slice();
            for (const [gi, { x: bx, series: bs }] of batched) {
              const group = next[gi];
              if (group == null) continue;

              const prevX = group.x as number[];
              const drop = Math.max(0, prevX.length + bx.length - ws);
              const newX = drop > 0 ? prevX.slice(drop).concat(bx) : prevX.concat(bx);

              const newSeries = group.series.map((s, i) => {
                const arr = s as number[];
                const yNew = bs[i] ?? [];
                return drop > 0 ? arr.slice(drop).concat(yNew) : arr.concat(yNew);
              });

              next[gi] = { x: newX, series: newSeries };
            }
            return next;
          });
        });
      }
    },
    [],
  );

  const push = useCallback(
    (x: number[], ...ySeries: number[][]) => {
      pushGroup(0, x, ...ySeries);
    },
    [pushGroup],
  );

  const start = useCallback(() => {
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  // FPS tracking + rAF loop
  useEffect(() => {
    if (!running) {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    fpsLast.current = performance.now();
    fpsFrames.current = 0;

    const loop = (now: number) => {
      fpsFrames.current++;
      const elapsed = now - fpsLast.current;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsFrames.current * 1000) / elapsed));
        fpsFrames.current = 0;
        fpsLast.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [running]);

  // Cleanup batch rAF on unmount
  useEffect(() => {
    return () => {
      if (batchRafRef.current !== 0) {
        cancelAnimationFrame(batchRafRef.current);
      }
    };
  }, []);

  // Auto-start on mount
  useEffect(() => {
    if (autoStart) setRunning(true);
  }, [autoStart]);

  return { data, push, pushGroup, start, stop, running, fps };
}
