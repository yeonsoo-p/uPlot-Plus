import React from 'react';

// --- Getting Started ---
import BasicLine from './BasicLine';
import SimpleData from './SimpleData';
import MinimalChart from './MinimalChart';
import AreaFill from './AreaFill';
import PointStyles from './PointStyles';
import DashPatterns from './DashPatterns';
import LegendDemo from './LegendDemo';
import NoData from './NoData';

// --- Line Styles ---
import SmoothLines from './SmoothLines';
import SteppedLines from './SteppedLines';
import LinePaths from './LinePaths';
import SpanGaps from './SpanGaps';
import FillTo from './FillTo';

// --- Bars & Stacking ---
import BarChart from './BarChart';
import MultiBars from './MultiBars';
import BarsGroupedStacked from './BarsGroupedStacked';
import StackedBars from './StackedBars';
import StackedSeries from './StackedSeries';
import ThinBarsStrokeFill from './ThinBarsStrokeFill';
import BarsValuesAutosize from './BarsValuesAutosize';
import SparklinesBars from './SparklinesBars';

// --- Scales ---
import MultipleScales from './MultipleScales';
import DependentScales from './DependentScales';
import LogScales from './LogScales';
import LogScales2 from './LogScales2';
import AsinhScales from './AsinhScales';
import ScaleDirection from './ScaleDirection';
import ScalePadding from './ScalePadding';
import SoftMinMax from './SoftMinMax';
import SyncYZero from './SyncYZero';

// --- Axes & Formatting ---
import FormattersShowcase from './FormattersShowcase';
import AxisControl from './AxisControl';
import CustomAxisValues from './CustomAxisValues';
import AxisAutosize from './AxisAutosize';
import AxisIndicators from './AxisIndicators';
import GridOverSeries from './GridOverSeries';
import CustomScales from './CustomScales';
import NiceScale from './NiceScale';

// --- Time & Dates ---
import TimeSeries from './TimeSeries';
import MonthsTimeSeries from './MonthsTimeSeries';
import TimezonesDST from './TimezonesDST';
import TimePeriods from './TimePeriods';
import TimeseriesDiscrete from './TimeseriesDiscrete';
import TimelineDiscrete from './TimelineDiscrete';

// --- Cursor & Interaction ---
import UseChartDemo from './UseChartDemo';
import SyncCursor from './SyncCursor';
import CursorBind from './CursorBind';
import CursorSnap from './CursorSnap';
import FocusCursor from './FocusCursor';
import NearestNonNull from './NearestNonNull';
import Tooltips from './Tooltips';
import TooltipsClosest from './TooltipsClosest';
import CursorTooltip from './CursorTooltip';
import HoverLabel from './HoverLabel';
import FloatingLegendDemo from './FloatingLegendDemo';

// --- Zoom & Pan ---
import ZoomWheel from './ZoomWheel';
import ZoomTouch from './ZoomTouch';
import ZoomVariations from './ZoomVariations';
import ZoomFetch from './ZoomFetch';
import ZoomModifierKeys from './ZoomModifierKeys';
import YScaleDrag from './YScaleDrag';
import ZoomRangerDemo from './ZoomRanger';
import ZoomRangerGrips from './ZoomRangerGrips';
import ZoomRangerXY from './ZoomRangerXY';
import EventCallbacks from './EventCallbacks';
import SelectFetch from './SelectFetch';

// --- Data Handling ---
import MissingData from './MissingData';
import SparseData from './SparseData';
import PathGapClip from './PathGapClip';
import AlignData from './AlignData';
import MultiXAxis from './MultiXAxis';
import AddDelSeries from './AddDelSeries';
import DataTypes from './DataTypes';

// --- Tooltips & Legends ---
import CustomTooltipDemo from './CustomTooltipDemo';

// --- Layout & Streaming ---
import StreamingHookDemo from './StreamingHookDemo';
import Sparklines from './Sparklines';
import ResizeDemo from './ResizeDemo';
import ResponsiveDemo from './ResponsiveDemo';
import ScrollSync from './ScrollSync';
import StreamData from './StreamData';
import RealtimeSine from './RealtimeSine';
import LargeDataset from './LargeDataset';
import UpdateCursorSelectResize from './UpdateCursorSelectResize';

