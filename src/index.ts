// Components
export { Chart } from './components/Chart';
export { Scale } from './components/Scale';
export { Series } from './components/Series';
export { Axis } from './components/Axis';

// Hooks
export { useChart } from './hooks/useChart';

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

// Path builders
export { linear } from './paths/linear';

// Cursor/selection draw config types
export type { CursorDrawConfig } from './rendering/drawCursor';
export type { SelectDrawConfig } from './rendering/drawSelect';
