import { genIncrs } from './utils';

const allMults = [1, 2, 2.5, 5];
const onlyWhole = (v: number) => v % 1 === 0;

/** Decimal increments: ...0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5 */
export const decIncrs = genIncrs(10, -32, 0, allMults);

/** Integer increments: 1, 2, 2.5, 5, 10, 20, 25, 50... */
export const oneIncrs = genIncrs(10, 0, 32, allMults);

/** Whole-number increments: 1, 2, 5, 10, 20, 25, 50... */
export const wholeIncrs = oneIncrs.filter(onlyWhole);

/** Combined numeric increments (decimal + integer) */
export const numIncrs = decIncrs.concat(oneIncrs);
