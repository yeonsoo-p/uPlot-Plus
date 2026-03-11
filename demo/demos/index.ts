import React from 'react';

// --- Getting Started ---
import BasicLine from './BasicLine';
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
import YShiftedSeries from './YShiftedSeries';

// --- Axes & Grid ---
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

// --- Cursor & Tooltips ---
import SyncCursor from './SyncCursor';
import CursorBind from './CursorBind';
import CursorSnap from './CursorSnap';
import FocusCursor from './FocusCursor';
import NearestNonNull from './NearestNonNull';
import Tooltips from './Tooltips';
import TooltipsClosest from './TooltipsClosest';
import CursorTooltip from './CursorTooltip';

// --- Zoom & Interaction ---
import ZoomWheel from './ZoomWheel';
import ZoomTouch from './ZoomTouch';
import ZoomVariations from './ZoomVariations';
import ZoomFetch from './ZoomFetch';
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

// --- Layout & Live Data ---
import Sparklines from './Sparklines';
import ResizeDemo from './ResizeDemo';
import ScrollSync from './ScrollSync';
import StreamData from './StreamData';
import RealtimeSine from './RealtimeSine';
import LargeDataset from './LargeDataset';
import UpdateCursorSelectResize from './UpdateCursorSelectResize';

// --- Annotations & Overlays ---
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

export interface DemoEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  component: React.ComponentType;
}

