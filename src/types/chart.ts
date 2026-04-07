import type { DataInput } from './data';
import type { DrawCallback, CursorDrawCallback } from './hooks';
import type { ChartEventInfo, SelectEventInfo, ScaleChangeCallback } from './events';
import type { ActionList } from './interaction';
import type { ChartTheme } from './theme';

/** Size value: explicit pixels or "auto" to fill container */
export type SizeValue = number | 'auto';

/** Props for the Chart component */
export interface ChartProps {
  /** Width in CSS pixels, or "auto" to fill container width */
  width: SizeValue;
  /** Height in CSS pixels, or "auto" to fill container height */
  height: SizeValue;
  /** Minimum width in CSS pixels (only used when width="auto") */
  minWidth?: number;
  /** Minimum height in CSS pixels (only used when height="auto") */
  minHeight?: number;
  /** Chart data — accepts {x,y}, [{x,y}], or [{x, series:[...]}] */
  data: DataInput;
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
  /** Chart title displayed above the plot area */
  title?: string;
  /** X-axis label for the default axis (default: 'X Axis') */
  xlabel?: string;
  /** Y-axis label for the default axis (default: 'Y Axis') */
  ylabel?: string;
  /** Accessible label for the chart container (overrides auto-generated label from title) */
  ariaLabel?: string;
  /**
   * Action overrides: array of [action, reaction] tuples merged with defaults.
   * Example: `actions={[['wheel', 'zoomXY'], ['leftDblclick', 'none']]}`
   */
  actions?: ActionList;

  // --- Event callbacks ---

  /** Fires on click within the plot area, with resolved nearest point */
  onClick?: (info: ChartEventInfo) => void;
  /** Fires on right-click within the plot area */
  onContextMenu?: (info: ChartEventInfo) => void;
  /** Fires on double-click (before zoom reset) — return false to prevent reset */
  onDblClick?: (info: ChartEventInfo) => boolean | void;
  /** Fires when cursor moves over the plot */
  onCursorMove?: (info: ChartEventInfo) => void;
  /** Fires when cursor leaves the plot area */
  onCursorLeave?: () => void;
  /** Fires after a scale range changes (zoom, pan, or programmatic) */
  onScaleChange?: ScaleChangeCallback;
  /** Fires when drag selection completes (before zoom is applied) — return false to prevent zoom */
  onSelect?: (sel: SelectEventInfo) => boolean | void;
  /** Theme overrides — sets CSS custom properties on the chart wrapper. */
  theme?: ChartTheme;
  /** BCP 47 locale tag for number/date formatting (default: browser locale) */
  locale?: string;
  /** IANA timezone for time axis labels (default: browser local timezone) */
  timezone?: string;
}