// --- Annotations & Drawing ---
import DrawHooksComposable from './DrawHooksComposable';
import PaletteColors from './PaletteColors';
import BandDemo from './BandDemo';
import DrawHooks from './DrawHooks';
import Annotations from './Annotations';
import Gradients from './Gradients';
import HighLowBands from './HighLowBands';

// --- Specialized Charts ---
import CandlestickOHLC from './CandlestickOHLC';
import Heatmap from './Heatmap';
import BoxWhisker from './BoxWhisker';
import ScatterPlot from './ScatterPlot';
import Trendlines from './Trendlines';
import MeasureDatums from './MeasureDatums';
import DataSmoothing from './DataSmoothing';
import WindDirection from './WindDirection';
import MassSpectrum from './MassSpectrum';

// Load all demo source files as raw strings at build time
const sourceModules = import.meta.glob('./*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

// Build lookup: filename (without extension) -> source text
const sourceByFile: Record<string, string> = {};
for (const [path, source] of Object.entries(sourceModules)) {
  const name = path.replace('./', '').replace('.tsx', '');
  sourceByFile[name] = source;
}

export interface DemoEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  component: React.ComponentType;
  sourceFile: string;
}

export const demos: DemoEntry[] = [
  // --- Getting Started ---
  { id: 'basic-line', title: 'Basic Line', description: 'Sine and cosine waves. Drag to zoom, double-click to reset.', category: 'Getting Started', component: BasicLine, sourceFile: 'BasicLine' },
  { id: 'simple-data', title: 'Simple Data Formats', description: 'Three data input forms: {x,y}, [{x,y}], and [{x, series}].', category: 'Getting Started', component: SimpleData, sourceFile: 'SimpleData' },
  { id: 'minimal-chart', title: 'Minimal Chart', description: 'Progressive complexity — from minimal to fully customized.', category: 'Getting Started', component: MinimalChart, sourceFile: 'MinimalChart' },
  { id: 'area-fill', title: 'Area Fill', description: 'Semi-transparent fill under each series using the fill prop.', category: 'Getting Started', component: AreaFill, sourceFile: 'AreaFill' },
  { id: 'point-styles', title: 'Point Styles', description: 'Line-only, line+points, points-only, and custom point colors.', category: 'Getting Started', component: PointStyles, sourceFile: 'PointStyles' },
  { id: 'dash-patterns', title: 'Dash Patterns', description: 'Visual catalog of line dash patterns and cap styles.', category: 'Getting Started', component: DashPatterns, sourceFile: 'DashPatterns' },
  { id: 'legend', title: 'Legend', description: 'Legend component at top/bottom with live values and click-to-toggle.', category: 'Tooltips & Legends', component: LegendDemo, sourceFile: 'LegendDemo' },
  { id: 'no-data', title: 'No Data / Edge Cases', description: 'Single point, two points, and all-null edge cases.', category: 'Data Handling', component: NoData, sourceFile: 'NoData' },

  // --- Line Styles ---
  { id: 'smooth-lines', title: 'Smooth Lines', description: 'Linear vs monotone cubic vs Catmull-Rom spline interpolation.', category: 'Line Styles', component: SmoothLines, sourceFile: 'SmoothLines' },
  { id: 'stepped-lines', title: 'Stepped Lines', description: 'Staircase paths with step-after, step-before, and mid-step alignment.', category: 'Line Styles', component: SteppedLines, sourceFile: 'SteppedLines' },
  { id: 'line-paths', title: 'Line Paths', description: 'All path builder types: linear, monotoneCubic, catmullRom, stepped, bars, points.', category: 'Line Styles', component: LinePaths, sourceFile: 'LinePaths' },
  { id: 'span-gaps', title: 'Span Gaps', description: 'spanGaps connects series across null values instead of breaking the line.', category: 'Line Styles', component: SpanGaps, sourceFile: 'SpanGaps' },
  { id: 'fill-to', title: 'Fill To', description: 'fillTo prop: fill to zero, fill to a constant, or fill to scale min/max.', category: 'Line Styles', component: FillTo, sourceFile: 'FillTo' },

  // --- Bars & Stacking ---
  { id: 'bar-chart', title: 'Bar Chart', description: 'Bar path builder with multiple series for monthly revenue/cost data.', category: 'Bars & Stacking', component: BarChart, sourceFile: 'BarChart' },
  { id: 'multi-bars', title: 'Multi Bars', description: 'Multiple bar series grouped side-by-side per x-position.', category: 'Bars & Stacking', component: MultiBars, sourceFile: 'MultiBars' },
  { id: 'bars-grouped', title: 'Grouped Bars', description: 'Side-by-side grouped bars using the groupedBars() path builder.', category: 'Bars & Stacking', component: BarsGroupedStacked, sourceFile: 'BarsGroupedStacked' },
  { id: 'bars-stacked', title: 'Stacked Bars', description: 'Stacked bars using stackGroup() and Band components.', category: 'Bars & Stacking', component: StackedBars, sourceFile: 'StackedBars' },
  { id: 'stacked-series', title: 'Stacked Series', description: 'Stacked area chart using stackGroup() data transformation.', category: 'Bars & Stacking', component: StackedSeries, sourceFile: 'StackedSeries' },
  { id: 'thin-bars-stroke-fill', title: 'Thin Bars Stroke/Fill', description: 'Bar chart variations: stroke-only, fill-only, stroke+fill.', category: 'Bars & Stacking', component: ThinBarsStrokeFill, sourceFile: 'ThinBarsStrokeFill' },
  { id: 'bars-values-autosize', title: 'Bar Value Labels', description: 'Bar chart with value labels drawn above each bar.', category: 'Bars & Stacking', component: BarsValuesAutosize, sourceFile: 'BarsValuesAutosize' },
  { id: 'sparklines-bars', title: 'Sparklines (Bars)', description: 'Sparkline-sized bar charts embedded in a table.', category: 'Layout & Streaming', component: SparklinesBars, sourceFile: 'SparklinesBars' },

  // --- Scales ---
  { id: 'multiple-scales', title: 'Multiple Scales', description: 'Temperature and humidity on independent y-scales with left/right axes.', category: 'Scales', component: MultipleScales, sourceFile: 'MultipleScales' },
  { id: 'dependent-scales', title: 'Dependent Scales', description: 'Fahrenheit left axis with derived Celsius right axis.', category: 'Scales', component: DependentScales, sourceFile: 'DependentScales' },
  { id: 'log-scales', title: 'Log Scales', description: 'Logarithmic y-scale (base 10) for exponential growth data.', category: 'Scales', component: LogScales, sourceFile: 'LogScales' },
  { id: 'log-scales-2', title: 'Log Scales (Base 2 vs 10)', description: 'Logarithmic scale comparison: base 10 vs base 2.', category: 'Scales', component: LogScales2, sourceFile: 'LogScales2' },
  { id: 'asinh-scales', title: 'Asinh Scales', description: 'Inverse hyperbolic sine scale for data spanning negative-to-positive.', category: 'Scales', component: AsinhScales, sourceFile: 'AsinhScales' },
  { id: 'scale-direction', title: 'Scale Direction', description: 'Reversed y-axis (dir=-1) for depth charts where values increase downward.', category: 'Scales', component: ScaleDirection, sourceFile: 'ScaleDirection' },
  { id: 'scale-padding', title: 'Scale Padding', description: 'Scale with extra padding around data range.', category: 'Scales', component: ScalePadding, sourceFile: 'ScalePadding' },
  { id: 'soft-minmax', title: 'Soft Min/Max', description: 'Scale soft limits that expand but do not contract.', category: 'Scales', component: SoftMinMax, sourceFile: 'SoftMinMax' },
  { id: 'sync-y-zero', title: 'Sync Y Zero', description: 'Two y-scales both pinned at zero.', category: 'Scales', component: SyncYZero, sourceFile: 'SyncYZero' },

  // --- Axes & Formatting ---
  { id: 'axis-control', title: 'Axis Control', description: '50,000 points with a fixed y-scale range and axis customization.', category: 'Axes & Formatting', component: AxisControl, sourceFile: 'AxisControl' },
  { id: 'custom-axis-values', title: 'Custom Axis Values', description: 'Custom formatters: seconds as HH:MM on x-axis, MB/s units on y-axis.', category: 'Axes & Formatting', component: CustomAxisValues, sourceFile: 'CustomAxisValues' },
  { id: 'axis-autosize', title: 'Axis Autosize', description: 'Axis auto-sizing for wide numeric labels (millions).', category: 'Axes & Formatting', component: AxisAutosize, sourceFile: 'AxisAutosize' },
  { id: 'axis-indicators', title: 'Axis Indicators', description: 'Grid, tick, and border decoration options on all four axes.', category: 'Axes & Formatting', component: AxisIndicators, sourceFile: 'AxisIndicators' },
  { id: 'grid-over-series', title: 'Grid Over Series', description: 'Default grid-behind vs grid-over-series using onDraw hook.', category: 'Axes & Formatting', component: GridOverSeries, sourceFile: 'GridOverSeries' },
  { id: 'formatters', title: 'Formatters', description: 'All axis formatter functions: fmtCompact, fmtSuffix, fmtHourMin, fmtMonthName, fmtDateStr, fmtLabels.', category: 'Axes & Formatting', component: FormattersShowcase, sourceFile: 'FormattersShowcase' },
  { id: 'custom-scales', title: 'Custom Scales', description: 'Manual fixed min/max vs auto-ranged scale comparison.', category: 'Scales', component: CustomScales, sourceFile: 'CustomScales' },
  { id: 'nice-scale', title: 'Nice Scale', description: 'Auto-range producing "nice" round tick values.', category: 'Scales', component: NiceScale, sourceFile: 'NiceScale' },

  // --- Time & Dates ---
  { id: 'time-series', title: 'Time Series', description: 'Unix timestamps with HH:MM formatting — monitoring dashboard pattern.', category: 'Time & Dates', component: TimeSeries, sourceFile: 'TimeSeries' },
  { id: 'months-time-series', title: 'Monthly Time Series', description: 'Monthly timestamps with month-name x-axis formatting.', category: 'Time & Dates', component: MonthsTimeSeries, sourceFile: 'MonthsTimeSeries' },
  { id: 'timezones-dst', title: 'Timezones & DST', description: 'Time series spanning a DST spring-forward transition.', category: 'Time & Dates', component: TimezonesDST, sourceFile: 'TimezonesDST' },
  { id: 'time-periods', title: 'Time Periods', description: 'Hourly, daily, and monthly time granularities.', category: 'Time & Dates', component: TimePeriods, sourceFile: 'TimePeriods' },
  { id: 'timeseries-discrete', title: 'Discrete Time Series', description: 'Stepped interpolation for discrete status values.', category: 'Time & Dates', component: TimeseriesDiscrete, sourceFile: 'TimeseriesDiscrete' },
  { id: 'timeline-discrete', title: 'Timeline (Discrete)', description: 'Discrete event spans as horizontal colored bars with lane labels.', category: 'Specialized Charts', component: TimelineDiscrete, sourceFile: 'TimelineDiscrete' },

  // --- Cursor & Interaction ---
  { id: 'sync-cursor', title: 'Sync Cursor', description: 'Two charts sharing cursor position via syncKey.', category: 'Cursor & Interaction', component: SyncCursor, sourceFile: 'SyncCursor' },
  { id: 'cursor-bind', title: 'Cursor Bind', description: 'Two charts synced via syncKey with different data.', category: 'Cursor & Interaction', component: CursorBind, sourceFile: 'CursorBind' },
  { id: 'cursor-snap', title: 'Cursor Snap', description: 'Cursor snapping with sparse data (30 points).', category: 'Cursor & Interaction', component: CursorSnap, sourceFile: 'CursorSnap' },
  { id: 'focus-cursor', title: 'Focus Cursor', description: 'Proximity-based focus dims non-closest series on hover.', category: 'Cursor & Interaction', component: FocusCursor, sourceFile: 'FocusCursor' },
  { id: 'nearest-non-null', title: 'Nearest Non-Null', description: 'Cursor snapping that skips over null values.', category: 'Cursor & Interaction', component: NearestNonNull, sourceFile: 'NearestNonNull' },
  { id: 'tooltips', title: 'Tooltips', description: 'Default tooltip component showing all series values at cursor.', category: 'Tooltips & Legends', component: Tooltips, sourceFile: 'Tooltips' },
  { id: 'tooltips-closest', title: 'Tooltips (Closest)', description: 'Custom tooltip showing only the closest series value.', category: 'Tooltips & Legends', component: TooltipsClosest, sourceFile: 'TooltipsClosest' },
  { id: 'cursor-tooltip', title: 'Cursor + Tooltip Sync', description: 'Two synced charts each with tooltip following cursor.', category: 'Tooltips & Legends', component: CursorTooltip, sourceFile: 'CursorTooltip' },
  { id: 'hover-label', title: 'Hover Label', description: 'Hover over a series for 1 second to show its label as a floating tag.', category: 'Cursor & Interaction', component: HoverLabel, sourceFile: 'HoverLabel' },
  { id: 'floating-legend', title: 'Floating Legend', description: 'Draggable legend widget inside the chart area with live values.', category: 'Tooltips & Legends', component: FloatingLegendDemo, sourceFile: 'FloatingLegendDemo' },
  { id: 'custom-tooltip', title: 'Custom Tooltip', description: 'Fully custom tooltip UI via the Tooltip children render prop.', category: 'Tooltips & Legends', component: CustomTooltipDemo, sourceFile: 'CustomTooltipDemo' },

  // --- Zoom & Pan ---
  { id: 'zoom-wheel', title: 'Wheel Zoom', description: 'Mouse wheel zoom on x-axis centered at cursor position.', category: 'Zoom & Pan', component: ZoomWheel, sourceFile: 'ZoomWheel' },
  { id: 'zoom-touch', title: 'Touch Zoom', description: 'Two-finger pinch to zoom on touch devices.', category: 'Zoom & Pan', component: ZoomTouch, sourceFile: 'ZoomTouch' },
  { id: 'zoom-variations', title: 'Zoom Variations', description: 'Drag zoom, wheel zoom, and double-click reset combined.', category: 'Zoom & Pan', component: ZoomVariations, sourceFile: 'ZoomVariations' },
  { id: 'zoom-fetch', title: 'Zoom Fetch', description: 'Zoom triggers simulated data re-fetch with loading indicator.', category: 'Zoom & Pan', component: ZoomFetch, sourceFile: 'ZoomFetch' },
  { id: 'zoom-modifier-keys', title: 'Modifier Key Zoom', description: 'Shift+scroll for X zoom, Alt+scroll for Y zoom.', category: 'Zoom & Pan', component: ZoomModifierKeys, sourceFile: 'ZoomModifierKeys' },
  { id: 'y-scale-drag', title: 'Y-Scale Drag', description: 'Click and drag on y-axis gutters to pan the scale range.', category: 'Zoom & Pan', component: YScaleDrag, sourceFile: 'YScaleDrag' },
  { id: 'zoom-ranger', title: 'Zoom Ranger', description: 'Overview mini-chart with draggable selection controlling detail chart zoom.', category: 'Zoom & Pan', component: ZoomRangerDemo, sourceFile: 'ZoomRanger' },
  { id: 'zoom-ranger-grips', title: 'Zoom Ranger (Grips)', description: 'Zoom ranger with visible grip handles on selection edges.', category: 'Zoom & Pan', component: ZoomRangerGrips, sourceFile: 'ZoomRangerGrips' },
  { id: 'zoom-ranger-xy', title: 'Zoom Ranger (XY)', description: 'Zoom ranger with dual y-axes and wheel zoom on detail chart.', category: 'Zoom & Pan', component: ZoomRangerXY, sourceFile: 'ZoomRangerXY' },
  { id: 'event-callbacks', title: 'Event Callbacks', description: 'Click, right-click context menu, and programmatic zoom via controlled Scale props.', category: 'Cursor & Interaction', component: EventCallbacks, sourceFile: 'EventCallbacks' },
  { id: 'select-fetch', title: 'Select \u2192 Fetch', description: 'Intercept drag selection to fetch detail data instead of zooming via onSelect.', category: 'Cursor & Interaction', component: SelectFetch, sourceFile: 'SelectFetch' },
  { id: 'use-chart', title: 'useChart() Hook', description: 'Programmatic access to chart store: scale ranges, cursor position, layout info.', category: 'Cursor & Interaction', component: UseChartDemo, sourceFile: 'UseChartDemo' },

  // --- Data Handling ---
  { id: 'missing-data', title: 'Missing Data', description: 'Null values in data arrays create gaps. Dual y-axes with custom formatters.', category: 'Data Handling', component: MissingData, sourceFile: 'MissingData' },
  { id: 'sparse-data', title: 'Sparse Data', description: 'Very sparse data (10 points across large x-range).', category: 'Data Handling', component: SparseData, sourceFile: 'SparseData' },
  { id: 'path-gap-clip', title: 'Path Gap Clip', description: 'Null gaps vs spanGaps for handling missing data points.', category: 'Data Handling', component: PathGapClip, sourceFile: 'PathGapClip' },
  { id: 'align-data', title: 'Align Data', description: 'Merge datasets with different x-values using alignData() utility.', category: 'Data Handling', component: AlignData, sourceFile: 'AlignData' },
  { id: 'multi-x-axis', title: 'Multi X-Axis', description: 'uPlot+ exclusive: two data groups with independent x-ranges on one chart.', category: 'Data Handling', component: MultiXAxis, sourceFile: 'MultiXAxis' },
  { id: 'add-del-series', title: 'Add/Remove Series', description: 'Toggle buttons to dynamically add/remove series.', category: 'Data Handling', component: AddDelSeries, sourceFile: 'AddDelSeries' },
  { id: 'data-types', title: 'Data Types', description: 'Accepts number[], Float64Array, and (number|null)[] — normalized automatically.', category: 'Data Handling', component: DataTypes, sourceFile: 'DataTypes' },

  // --- Layout & Streaming ---
  { id: 'sparklines', title: 'Sparklines', description: 'Tiny 150x30 charts with hidden axes, embedded in a table.', category: 'Layout & Streaming', component: Sparklines, sourceFile: 'Sparklines' },
  { id: 'resize-demo', title: 'Resize', description: 'Dynamically resize chart with width/height sliders.', category: 'Layout & Streaming', component: ResizeDemo, sourceFile: 'ResizeDemo' },
  { id: 'responsive-demo', title: 'Responsive', description: 'Auto-size chart to container via ResizeObserver.', category: 'Layout & Streaming', component: ResponsiveDemo, sourceFile: 'ResponsiveDemo' },
  { id: 'scroll-sync', title: 'Scroll Sync', description: 'Multiple synced charts in a scrollable container.', category: 'Layout & Streaming', component: ScrollSync, sourceFile: 'ScrollSync' },
  { id: 'streaming-hook', title: 'useStreamingData Hook', description: 'Streaming via the useStreamingData hook: push(), start/stop, FPS counter, sliding window.', category: 'Layout & Streaming', component: StreamingHookDemo, sourceFile: 'StreamingHookDemo' },
  { id: 'stream-data', title: 'Stream Data', description: '3-series 60fps streaming with 2000-point sliding window and FPS counter.', category: 'Layout & Streaming', component: StreamData, sourceFile: 'StreamData' },
  { id: 'realtime-sine', title: 'Real-Time Sine', description: '10,000-point scrolling sine waves at 60fps — inspired by webgl-plot-react.', category: 'Layout & Streaming', component: RealtimeSine, sourceFile: 'RealtimeSine' },
  { id: 'large-dataset', title: 'Large Dataset', description: '2,000,000 points rendered with minimal configuration to test performance.', category: 'Layout & Streaming', component: LargeDataset, sourceFile: 'LargeDataset' },
  { id: 'update-cursor-select-resize', title: 'Live Data Update', description: 'Live-updating data with cursor stability testing.', category: 'Layout & Streaming', component: UpdateCursorSelectResize, sourceFile: 'UpdateCursorSelectResize' },

  // --- Annotations & Drawing ---
  { id: 'draw-hooks', title: 'Draw Hooks', description: 'onDraw for threshold lines/zones, onCursorDraw for crosshair labels.', category: 'Annotations & Drawing', component: DrawHooks, sourceFile: 'DrawHooks' },
  { id: 'annotations', title: 'Annotations', description: 'Declarative annotation components: horizontal lines, vertical markers, shaded regions, and labels.', category: 'Annotations & Drawing', component: Annotations, sourceFile: 'Annotations' },
  { id: 'gradients', title: 'Gradients', description: 'Area chart with linear gradient fills from top to bottom.', category: 'Annotations & Drawing', component: Gradients, sourceFile: 'Gradients' },
  { id: 'high-low-bands', title: 'High/Low Bands', description: 'Band component fills the region between upper and lower confidence bounds.', category: 'Annotations & Drawing', component: HighLowBands, sourceFile: 'HighLowBands' },
  { id: 'band-demo', title: 'Band Component', description: 'Band component: confidence intervals, between-series fills, and multiple bands.', category: 'Annotations & Drawing', component: BandDemo, sourceFile: 'BandDemo' },
  { id: 'draw-hooks-composable', title: 'Composable Draw Hooks', description: 'useDrawHook and useCursorDrawHook as composable child components for canvas drawing.', category: 'Annotations & Drawing', component: DrawHooksComposable, sourceFile: 'DrawHooksComposable' },
  { id: 'palette-colors', title: 'Palette & Colors', description: 'palette(), withAlpha(), fadeGradient() — auto-generate colors, transparency, and gradient fills.', category: 'Annotations & Drawing', component: PaletteColors, sourceFile: 'PaletteColors' },

  // --- Specialized Charts ---
  { id: 'candlestick-ohlc', title: 'Candlestick / OHLC', description: 'Financial candlestick chart with green/red candles via onDraw hook.', category: 'Specialized Charts', component: CandlestickOHLC, sourceFile: 'CandlestickOHLC' },
  { id: 'heatmap', title: 'Heatmap', description: 'Latency heatmap with color-mapped rectangles via onDraw hook.', category: 'Specialized Charts', component: Heatmap, sourceFile: 'Heatmap' },
  { id: 'box-whisker', title: 'Box & Whisker', description: 'Box and whisker plot with Q1-Q3 boxes and min-max whiskers.', category: 'Specialized Charts', component: BoxWhisker, sourceFile: 'BoxWhisker' },
  { id: 'scatter-plot', title: 'Scatter Plot', description: 'Scatter plot with point-only series and wheel zoom.', category: 'Specialized Charts', component: ScatterPlot, sourceFile: 'ScatterPlot' },
  { id: 'trendlines', title: 'Trendlines', description: 'Line chart with linear regression trendline overlay.', category: 'Specialized Charts', component: Trendlines, sourceFile: 'Trendlines' },
  { id: 'measure-datums', title: 'Measure Datums', description: 'Click to set reference point, cursor shows distance measurement.', category: 'Specialized Charts', component: MeasureDatums, sourceFile: 'MeasureDatums' },
  { id: 'data-smoothing', title: 'Data Smoothing', description: 'Noisy signal with moving-average smoothed overlay.', category: 'Specialized Charts', component: DataSmoothing, sourceFile: 'DataSmoothing' },
  { id: 'wind-direction', title: 'Wind Direction', description: 'Wind speed with directional arrow markers via onDraw hook.', category: 'Specialized Charts', component: WindDirection, sourceFile: 'WindDirection' },
  { id: 'mass-spectrum', title: 'Mass Spectrum', description: 'Mass spectrum bars with logarithmic y-scale.', category: 'Specialized Charts', component: MassSpectrum, sourceFile: 'MassSpectrum' },
];

export function getDemoSource(demo: DemoEntry): string {
  return sourceByFile[demo.sourceFile] ?? '';
}
