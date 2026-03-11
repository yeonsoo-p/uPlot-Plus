// Components
export { Chart } from './components/Chart';
export { Scale } from './components/Scale';
export { Series } from './components/Series';
export { Axis } from './components/Axis';
export { Band } from './components/Band';
export { Legend } from './components/Legend';
export { Tooltip } from './components/Tooltip';
export { ZoomRanger } from './components/ZoomRanger';
export { Timeline } from './components/Timeline';
export { Sparkline } from './components/Sparkline';
export { ResponsiveChart } from './components/ResponsiveChart';

// Annotation components (declarative)
export { HLine, VLine, Region, AnnotationLabel } from './components/annotations';

// Hooks
export { useChart } from './hooks/useChart';
export { useDrawHook, useCursorDrawHook } from './hooks/useDrawHook';
export { useStreamingData } from './hooks/useStreamingData';

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
  CursorConfig,
  FocusConfig,
  GradientConfig,
  ColorValue,
} from './types';

export type { BandConfig } from './types/bands';
export type { LegendConfig } from './types/legend';
export type { TooltipProps, TooltipData, TooltipItem } from './types/tooltip';
export type { DrawContext, DrawCallback, CursorDrawCallback } from './types/hooks';
export type { ChartEventInfo, NearestPoint, SelectEventInfo, ScaleChangeCallback, SelectCallback, EventCallbacks } from './types/events';
export type { AnnotationStyle } from './annotations';
export type { ZoomRangerProps } from './components/ZoomRanger';
export type { TimelineProps, TimelineLane, TimelineSegment } from './types/timeline';
export type { CandlestickOpts } from './paths/candlestick';
export type { SparklineProps } from './components/Sparkline';
export type { ResponsiveChartProps } from './components/ResponsiveChart';
export type { HLineProps, VLineProps, RegionProps, AnnotationLabelProps } from './components/annotations';
export type { StreamingOptions, StreamingResult } from './hooks/useStreamingData';

// Path builders
export { linear } from './paths/linear';
export { stepped } from './paths/stepped';
export { bars } from './paths/bars';
export { monotoneCubic } from './paths/monotoneCubic';
export { catmullRom } from './paths/catmullRom';
export { points } from './paths/points';
export { drawCandlesticks } from './paths/candlestick';

// Data utilities
export { stackGroup } from './math/stack';
export { alignData } from './math/align';

// Annotation helpers
export { drawHLine, drawVLine, drawLabel, drawRegion } from './annotations';

// Scale utilities (for advanced draw hooks that need raw access)
export { valToPos, posToVal } from './core/Scale';

// Axis value formatters
export { fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels } from './formatters';
export type { AxisValueFormatter } from './formatters';

// Color utilities
export { fadeGradient, withAlpha, palette } from './colors';

// Cursor/selection draw config types
export type { CursorDrawConfig } from './rendering/drawCursor';
export type { SelectDrawConfig } from './rendering/drawSelect';
