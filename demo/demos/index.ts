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
];
