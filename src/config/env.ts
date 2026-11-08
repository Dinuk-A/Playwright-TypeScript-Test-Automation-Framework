import * as fs from 'fs';
import * as path from 'path';
import practice from './environments/practice.json';

/**
 * Replaces Java's ConfigPropertyReader / properties files.
 * - URLs live in src/config/environments/<TEST_ENV>.json (never hardcode them in tests)
 * - Any value can be overridden by an environment variable or a git-ignored .env
 * - dotenv is not installed, so Node's built-in process.loadEnvFile is used (Node >= 20.12)
 */
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const environments = { practice };
type EnvironmentName = keyof typeof environments;

const envName = process.env.TEST_ENV ?? 'practice';
if (!(envName in environments)) {
  throw new Error(`Unknown TEST_ENV "${envName}". Known environments: ${Object.keys(environments).join(', ')}`);
}
const cfg = environments[envName as EnvironmentName];

export const env = {
  name: envName,
  /** Public QA practice sites used by the example specs. */
  practice: {
    herokuappBaseUrl: process.env.HEROKUAPP_BASE_URL ?? cfg.herokuappBaseUrl,
    jsonPlaceholderBaseUrl: process.env.JSONPLACEHOLDER_BASE_URL ?? cfg.jsonPlaceholderBaseUrl,
  },
};
