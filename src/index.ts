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
export { FloatingLegend } from './components/FloatingLegend';
export { HoverLabel } from './components/HoverLabel';
export { BoxWhisker } from './components/BoxWhisker';
export { Heatmap } from './components/Heatmap';
export { Vector } from './components/Vector';

// Overlay components
export { DraggableLabel } from './components/DraggableLabel';

// Annotation components (declarative)
export { HLine, VLine, Region, VRegion, DiagonalLine, AnnotationLabel } from './components/annotations';

// Theme
export { ThemeProvider } from './components/ThemeProvider';
export type { ThemeProviderProps } from './components/ThemeProvider';
export { THEME_DEFAULTS, DARK_THEME } from './rendering/theme';
export type { ResolvedTheme } from './rendering/theme';

// Hooks
export { useChart } from './hooks/useChart';
export type { ChartAPI } from './hooks/useChart';
export { useDrawHook, useCursorDrawHook } from './hooks/useDrawHook';

// Types
export type {
  ChartProps,
  SizeValue,
  ChartData,
  XGroup,
  SeriesRef,
  DataArray,
  SimpleGroup,
  FullGroup,
  DataInput,
  ScaleConfig,
  SeriesConfig,
  AxisConfig,
  CursorState,
  SelectState,
  GridConfig,
  TickConfig,
  BorderConfig,
  PointsConfig,
  ActionList,
  ActionEntry,
  ActionKey,
  BuiltinAction,
  ReactionValue,
  BuiltinReaction,
  ActionContext,
  DragContinuation,
  GradientConfig,
  ColorValue,
  ChartTheme,
  CornerPosition,
  OverlayPosition,
  OverlayOffset,
} from './types';

export type { ChartSnapshot } from './hooks/useChartStore';
export type { BandConfig } from './types/bands';
export type { LegendConfig } from './types/legend';
export type { TooltipProps, TooltipData, TooltipItem } from './types/tooltip';
export type { DrawContext, DrawCallback, CursorDrawCallback } from './types/hooks';
export type { ChartEventInfo, NearestPoint, SelectEventInfo, ScaleChangeCallback, SelectCallback, EventCallbacks } from './types/events';
export type { AnnotationStyle, DiagonalLineStyle } from './annotations';
export type { LttbResult } from './types/downsample';
export type { ZoomRangerProps } from './components/ZoomRanger';
export type { TimelineProps, TimelineLane, TimelineSegment } from './types/timeline';
export type { CandlestickProps } from './components/Candlestick';
export type { SparklineProps } from './components/Sparkline';
export type { FloatingLegendProps } from './components/FloatingLegend';
export type { HoverLabelProps } from './components/HoverLabel';
export type { DraggableLabelProps } from './components/DraggableLabel';
export type { HLineProps, VLineProps, RegionProps, VRegionProps, DiagonalLineProps, AnnotationLabelProps } from './components/annotations';
export type { BoxWhiskerProps } from './components/BoxWhisker';
export type { HeatmapProps } from './components/Heatmap';
export type { VectorProps } from './components/Vector';
// Path builders
export { linear } from './paths/linear';
export { stepped } from './paths/stepped';
export { bars, groupedBars, stackedBars, horizontalBars, horizontalGroupedBars, horizontalStackedBars } from './paths/bars';
export { monotoneCubic } from './paths/monotoneCubic';
export { catmullRom } from './paths/catmullRom';
export { points } from './paths/points';
export { Candlestick } from './components/Candlestick';

// Data utilities
export { stackGroup } from './math/stack';
export { alignData } from './math/align';
export { lttb, lttbGroup } from './math/lttb';

// Annotation helpers
export { drawHLine, drawVLine, drawLabel, drawRegion, drawVRegion, drawDiagonalLine, drawSlopeInterceptLine } from './annotations';

// Scale utilities (for advanced draw hooks that need raw access)
export { valToPos, posToVal, valToPx, projectPoint, scaleAxis } from './core/Scale';

// Interaction defaults and reaction factories
export { DEFAULT_ACTIONS, focus } from './types/interaction';

// Enums
export { Side, Orientation, Direction, Distribution, SortOrder, sideOrientation } from './types';

// Utility helpers
export { at } from './utils/at';

// Axis value formatters
export { fmtCompact, fmtSuffix, fmtPrefix, fmtWrap, fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels } from './formatters';
export type { AxisValueFormatter } from './formatters';

// Color utilities
export { fadeGradient, withAlpha, palette } from './colors';

// Cursor/selection draw config types
export type { CursorDrawConfig } from './rendering/drawCursor';
export type { SelectDrawConfig } from './rendering/drawSelect';
