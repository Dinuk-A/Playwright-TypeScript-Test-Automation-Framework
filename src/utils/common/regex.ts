export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches a whole CSS class token inside a class attribute (stricter than Java's substring check). */
export function classTokenRegExp(className: string): RegExp {
  return new RegExp(`(^|\\s)${escapeRegExp(className)}(\\s|$)`);
}
