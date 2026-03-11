/** Nearest data point resolved from cursor position */
export interface NearestPoint {
  /** XGroup index */
  group: number;
  /** Series index within the group */
  seriesIdx: number;
  /** Data array index */
  dataIdx: number;
  /** X data value */
  xVal: number;
  /** Y data value */
  yVal: number;
  /** CSS pixel X of the snapped point (relative to plot left) */
  pxX: number;
  /** CSS pixel Y of the snapped point (relative to plot top) */
  pxY: number;
  /** Pixel distance from cursor to this point */
  dist: number;
}

/** Resolved chart event data — passed to all interaction callbacks */
export interface ChartEventInfo {
  /** CSS pixel X within the plot area */
  plotX: number;
  /** CSS pixel Y within the plot area */
  plotY: number;
  /** The nearest data point (null if no data is close) */
  point: NearestPoint | null;
  /** The original DOM event */
  srcEvent: MouseEvent | TouchEvent;
}

/** Info about a completed drag selection */
export interface SelectEventInfo {
  /** Fractional left edge [0..1] */
  left: number;
  /** Fractional right edge [0..1] */
  right: number;
  /** Data-space min/max for each x-scale */
  ranges: Record<string, { min: number; max: number }>;
}

/** Callback for scale range changes (zoom/pan) */
export type ScaleChangeCallback = (scaleId: string, min: number, max: number) => void;

/** Callback for selection events — return false to prevent zoom */
export type SelectCallback = (sel: SelectEventInfo) => boolean | void;

/** Bag of event callbacks stored on ChartStore — updated via refs from Chart props */
export interface EventCallbacks {
  onClick?: (info: ChartEventInfo) => void;
  onContextMenu?: (info: ChartEventInfo) => void;
  onDblClick?: (info: ChartEventInfo) => boolean | void;
  onCursorMove?: (info: ChartEventInfo) => void;
  onCursorLeave?: () => void;
  onScaleChange?: ScaleChangeCallback;
  onSelect?: SelectCallback;
}
