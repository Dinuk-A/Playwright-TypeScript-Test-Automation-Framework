/** Port of Java JsonUtils.createJsonFromMap. */
export function createJsonFromMap(dataMap: Record<string, unknown>): string {
  return JSON.stringify(dataMap);
}
