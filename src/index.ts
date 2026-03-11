// Components
export { Chart } from './components/Chart';
export { Scale } from './components/Scale';
export { Series } from './components/Series';
export { Axis } from './components/Axis';
export { Band } from './components/Band';
export { Legend } from './components/Legend';

// Hooks
export { useChart } from './hooks/useChart';
export { useDrawHook, useCursorDrawHook } from './hooks/useDrawHook';

// Types
export type {
  ChartProps,
  ChartData,
  XGroup,
  SeriesRef,
  ScaleConfig,
  SeriesConfig,
  AxisConfig,
  CursorState,
  SelectState,
  GridConfig,
  TickConfig,
  BorderConfig,
  PointsConfig,
} from './types';

export type { BandConfig } from './types/bands';
export type { LegendConfig } from './types/legend';
export type { DrawContext, DrawCallback, CursorDrawCallback } from './types/hooks';

// Path builders
export { linear } from './paths/linear';
export { stepped } from './paths/stepped';
export { bars } from './paths/bars';
export { monotoneCubic } from './paths/monotoneCubic';
export { catmullRom } from './paths/catmullRom';
export { points } from './paths/points';

// Cursor/selection draw config types
export type { CursorDrawConfig } from './rendering/drawCursor';
export type { SelectDrawConfig } from './rendering/drawSelect';
