import { createContext, useContext } from 'react';
import type { ChartStore } from './useChartStore';

export const ChartContext = createContext<ChartStore | null>(null);

/** Access the chart store from within a Chart's children */
export function useChart(): ChartStore {
  const store = useContext(ChartContext);
  if (!store) {
    throw new Error('useChart must be used within a <Chart> component');
  }
  return store;
}
