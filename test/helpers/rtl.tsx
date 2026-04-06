import React from 'react';
import { render, act } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { Chart } from '@/components/Chart';
import { useStore } from '@/hooks/useChart';
import type { ChartStore } from '@/hooks/useChartStore';
import type { ChartProps } from '@/types';
import type { DataInput } from '@/types/data';

/** Minimal valid data for tests: one group, 5 x-values, one y-series. */
export const defaultData: DataInput = [
  { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90]] },
];

/** Two-series data for legend/tooltip tests. */
export const twoSeriesData: DataInput = [
  { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90], [20, 50, 60, 40, 80]] },
];

/**
 * Tiny component that exposes the internal ChartStore via a ref callback.
 * Placed as a child of <Chart> to access the context without breaking encapsulation.
 */
export function StoreProbe({ storeRef }: { storeRef: React.MutableRefObject<ChartStore | null> }) {
  const store = useStore();
  storeRef.current = store;
  return null;
}

export interface RenderChartResult extends RenderResult {
  store: ChartStore;
}

/**
 * Render a <Chart> with sensible defaults. Returns RTL's RenderResult
 * plus a reference to the internal ChartStore.
 */
export function renderChart(
  props?: Partial<ChartProps>,
  children?: React.ReactNode,
): RenderChartResult {
  const storeRef: React.MutableRefObject<ChartStore | null> = { current: null };

  const {
    width = 800,
    height = 600,
    data = defaultData,
    ...rest
  } = props ?? {};

  const result = render(
    <Chart width={width} height={height} data={data} {...rest}>
      <StoreProbe storeRef={storeRef} />
      {children}
    </Chart>,
  );

  if (storeRef.current == null) {
    throw new Error('StoreProbe failed to capture the ChartStore');
  }

  return { ...result, store: storeRef.current };
}

/**
 * Flush pending microtasks (rAF callbacks) and React effects.
 * The test setup mocks rAF to fire via Promise.resolve().then(),
 * so awaiting inside act() flushes both React and rAF queues.
 */
export async function flushEffects(): Promise<void> {
  await act(async () => {});
}