export const demos: DemoEntry[] = [
  // --- Getting Started ---
  { id: 'basic-line', title: 'Basic Line', description: 'Sine and cosine waves. Drag to zoom, double-click to reset.', category: 'Getting Started', component: BasicLine },
  { id: 'area-fill', title: 'Area Fill', description: 'Semi-transparent fill under each series using the fill prop.', category: 'Getting Started', component: AreaFill },
  { id: 'point-styles', title: 'Point Styles', description: 'Line-only, line+points, points-only, and custom point colors.', category: 'Getting Started', component: PointStyles },
  { id: 'dash-patterns', title: 'Dash Patterns', description: 'Visual catalog of line dash patterns and cap styles.', category: 'Getting Started', component: DashPatterns },
  { id: 'legend', title: 'Legend', description: 'Legend component at top/bottom with live values and click-to-toggle.', category: 'Getting Started', component: LegendDemo },
  { id: 'no-data', title: 'No Data / Edge Cases', description: 'Single point, two points, and all-null edge cases.', category: 'Getting Started', component: NoData },

  // --- Line Styles ---
  { id: 'smooth-lines', title: 'Smooth Lines', description: 'Linear vs monotone cubic vs Catmull-Rom spline interpolation.', category: 'Line Styles', component: SmoothLines },
  { id: 'stepped-lines', title: 'Stepped Lines', description: 'Staircase paths with step-after, step-before, and mid-step alignment.', category: 'Line Styles', component: SteppedLines },
  { id: 'line-paths', title: 'Line Paths', description: 'All path builder types: linear, monotoneCubic, catmullRom, stepped, bars, points.', category: 'Line Styles', component: LinePaths },
  { id: 'span-gaps', title: 'Span Gaps', description: 'spanGaps connects series across null values instead of breaking the line.', category: 'Line Styles', component: SpanGaps },
  { id: 'fill-to', title: 'Fill To', description: 'fillTo prop: fill to zero, fill to a constant, or fill to scale min/max.', category: 'Line Styles', component: FillTo },

  // --- Bars & Stacking ---
  { id: 'bar-chart', title: 'Bar Chart', description: 'Bar path builder with multiple series for monthly revenue/cost data.', category: 'Bars & Stacking', component: BarChart },
  { id: 'multi-bars', title: 'Multi Bars', description: 'Multiple bar series grouped side-by-side per x-position.', category: 'Bars & Stacking', component: MultiBars },
  { id: 'bars-grouped-stacked', title: 'Grouped & Stacked Bars', description: 'Side-by-side grouped bars and stacked bars comparison.', category: 'Bars & Stacking', component: BarsGroupedStacked },
  { id: 'stacked-series', title: 'Stacked Series', description: 'Stacked area chart using stackGroup() data transformation.', category: 'Bars & Stacking', component: StackedSeries },
  { id: 'thin-bars-stroke-fill', title: 'Thin Bars Stroke/Fill', description: 'Bar chart variations: stroke-only, fill-only, stroke+fill.', category: 'Bars & Stacking', component: ThinBarsStrokeFill },
  { id: 'bars-values-autosize', title: 'Bar Value Labels', description: 'Bar chart with value labels drawn above each bar.', category: 'Bars & Stacking', component: BarsValuesAutosize },
  { id: 'sparklines-bars', title: 'Sparklines (Bars)', description: 'Sparkline-sized bar charts embedded in a table.', category: 'Bars & Stacking', component: SparklinesBars },

  // --- Scales ---
  { id: 'multiple-scales', title: 'Multiple Scales', description: 'Temperature and humidity on independent y-scales with left/right axes.', category: 'Scales', component: MultipleScales },
  { id: 'dependent-scales', title: 'Dependent Scales', description: 'Fahrenheit left axis with derived Celsius right axis.', category: 'Scales', component: DependentScales },
  { id: 'log-scales', title: 'Log Scales', description: 'Logarithmic y-scale (base 10) for exponential growth data.', category: 'Scales', component: LogScales },
  { id: 'log-scales-2', title: 'Log Scales (Base 2 vs 10)', description: 'Logarithmic scale comparison: base 10 vs base 2.', category: 'Scales', component: LogScales2 },
  { id: 'asinh-scales', title: 'Asinh Scales', description: 'Inverse hyperbolic sine scale for data spanning negative-to-positive.', category: 'Scales', component: AsinhScales },
  { id: 'scale-direction', title: 'Scale Direction', description: 'Reversed y-axis (dir=-1) for depth charts where values increase downward.', category: 'Scales', component: ScaleDirection },
  { id: 'scale-padding', title: 'Scale Padding', description: 'Scale with extra padding around data range.', category: 'Scales', component: ScalePadding },
  { id: 'soft-minmax', title: 'Soft Min/Max', description: 'Scale soft limits that expand but do not contract.', category: 'Scales', component: SoftMinMax },
  { id: 'sync-y-zero', title: 'Sync Y Zero', description: 'Two y-scales both pinned at zero.', category: 'Scales', component: SyncYZero },
  { id: 'y-shifted-series', title: 'Y-Shifted Series', description: 'Series on separate y-scales showing overlapping patterns.', category: 'Scales', component: YShiftedSeries },

  // --- Axes & Grid ---
  { id: 'axis-control', title: 'Axis Control', description: '50,000 points with a fixed y-scale range and axis customization.', category: 'Axes & Grid', component: AxisControl },
  { id: 'custom-axis-values', title: 'Custom Axis Values', description: 'Custom formatters: seconds as HH:MM on x-axis, MB/s units on y-axis.', category: 'Axes & Grid', component: CustomAxisValues },
  { id: 'axis-autosize', title: 'Axis Autosize', description: 'Axis auto-sizing for wide numeric labels (millions).', category: 'Axes & Grid', component: AxisAutosize },
  { id: 'axis-indicators', title: 'Axis Indicators', description: 'Grid, tick, and border decoration options on all four axes.', category: 'Axes & Grid', component: AxisIndicators },
  { id: 'grid-over-series', title: 'Grid Over Series', description: 'Default grid-behind vs grid-over-series using onDraw hook.', category: 'Axes & Grid', component: GridOverSeries },
  { id: 'custom-scales', title: 'Custom Scales', description: 'Manual fixed min/max vs auto-ranged scale comparison.', category: 'Axes & Grid', component: CustomScales },
  { id: 'nice-scale', title: 'Nice Scale', description: 'Auto-range producing "nice" round tick values.', category: 'Axes & Grid', component: NiceScale },

  // --- Time & Dates ---
  { id: 'time-series', title: 'Time Series', description: 'Unix timestamps with HH:MM formatting — monitoring dashboard pattern.', category: 'Time & Dates', component: TimeSeries },
  { id: 'months-time-series', title: 'Monthly Time Series', description: 'Monthly timestamps with month-name x-axis formatting.', category: 'Time & Dates', component: MonthsTimeSeries },
  { id: 'timezones-dst', title: 'Timezones & DST', description: 'Time series spanning a DST spring-forward transition.', category: 'Time & Dates', component: TimezonesDST },
  { id: 'time-periods', title: 'Time Periods', description: 'Hourly, daily, and monthly time granularities.', category: 'Time & Dates', component: TimePeriods },
  { id: 'timeseries-discrete', title: 'Discrete Time Series', description: 'Stepped interpolation for discrete status values.', category: 'Time & Dates', component: TimeseriesDiscrete },
  { id: 'timeline-discrete', title: 'Timeline (Discrete)', description: 'Discrete event spans as horizontal colored bars with lane labels.', category: 'Time & Dates', component: TimelineDiscrete },

  // --- Cursor & Tooltips ---
  { id: 'sync-cursor', title: 'Sync Cursor', description: 'Two charts sharing cursor position via syncKey.', category: 'Cursor & Tooltips', component: SyncCursor },
  { id: 'cursor-bind', title: 'Cursor Bind', description: 'Two charts synced via syncKey with different data.', category: 'Cursor & Tooltips', component: CursorBind },
  { id: 'cursor-snap', title: 'Cursor Snap', description: 'Cursor snapping with sparse data (30 points).', category: 'Cursor & Tooltips', component: CursorSnap },
  { id: 'focus-cursor', title: 'Focus Cursor', description: 'Proximity-based focus dims non-closest series on hover.', category: 'Cursor & Tooltips', component: FocusCursor },
  { id: 'nearest-non-null', title: 'Nearest Non-Null', description: 'Cursor snapping that skips over null values.', category: 'Cursor & Tooltips', component: NearestNonNull },
  { id: 'tooltips', title: 'Tooltips', description: 'Default tooltip component showing all series values at cursor.', category: 'Cursor & Tooltips', component: Tooltips },
  { id: 'tooltips-closest', title: 'Tooltips (Closest)', description: 'Custom tooltip showing only the closest series value.', category: 'Cursor & Tooltips', component: TooltipsClosest },
  { id: 'cursor-tooltip', title: 'Cursor + Tooltip Sync', description: 'Two synced charts each with tooltip following cursor.', category: 'Cursor & Tooltips', component: CursorTooltip },

  // --- Zoom & Interaction ---
  { id: 'zoom-wheel', title: 'Wheel Zoom', description: 'Mouse wheel zoom on x-axis centered at cursor position.', category: 'Zoom & Interaction', component: ZoomWheel },
  { id: 'zoom-touch', title: 'Touch Zoom', description: 'Two-finger pinch to zoom on touch devices.', category: 'Zoom & Interaction', component: ZoomTouch },
  { id: 'zoom-variations', title: 'Zoom Variations', description: 'Drag zoom, wheel zoom, and double-click reset combined.', category: 'Zoom & Interaction', component: ZoomVariations },
  { id: 'zoom-fetch', title: 'Zoom Fetch', description: 'Zoom triggers simulated data re-fetch with loading indicator.', category: 'Zoom & Interaction', component: ZoomFetch },
  { id: 'y-scale-drag', title: 'Y-Scale Drag', description: 'Click and drag on y-axis gutters to pan the scale range.', category: 'Zoom & Interaction', component: YScaleDrag },
  { id: 'zoom-ranger', title: 'Zoom Ranger', description: 'Overview mini-chart with draggable selection controlling detail chart zoom.', category: 'Zoom & Interaction', component: ZoomRangerDemo },
  { id: 'zoom-ranger-grips', title: 'Zoom Ranger (Grips)', description: 'Zoom ranger with visible grip handles on selection edges.', category: 'Zoom & Interaction', component: ZoomRangerGrips },
  { id: 'zoom-ranger-xy', title: 'Zoom Ranger (XY)', description: 'Zoom ranger with dual y-axes and wheel zoom on detail chart.', category: 'Zoom & Interaction', component: ZoomRangerXY },
  { id: 'event-callbacks', title: 'Event Callbacks', description: 'Click, right-click, and programmatic zoom via onClick, onContextMenu, and chartRef.', category: 'Zoom & Interaction', component: EventCallbacks },
  { id: 'select-fetch', title: 'Select \u2192 Fetch', description: 'Intercept drag selection to fetch detail data instead of zooming via onSelect.', category: 'Zoom & Interaction', component: SelectFetch },

  // --- Data Handling ---
  { id: 'missing-data', title: 'Missing Data', description: 'Null values in data arrays create gaps. Dual y-axes with custom formatters.', category: 'Data Handling', component: MissingData },
  { id: 'sparse-data', title: 'Sparse Data', description: 'Very sparse data (10 points across large x-range).', category: 'Data Handling', component: SparseData },
  { id: 'path-gap-clip', title: 'Path Gap Clip', description: 'Null gaps vs spanGaps for handling missing data points.', category: 'Data Handling', component: PathGapClip },
  { id: 'align-data', title: 'Align Data', description: 'Merge datasets with different x-values using alignData() utility.', category: 'Data Handling', component: AlignData },
  { id: 'multi-x-axis', title: 'Multi X-Axis', description: 'uPlot+ exclusive: two data groups with independent x-ranges on one chart.', category: 'Data Handling', component: MultiXAxis },
  { id: 'add-del-series', title: 'Add/Remove Series', description: 'Toggle buttons to dynamically add/remove series.', category: 'Data Handling', component: AddDelSeries },

  // --- Layout & Live Data ---
  { id: 'sparklines', title: 'Sparklines', description: 'Tiny 150x30 charts with hidden axes, embedded in a table.', category: 'Layout & Live Data', component: Sparklines },
  { id: 'resize-demo', title: 'Resize', description: 'Dynamically resize chart with width/height sliders.', category: 'Layout & Live Data', component: ResizeDemo },
  { id: 'scroll-sync', title: 'Scroll Sync', description: 'Multiple synced charts in a scrollable container.', category: 'Layout & Live Data', component: ScrollSync },
  { id: 'stream-data', title: 'Stream Data', description: '3-series 60fps streaming with 2000-point sliding window and FPS counter.', category: 'Layout & Live Data', component: StreamData },
  { id: 'realtime-sine', title: 'Real-Time Sine', description: '10,000-point scrolling sine waves at 60fps — inspired by webgl-plot-react.', category: 'Layout & Live Data', component: RealtimeSine },
  { id: 'large-dataset', title: 'Large Dataset', description: '2,000,000 points rendered with minimal configuration to test performance.', category: 'Layout & Live Data', component: LargeDataset },
  { id: 'update-cursor-select-resize', title: 'Live Data Update', description: 'Live-updating data with cursor stability testing.', category: 'Layout & Live Data', component: UpdateCursorSelectResize },

  // --- Annotations & Overlays ---
  { id: 'draw-hooks', title: 'Draw Hooks', description: 'onDraw for threshold lines/zones, onCursorDraw for crosshair labels.', category: 'Annotations & Overlays', component: DrawHooks },
  { id: 'annotations', title: 'Annotations', description: 'Declarative annotation components: horizontal lines, vertical markers, shaded regions, and labels.', category: 'Annotations & Overlays', component: Annotations },
  { id: 'gradients', title: 'Gradients', description: 'Area chart with linear gradient fills from top to bottom.', category: 'Annotations & Overlays', component: Gradients },
  { id: 'high-low-bands', title: 'High/Low Bands', description: 'Band component fills the region between upper and lower confidence bounds.', category: 'Annotations & Overlays', component: HighLowBands },

  // --- Specialized Charts ---
  { id: 'candlestick-ohlc', title: 'Candlestick / OHLC', description: 'Financial candlestick chart with green/red candles via onDraw hook.', category: 'Specialized Charts', component: CandlestickOHLC },
  { id: 'heatmap', title: 'Heatmap', description: 'Latency heatmap with color-mapped rectangles via onDraw hook.', category: 'Specialized Charts', component: Heatmap },
  { id: 'box-whisker', title: 'Box & Whisker', description: 'Box and whisker plot with Q1-Q3 boxes and min-max whiskers.', category: 'Specialized Charts', component: BoxWhisker },
  { id: 'scatter-plot', title: 'Scatter Plot', description: 'Scatter plot with point-only series and wheel zoom.', category: 'Specialized Charts', component: ScatterPlot },
  { id: 'trendlines', title: 'Trendlines', description: 'Line chart with linear regression trendline overlay.', category: 'Specialized Charts', component: Trendlines },
  { id: 'measure-datums', title: 'Measure Datums', description: 'Click to set reference point, cursor shows distance measurement.', category: 'Specialized Charts', component: MeasureDatums },
  { id: 'data-smoothing', title: 'Data Smoothing', description: 'Noisy signal with moving-average smoothed overlay.', category: 'Specialized Charts', component: DataSmoothing },
  { id: 'wind-direction', title: 'Wind Direction', description: 'Wind speed with directional arrow markers via onDraw hook.', category: 'Specialized Charts', component: WindDirection },
  { id: 'mass-spectrum', title: 'Mass Spectrum', description: 'Mass spectrum bars with logarithmic y-scale.', category: 'Specialized Charts', component: MassSpectrum },
];
