/** Dependency-free JWT inspection (payload only, no signature check). Used to decide whether a stored token is still usable. */
export function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split('.');
  if (parts.length < 2) {
    return undefined;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** Seconds until `exp`, negative if already expired, undefined if the token has no readable exp. */
export function secondsUntilExpiry(token: string): number | undefined {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === 'number' ? exp - Math.floor(Date.now() / 1000) : undefined;
}
