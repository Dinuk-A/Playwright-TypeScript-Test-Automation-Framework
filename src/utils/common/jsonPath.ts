/**
 * Minimal JSON path resolver replacing RestAssured's JsonPath for the paths used in the Java tests.
 * Supports: "a.b", "a.b[0].c", "items[2]", optional leading "$." / "$".
 * Not supported: Groovy GPath functions (size(), find{}), keys containing dots.
 * Returns undefined when any segment is missing (RestAssured returned null).
 */
export function getJsonValue(root: unknown, jsonPath: string): unknown {
  const path = jsonPath.replace(/^\$\.?/, '');
  if (!path) {
    return root;
  }
  const tokens = path.match(/[^.[\]]+/g) ?? [];
  let current: unknown = root;
  for (const token of tokens) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current) && /^\d+$/.test(token)) {
      current = current[Number(token)];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[token];
    } else {
      return undefined;
    }
  }
  return current;
}

export type JsonType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';

export function jsonTypeOf(value: unknown): JsonType {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonType;
}
