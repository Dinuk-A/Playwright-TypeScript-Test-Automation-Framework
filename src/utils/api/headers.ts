export type Headers = Record<string, string>;

/** Replace PWAPIUtils.getWithBearerToken / BasicAuth / ApiKey / Cookies / postWith*. */

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
