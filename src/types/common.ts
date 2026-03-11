/** Numeric array type used for data */
export type NumArray = number[] | Float64Array;

/** Nullable numeric array (supports gaps in data). Float64Array cannot hold null, so use NumArray for gap-free data. */
export type NullableNumArray = (number | null)[];

/** Bounding box in CSS pixels */
export interface BBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Range with min/max */
export interface Range {
  min: number;
  max: number;
}

/** Side of chart: Top=0, Right=1, Bottom=2, Left=3 */
export const enum Side {
  Top    = 0,
  Right  = 1,
  Bottom = 2,
  Left   = 3,
}

/** Orientation: Horizontal=0 (top/bottom), Vertical=1 (left/right) */
export const enum Orientation {
  Horizontal = 0,
  Vertical   = 1,
}

/** Direction: Forward=1 (L→R / B→T), Backward=-1 (R→L / T→B) */
export const enum Direction {
  Forward  =  1,
  Backward = -1,
}

/** Distribution type for scales */
export const enum Distribution {
  Linear  = 1,
  Ordinal = 2,
  Log     = 3,
  Asinh   = 4,
}

/** Sort order for series data */
export const enum SortOrder {
  Ascending  =  1,
  Descending = -1,
  Unsorted   =  0,
}

/** Derive orientation from side: top/bottom → Horizontal, left/right → Vertical */
export function sideOrientation(side: Side): Orientation {
  return (side % 2) as Orientation;
}

/** Pixel rounding function */
export type PxRound = (v: number) => number;

/** Dirty flags for the render scheduler */
export const enum DirtyFlag {
  None    = 0,
  Scales  = 1,
  Axes    = 2,
  Paths   = 4,
  Cursor  = 8,
  Select  = 16,
  Size    = 32,
  Full    = 63,
}
