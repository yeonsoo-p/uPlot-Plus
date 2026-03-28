import type { DataInput } from './data';
import type { DrawCallback, CursorDrawCallback } from './hooks';
import type { ChartEventInfo, SelectEventInfo, ScaleChangeCallback } from './events';

/** Focus mode configuration */
export interface FocusConfig {
  /** Alpha opacity for non-focused series (default: 0.15) */
  alpha?: number;
}

/** Modifier key for axis-specific wheel zoom */
export interface WheelZoomAxisConfig {
  /** Modifier key required to activate zoom on this axis. If omitted, no modifier needed. */
  key?: 'shift' | 'alt' | 'ctrl';
}

/** Object form of wheelZoom: configure each axis independently with optional modifier keys */
export interface WheelZoomConfig {
  x?: boolean | WheelZoomAxisConfig;
  y?: boolean | WheelZoomAxisConfig;
}

/** Cursor/interaction configuration */
export interface CursorConfig {
  /**
   * Enable mouse wheel zoom (default: false).
   * - `true` or `'x'`: zoom x-axis only (no modifier key needed)
   * - `'y'`: zoom y-axis only
   * - `'xy'`: zoom both axes simultaneously
   * - `{ x, y }`: configure each axis independently with optional modifier keys
   *   e.g. `{ x: { key: 'shift' }, y: { key: 'alt' } }`
   */
  wheelZoom?: boolean | 'x' | 'y' | 'xy' | WheelZoomConfig;
  /** Focus mode: dims non-closest series on hover */
  focus?: FocusConfig;
}

/** Props for the Chart component */
export interface ChartProps {
  /** Width in CSS pixels */
  width: number;
  /** Height in CSS pixels */
  height: number;
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
  /** Cursor and interaction config */
  cursor?: CursorConfig;

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
}
