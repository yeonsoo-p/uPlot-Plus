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

/** Per-scale selection range — data-space bounds plus fractional bounds
 *  along the scale's own axis (0..1). The fractional range reflects the
 *  selection's extent on whichever screen dimension the scale maps to. */
export interface SelectScaleRange {
  min: number;
  max: number;
  /** Fractional start along the scale's axis (0..1) */
  fracStart: number;
  /** Fractional end along the scale's axis (0..1) */
  fracEnd: number;
}

/** Info about a completed drag selection */
export interface SelectEventInfo {
  /** Data-space min/max (with fractional bounds) for each scale reported.
   *  Horizontal scales get fractions along plotBox.width; vertical scales along
   *  plotBox.height. When a reaction narrows the set (e.g. `zoomX`), only the
   *  matching axis orientation is reported. */
  ranges: Record<string, SelectScaleRange>;
  /** Fractional left edge along plotBox.width (0..1). Always horizontal —
   *  preserved for backwards compatibility; prefer `ranges[scaleId]` for
   *  orientation-aware consumers. */
  left: number;
  /** Fractional right edge along plotBox.width (0..1). @see `left` */
  right: number;
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
