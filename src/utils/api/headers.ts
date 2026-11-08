import { env } from '../../config/env';

export type Headers = Record<string, string>;

// ---- project-specific (mirror headersFor / headersForMissingAuth / ...)
export function tenantHeaders(tenant: string): Headers {
  return { [env.api.tenantHeaderKey]: tenant };
}

export function authHeaders(tenant: string): Headers {
  return { ...tenantHeaders(tenant), ...bearerHeaders(env.authToken) };
}

export function invalidAuthHeaders(tenant: string): Headers {
  return { ...tenantHeaders(tenant), ...bearerHeaders('invalid.token.value') };
}

export function missingTenantHeaders(): Headers {
  return bearerHeaders(env.authToken);
}

// ---- generic (replace PWAPIUtils.getWithBearerToken / BasicAuth / ApiKey / Cookies / postWith*)
/** Java's getWithBearerToken built "Bearer"+token with no space (bug); this inserts the space. */
export function bearerHeaders(token: string): Headers {
  return { Authorization: `Bearer ${token}` };
}

export function basicAuthHeaders(username: string, password: string): Headers {
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` };
}

export function apiKeyHeaders(apiKeyName: string, apiKeyValue: string): Headers {
  return { [apiKeyName]: apiKeyValue };
}

export function cookieHeaders(cookies: Record<string, string>): Headers {
  return { Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') };
}
