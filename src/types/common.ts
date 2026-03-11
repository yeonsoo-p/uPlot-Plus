/** Numeric array type used for data */
export type NumArray = number[] | Float64Array;

/** Nullable numeric array (supports gaps in data) */
export type NullableNumArray = (number | null)[] | Float64Array;

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

/** Side constants: 0=top, 1=right, 2=bottom, 3=left */
export type Side = 0 | 1 | 2 | 3;

/** Orientation: 0=horizontal, 1=vertical */
export type Orientation = 0 | 1;

/** Direction: 1=left-to-right/bottom-to-top, -1=reverse */
export type Direction = 1 | -1;

/** Distribution type: 1=linear, 2=ordinal, 3=log, 4=asinh */
export type Distribution = 1 | 2 | 3 | 4;

/** Sort order: 1=ascending, -1=descending, 0=unsorted */
export type SortOrder = 1 | -1 | 0;

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
