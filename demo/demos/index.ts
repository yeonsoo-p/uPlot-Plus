import React from 'react';
import BasicLine from './BasicLine';
import AreaFill from './AreaFill';
import MissingData from './MissingData';
import PointStyles from './PointStyles';
import MultipleScales from './MultipleScales';
import AxisControl from './AxisControl';
import LogScales from './LogScales';
import CustomAxisValues from './CustomAxisValues';
import DashPatterns from './DashPatterns';
import Sparklines from './Sparklines';
import MultiXAxis from './MultiXAxis';
import SteppedLines from './SteppedLines';
import SmoothLines from './SmoothLines';
import BarChart from './BarChart';
import HighLowBands from './HighLowBands';
import FillTo from './FillTo';
import AsinhScales from './AsinhScales';
import DependentScales from './DependentScales';
import ScaleDirection from './ScaleDirection';
import SyncCursor from './SyncCursor';
import DrawHooks from './DrawHooks';
import StreamData from './StreamData';
import SpanGaps from './SpanGaps';
import LargeDataset from './LargeDataset';
import NoData from './NoData';
import GridOverSeries from './GridOverSeries';
import LegendDemo from './LegendDemo';
import TimeSeries from './TimeSeries';

export interface DemoEntry {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
}

export const demos: DemoEntry[] = [
  {
    id: 'basic-line',
    title: 'Basic Line',
    description: 'Sine and cosine waves. Drag to zoom, double-click to reset.',
    component: BasicLine,
  },
  {
    id: 'area-fill',
    title: 'Area Fill',
    description: 'Semi-transparent fill under each series using the fill prop.',
    component: AreaFill,
  },
  {
    id: 'missing-data',
    title: 'Missing Data',
    description: 'Null values in data arrays create gaps. Dual y-axes with custom formatters.',
    component: MissingData,
  },
  {
    id: 'point-styles',
    title: 'Point Styles',
    description: 'Line-only, line+points, points-only, and custom point colors.',
    component: PointStyles,
  },
  {
    id: 'multiple-scales',
    title: 'Multiple Scales',
    description: 'Temperature and humidity on independent y-scales with left/right axes.',
    component: MultipleScales,
  },
  {
    id: 'axis-control',
    title: 'Axis Control',
    description: '50,000 points with a fixed y-scale range and axis customization.',
    component: AxisControl,
  },
  {
    id: 'log-scales',
    title: 'Log Scales',
    description: 'Logarithmic y-scale (base 10) for exponential growth data.',
    component: LogScales,
  },
  {
    id: 'custom-axis-values',
    title: 'Custom Axis Values',
    description: 'Custom formatters: seconds as HH:MM on x-axis, MB/s units on y-axis.',
    component: CustomAxisValues,
  },
  {
    id: 'dash-patterns',
    title: 'Dash Patterns',
    description: 'Visual catalog of line dash patterns and cap styles.',
    component: DashPatterns,
  },
  {
    id: 'sparklines',
    title: 'Sparklines',
    description: 'Tiny 150x30 charts with hidden axes, embedded in a table.',
    component: Sparklines,
  },
  {
    id: 'multi-x-axis',
    title: 'Multi X-Axis',
    description: 'uPlot+ exclusive: two data groups with independent x-ranges on one chart.',
    component: MultiXAxis,
  },
  {
    id: 'stepped-lines',
    title: 'Stepped Lines',
    description: 'Staircase paths with step-after, step-before, and mid-step alignment.',
    component: SteppedLines,
  },
  {
    id: 'smooth-lines',
    title: 'Smooth Lines',
    description: 'Linear vs monotone cubic vs Catmull-Rom spline interpolation.',
    component: SmoothLines,
  },
  {
    id: 'bar-chart',
    title: 'Bar Chart',
    description: 'Bar path builder with multiple series for monthly revenue/cost data.',
    component: BarChart,
  },
  {
    id: 'high-low-bands',
    title: 'High/Low Bands',
    description: 'Band component fills the region between upper and lower confidence bounds.',
    component: HighLowBands,
  },
  {
    id: 'fill-to',
    title: 'Fill To',
    description: 'fillTo prop: fill to zero, fill to a constant, or fill to scale min/max.',
    component: FillTo,
  },
  {
    id: 'asinh-scales',
    title: 'Asinh Scales',
    description: 'Inverse hyperbolic sine scale for data spanning negative-to-positive.',
    component: AsinhScales,
  },
  {
    id: 'dependent-scales',
    title: 'Dependent Scales',
    description: 'Fahrenheit left axis with derived Celsius right axis.',
    component: DependentScales,
  },
  {
    id: 'scale-direction',
    title: 'Scale Direction',
    description: 'Reversed y-axis (dir=-1) for depth charts where values increase downward.',
    component: ScaleDirection,
  },
  {
    id: 'sync-cursor',
    title: 'Sync Cursor',
    description: 'Two charts sharing cursor position via syncKey. Move cursor over either chart.',
    component: SyncCursor,
  },
  {
    id: 'draw-hooks',
    title: 'Draw Hooks',
    description: 'onDraw for threshold lines/zones, onCursorDraw for crosshair labels.',
    component: DrawHooks,
  },
  {
    id: 'stream-data',
    title: 'Stream Data',
    description: 'Live streaming data via React useState with sliding window updates.',
    component: StreamData,
  },
  {
    id: 'span-gaps',
    title: 'Span Gaps',
    description: 'spanGaps connects series across null values instead of breaking the line.',
    component: SpanGaps,
  },
  {
    id: 'large-dataset',
    title: 'Large Dataset',
    description: '2,000,000 points rendered with minimal configuration to test performance.',
    component: LargeDataset,
  },
  {
    id: 'no-data',
    title: 'No Data / Edge Cases',
    description: 'Single point, two points, and all-null edge cases.',
    component: NoData,
  },
  {
    id: 'grid-over-series',
    title: 'Grid Over Series',
    description: 'Default grid-behind vs grid-over-series using onDraw hook.',
    component: GridOverSeries,
  },
  {
    id: 'legend',
    title: 'Legend',
    description: 'Legend component at top/bottom with live values and click-to-toggle.',
    component: LegendDemo,
  },
  {
    id: 'time-series',
    title: 'Time Series',
    description: 'Unix timestamps with HH:MM formatting — monitoring dashboard pattern.',
    component: TimeSeries,
  },
];
