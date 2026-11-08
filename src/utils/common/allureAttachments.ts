import { APIResponse, test } from '@playwright/test';
import { getJsonValue } from './jsonPath';

/**
 * Port of the generic (non-RestAssured) parts of Java AllureLogger: logText, logJsonResponse,
 * logError, logField, logCustomFields, logJsonField. Request/response logging for APIs lives in ApiClient.
 */
export async function attachText(name: string, content: string): Promise<void> {
  await test.info().attach(name, { body: content, contentType: 'text/plain' });
}

export async function attachJson(name: string, data: unknown): Promise<void> {
  const body = typeof data === 'string' ? safePretty(data) : JSON.stringify(data, null, 2);
  await test.info().attach(name, { body, contentType: 'application/json' });
}

export async function attachError(name: string, error: Error): Promise<void> {
  await attachText(name, `=== ERROR DETAILS ===\nError Type: ${error.name}\nError Message: ${error.message}\n\nStack Trace:\n${error.stack ?? ''}`);
}

export async function attachField(name: string, fieldName: string, fieldValue: unknown): Promise<void> {
  await attachText(name, `=== FIELD DETAILS ===\n${fieldName}: ${fieldValue ?? 'null'}`);
}

export async function attachCustomFields(name: string, fields: Record<string, unknown> | undefined): Promise<void> {
  const lines = fields && Object.keys(fields).length > 0
    ? Object.entries(fields).map(([k, v]) => `${k}: ${v ?? 'null'}`).join('\n')
    : 'No fields provided.';
  await attachText(name, `=== CUSTOM FIELDS ===\n${lines}`);
}

export async function attachJsonField(name: string, response: APIResponse, jsonPath: string): Promise<void> {
  try {
    const value = getJsonValue(await response.json(), jsonPath);
    await attachText(name, `=== JSON FIELD ===\n${jsonPath}: ${value === undefined || value === null ? 'null' : JSON.stringify(value)}`);
  } catch (error) {
    await attachText(name, `Failed to extract field '${jsonPath}' from JSON: ${(error as Error).message}`);
  }
}

function safePretty(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
