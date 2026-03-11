import type { ChartData } from './data';
import type { DrawCallback, CursorDrawCallback } from './hooks';

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
  /** Draw on the persistent layer (after series, before snapshot). */
  onDraw?: DrawCallback;
  /** Draw on the cursor overlay (redrawn every frame). */
  onCursorDraw?: CursorDrawCallback;
  /** Sync key — charts with the same key synchronize their cursors. */
  syncKey?: string;
}
