function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/** Flat shallow-compare (no nesting) — used for one-level-deep sub-objects. */
function shallowEqualFlat(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysB) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Shallow-compare two config objects by top-level key identity (===),
 * with one extra level of depth for plain-object values.
 *
 * This handles the common React pattern of inline config sub-objects:
 *   <Axis grid={{ show: true, stroke: '#ccc' }} />
 * where each render creates a new `grid` reference even though values are identical.
 */
export function shallowEqual(a: object | null, b: object): boolean {
  if (a === null) return false;
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const objA = a;
  const objB = b;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysB) {
    const valA = objA[key];
    const valB = objB[key];
    if (valA === valB) continue;
    // One level deeper for plain objects (config nesting pattern)
    if (isPlainObject(valA) && isPlainObject(valB)) {
      if (!shallowEqualFlat(valA, valB)) return false;
    } else {
      return false;
    }
  }
  return true;
}
