import { APIResponse, expect } from '@playwright/test';
import { getJsonValue, JsonType, jsonTypeOf } from '../common/jsonPath';

/**
 * Port of Java PWAssertionUtils. JSON paths: "a.b[0].c" (see common/jsonPath.ts).
 * Async because APIResponse bodies are read asynchronously.
 */
async function bodyJson(response: APIResponse): Promise<unknown> {
  return JSON.parse(await response.text());
}

export function assertStatusCode(response: APIResponse, expectedCode: number): void {
  expect(response.status(), 'Status code is not as expected.').toBe(expectedCode);
}

export function assertContentType(response: APIResponse, expectedContentType: string): void {
  const actual = response.headers()['content-type'];
  expect(actual ?? '', `Expected Content-Type: ${expectedContentType} but got: ${actual}`).toContain(expectedContentType);
}

export async function assertJsonFieldEquals(response: APIResponse, jsonPath: string, expectedValue: unknown): Promise<void> {
  expect(getJsonValue(await bodyJson(response), jsonPath), `Expected value at '${jsonPath}' does not match.`).toEqual(expectedValue);
}

export async function assertJsonFieldNotNull(response: APIResponse, jsonPath: string): Promise<void> {
  const value = getJsonValue(await bodyJson(response), jsonPath);
  expect(value ?? null, `Expected field '${jsonPath}' to be not null.`).not.toBeNull();
}

/** Passes for both JSON null and an absent field (RestAssured returned null for both). */
export function assertJsonFieldIsNull(rawJson: string, jsonPath: string): void {
  const value = getJsonValue(JSON.parse(rawJson), jsonPath);
  expect(value ?? null, `Expected field '${jsonPath}' to be null, but it was: ${JSON.stringify(value)}`).toBeNull();
}

export function assertJsonFieldType(rawJson: string, jsonPath: string, expectedType: JsonType): void {
  const value = getJsonValue(JSON.parse(rawJson), jsonPath);
  expect(value ?? null, `Field at '${jsonPath}' is null.`).not.toBeNull();
  expect(jsonTypeOf(value), `Expected type ${expectedType} for field '${jsonPath}'.`).toBe(expectedType);
}

export async function assertResponseBodyContainsText(response: APIResponse, expectedText: string): Promise<void> {
  assertResponseBodyContains(await response.text(), expectedText);
}

export function assertResponseBodyContains(actualBody: string, expectedText: string): void {
  expect(actualBody, `Response body does not contain expected text: ${expectedText}`).toContain(expectedText);
}

/** Empty means '', '[]' or '{}'. */
export function assertResponseBodyIsEmpty(responseBody: string): void {
  const trimmed = responseBody.trim();
  expect(['', '[]', '{}'], `Response body is not empty. Actual body: ${trimmed}`).toContain(trimmed);
}

export function assertResponseTime(responseTimeMs: number, maxTimeMs: number): void {
  expect(responseTimeMs, `Response time exceeded limit. Actual: ${responseTimeMs}ms, Maximum: ${maxTimeMs}ms`).toBeLessThan(maxTimeMs);
}
