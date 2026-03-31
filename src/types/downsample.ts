import type { NullableNumArray } from './common';

/** Result of LTTB downsampling */
export interface LttbResult {
  /** Selected indices into the original arrays */
  indices: Uint32Array;
  /** Downsampled x values */
  x: Float64Array;
  /** Downsampled y values (null gaps preserved) */
  y: NullableNumArray;
}
