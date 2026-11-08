import { APIResponse } from '@playwright/test';

/**
 * Port of Java PWResponseHelpers. closeApiContext is not ported: the cartApi/productApi fixtures
 * dispose their contexts. Java getResponseAsJson returned the raw string; json() returns parsed data.
 */
export function getStatusCode(response: APIResponse): number {
  return response.status();
}
export async function getResponseBody(response: APIResponse): Promise<string> {
  return response.text();
}
export async function getResponseAsJson<T = unknown>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}
export function getResponseHeader(response: APIResponse, headerName: string): string | undefined {
  return response.headers()[headerName.toLowerCase()];
}
export function getResponseHeaders(response: APIResponse): Record<string, string> {
  return response.headers();
}
export function isResponseOk(response: APIResponse): boolean {
  return response.ok();
}
export function verifyStatusCode(response: APIResponse, expectedStatusCode: number): boolean {
  return response.status() === expectedStatusCode;
}
