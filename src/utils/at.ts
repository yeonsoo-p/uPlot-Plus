/**
 * Type-safe array access helper.
 *
 * With `noUncheckedIndexedAccess` enabled, `arr[i]` returns `T | undefined`.
 * This helper centralises the single unavoidable assertion so call-sites
 * stay clean.  Use only when the index is known to be valid.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export function at<T>(arr: ArrayLike<T>, i: number): T { return arr[i] as T; }
