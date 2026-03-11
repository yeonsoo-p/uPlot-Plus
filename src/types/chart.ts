import type { ChartData } from './data';

/** Props for the Chart component */
export interface ChartProps {
  /** Width in CSS pixels */
  width: number;
  /** Height in CSS pixels */
  height: number;
  /** Chart data */
  data: ChartData;
  /** React children (Scale, Series, Axis, Legend, Tooltip, Band) */
  children?: React.ReactNode;
  /** CSS class name */
  className?: string;
  /** Device pixel ratio override (default: window.devicePixelRatio) */
  pxRatio?: number;
}
