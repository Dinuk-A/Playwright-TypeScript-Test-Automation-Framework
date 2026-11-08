import * as fs from 'fs';
import * as path from 'path';
import { getJsonValue } from './jsonPath';

/** Port of Java JsonReader. Relative paths resolve from the project root (process.cwd()). */
const resolve = (filePath: string): string => path.resolve(process.cwd(), filePath);

export function readStaticJsonFile(filePath: string): string {
  try {
    return fs.readFileSync(resolve(filePath), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${filePath} (${(error as Error).message})`);
  }
}

/** Replaces every {{key}} placeholder in the file with its value. */
export function loadAndReplaceJsonPlaceholders(filePath: string, placeholders: Record<string, string>): string {
  let json = readStaticJsonFile(filePath);
  for (const [key, value] of Object.entries(placeholders)) {
    json = json.split(`{{${key}}}`).join(value);
  }
  return json;
}

export function readJsonFileOnce<T = unknown>(filePath: string): T {
  const file = resolve(filePath);
  if (!fs.existsSync(file)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch (error) {
    throw new Error(`Failed to read JSON from file: ${filePath} (${(error as Error).message})`);
  }
}

/** Top-level key lookup. Returns undefined when the key is absent. */
export function fetchJsonValueByKey<T = unknown>(filePath: string, key: string): T | undefined {
  const root = readJsonFileOnce<Record<string, unknown>>(filePath);
  return root[key] as T | undefined;
}

/**
 * Dotted-path lookup, e.g. fetchJsonValueByPath(file, 'en') or 'en[0].subCategories'.
 * Returns the parsed value (not a JSON string) or undefined when the path does not exist.
 */
export function fetchJsonValueByPath<T = unknown>(filePath: string, jsonPath: string): T | undefined {
  return getJsonValue(readJsonFileOnce(filePath), jsonPath) as T | undefined;
}
