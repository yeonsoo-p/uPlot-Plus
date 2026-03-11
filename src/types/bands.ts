/** Configuration for a band (shaded area between two series). */
export interface BandConfig {
  /** The two series indices within the group: [upper, lower] */
  series: [number, number];
  /** Group index containing both series */
  group: number;
  /** Fill color for the band region */
  fill?: string;
  /** Direction: -1=below only, 0=between (both sides), 1=above only */
  dir?: -1 | 0 | 1;
}
