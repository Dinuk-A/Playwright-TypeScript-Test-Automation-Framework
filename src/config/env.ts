import * as fs from 'fs';
import * as path from 'path';
import dev from './environments/dev.json';
import { readStoredToken } from '../utils/api/authSession';

/**
 * Replaces Java's ConfigPropertyReader / configs/ecos.properties.
 * - Non-secret values live in src/config/environments/<TEST_ENV>.json
 * - Secrets (tokens) come only from environment variables / a git-ignored .env
 * - dotenv is not installed, so Node's built-in process.loadEnvFile is used (Node >= 20.12).
 */
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const environments = { dev };
type EnvironmentName = keyof typeof environments;

const envName = process.env.TEST_ENV ?? 'dev';
if (!(envName in environments)) {
  throw new Error(
    `Unknown TEST_ENV "${envName}". Known environments: ${Object.keys(environments).join(', ')}`,
  );
}
const cfg = environments[envName as EnvironmentName];

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}. See .env.example`);
  }
  return value;
}

export const env = {
  name: envName,
  ui: { baseUrl: process.env.UI_BASE_URL ?? cfg.ui.baseUrl },
  api: cfg.api,
  tenants: cfg.tenants,
  endpoints: cfg.endpoints,
  /** Public QA practice sites used by the example specs under the tests folders named practice. */
  practice: cfg.practice,
  /**
   * Bearer token for the cart API. Resolved lazily so UI-only runs do not need one.
   * Order: ECOS_AUTH_TOKEN (manual) -> .auth/token.json (captured by src/setup/auth.setup.ts).
   */
  get authToken(): string {
    const token = process.env.ECOS_AUTH_TOKEN ?? readStoredToken();
    if (!token) {
      throw new Error('No API token available. Run the setup project (needs ECOS_TEST_USER_EMAIL / ECOS_TEST_USER_PASSWORD) or set ECOS_AUTH_TOKEN.');
    }
    return token;
  },
  /** Login for the Auth0 setup. Lazy for the same reason. */
  get testUser(): { email: string; password: string } {
    return { email: requiredEnv('ECOS_TEST_USER_EMAIL'), password: requiredEnv('ECOS_TEST_USER_PASSWORD') };
  },
  /** Optional token endpoint (path on the app origin). */
  get tokenEndpoint(): string | undefined {
    return process.env.ECOS_TOKEN_ENDPOINT;
  },
};
