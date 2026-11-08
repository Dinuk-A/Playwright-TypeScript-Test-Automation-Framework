import { Page, Request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { secondsUntilExpiry } from '../common/jwt';

/**
 * Session persistence for the Auth0 login done once in src/setup/auth.setup.ts.
 * Must NOT import config/env (env imports readStoredToken from here).
 * Everything lives in the git-ignored .auth/ folder.
 */
export const AUTH_DIR = path.resolve(process.cwd(), '.auth');
export const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'user.json');
export const TOKEN_PATH = path.join(AUTH_DIR, 'token.json');

export function readStoredToken(): string | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')) as { token?: unknown };
    return typeof parsed.token === 'string' ? parsed.token : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredToken(token: string): void {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({ token, savedAt: new Date().toISOString() }, null, 2), 'utf-8');
}

/** True when both the browser state and a token with more than `minSecondsLeft` of life exist. */
export function isSessionFresh(minSecondsLeft = 600): boolean {
  const token = readStoredToken();
  if (!token || !fs.existsSync(STORAGE_STATE_PATH)) {
    return false;
  }
  const left = secondsUntilExpiry(token);
  return left !== undefined && left > minSecondsLeft;
}

/**
 * Resolves with the first Authorization bearer token the browser sends to one of the given API
 * base URLs. Attach BEFORE logging in / navigating; anonymous requests (no header) are ignored.
 */
export function captureBearerToken(page: Page, apiBaseUrls: string[], timeoutMs: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;

    const onRequest = async (request: Request): Promise<void> => {
      if (!apiBaseUrls.some((base) => request.url().startsWith(base))) {
        return;
      }
      try {
        const authorization = (await request.allHeaders())['authorization'];
        const match = authorization?.match(/^Bearer\s+(.+)$/i);
        if (match) {
          clearTimeout(timer);
          page.off('request', onRequest);
          resolve(match[1]);
        }
      } catch {
        // page closed mid-request: the timeout below reports the failure
      }
    };

    timer = setTimeout(() => {
      page.off('request', onRequest);
      reject(new Error(
        `No Authorization bearer header was seen on requests to ${apiBaseUrls.join(' or ')} within ${timeoutMs}ms. ` +
        'The app may call the APIs server-side; set ECOS_TOKEN_ENDPOINT instead (see docs/AUTH_SETUP.md).',
      ));
    }, timeoutMs);

    page.on('request', onRequest);
  });
}

/** Fallback: ask an app endpoint for the session token (uses the logged-in browser cookies). */
export async function fetchTokenFromEndpoint(page: Page, appBaseUrl: string, endpointPath: string): Promise<string> {
  const response = await page.request.get(new URL(endpointPath, appBaseUrl).toString());
  if (!response.ok()) {
    throw new Error(`Token endpoint ${endpointPath} returned HTTP ${response.status()}`);
  }
  const body = (await response.json()) as Record<string, unknown>;
  const token = [body.token, body.accessToken, body.access_token, body.idToken].find((v) => typeof v === 'string');
  if (typeof token !== 'string') {
    throw new Error(`Token endpoint ${endpointPath} returned no token/accessToken/access_token/idToken field`);
  }
  return token;
}
