/** Cursor state */
export interface CursorState {
  /** CSS pixel position from plot left edge (-10 = off) */
  left: number;
  /** CSS pixel position from plot top edge (-10 = off) */
  top: number;
  /** Active group index (which xGroup the closest point belongs to) */
  activeGroup: number;
  /** Active series index within the group */
  activeSeriesIdx: number;
  /** Active data index within the series's x array */
  activeDataIdx: number;
}

/** Selection rectangle state */
export interface SelectState {
  show: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
}
